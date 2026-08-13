const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { planBackupRetention } = require('../lib/backup-retention');

const CONFIRMATION = 'APPLY METRICS PORTAL BACKUP RETENTION';
const BACKUP_PATTERN = /^metrics-portal-(\d{8})-(\d{6})\.dump$/;

function getArgument(name) {
    const prefix = `${name}=`;
    const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
    return argument ? argument.slice(prefix.length) : null;
}

function parsePositive(name, fallback) {
    const raw = getArgument(name);
    const value = raw === null ? fallback : Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > 366) throw new Error(`${name} must be an integer from 1 to 366.`);
    return value;
}

function createdAtFromName(file) {
    const match = path.basename(file).match(BACKUP_PATTERN);
    if (!match) return null;
    const date = match[1];
    const time = match[2];
    return new Date(
        Number(date.slice(0, 4)), Number(date.slice(4, 6)) - 1, Number(date.slice(6, 8)),
        Number(time.slice(0, 2)), Number(time.slice(2, 4)), Number(time.slice(4, 6))
    );
}

function sha256(file) {
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(file));
    return hash.digest('hex').toUpperCase();
}

function verifiedBackups(root) {
    return fs.readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isFile() && BACKUP_PATTERN.test(entry.name))
        .map((entry) => {
            const file = path.join(root, entry.name);
            const metadataFile = `${file}.json`;
            if (!fs.existsSync(metadataFile)) throw new Error(`${entry.name} is missing its verification sidecar.`);
            const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8').replace(/^\uFEFF/, ''));
            if (!metadata.Sha256 || sha256(file) !== String(metadata.Sha256).toUpperCase()) {
                throw new Error(`${entry.name} failed SHA-256 verification; retention is blocked.`);
            }
            return { file, metadataFile, createdAt: createdAtFromName(file), bytes: fs.statSync(file).size };
        });
}

function main() {
    const root = getArgument('--backup-root');
    const apply = process.argv.includes('--apply');
    if (!root) throw new Error('--backup-root is required.');
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error('Backup root does not exist or is not a directory.');
    if (apply && getArgument('--confirmation') !== CONFIRMATION) {
        throw new Error(`Retention apply requires --confirmation="${CONFIRMATION}".`);
    }
    const options = {
        daily: parsePositive('--daily', 14),
        weekly: parsePositive('--weekly', 8),
        monthly: parsePositive('--monthly', 12)
    };
    const records = verifiedBackups(root);
    if (!records.length) throw new Error('No verified Metrics Portal backups were found.');
    const byFile = new Map(records.map((record) => [record.file, record]));
    const plan = planBackupRetention(records, options);
    const remove = plan.filter((record) => !record.keep);
    const bytes = remove.reduce((sum, record) => sum + byFile.get(record.file).bytes, 0);

    console.log('Metrics Portal backup retention');
    console.log(`  Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
    console.log(`  Policy: ${options.daily} daily, ${options.weekly} weekly, ${options.monthly} monthly`);
    console.log(`  Verified backups inspected: ${records.length}`);
    console.log(`  Recovery points retained: ${plan.length - remove.length}`);
    console.log(`  Backups eligible for removal: ${remove.length}`);
    console.log(`  Eligible bytes: ${bytes}`);
    remove.forEach((record) => console.log(`    ${path.basename(record.file)}`));
    if (!apply) {
        console.log('  Result: dry run complete; no file changed.');
        return;
    }
    for (const record of remove) {
        const source = byFile.get(record.file);
        fs.unlinkSync(source.file);
        fs.unlinkSync(source.metadataFile);
    }
    console.log(`  Removed verified backup pairs: ${remove.length}`);
    console.log('  Result: retention applied.');
}

try {
    main();
} catch (error) {
    console.error(`Backup retention failed: ${error.message}`);
    process.exitCode = 1;
}

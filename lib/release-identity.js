const fs = require('fs');
const path = require('path');

function normalizeCommit(value) {
    const commit = String(value || '').trim();
    return /^[0-9a-f]{7,64}$/i.test(commit) ? commit.toLowerCase() : '';
}

function resolveGitDirectory(appRoot) {
    const dotGit = path.join(appRoot, '.git');
    const stat = fs.statSync(dotGit);
    if (stat.isDirectory()) return dotGit;
    const pointer = fs.readFileSync(dotGit, 'utf8').trim().match(/^gitdir:\s*(.+)$/i);
    if (!pointer) throw new Error('Unrecognized Git worktree pointer.');
    return path.resolve(appRoot, pointer[1]);
}

function readPackedReference(gitDirectory, reference) {
    const packedPath = path.join(gitDirectory, 'packed-refs');
    if (!fs.existsSync(packedPath)) return '';
    for (const line of fs.readFileSync(packedPath, 'utf8').split(/\r?\n/)) {
        if (!line || line.startsWith('#') || line.startsWith('^')) continue;
        const [commit, name] = line.trim().split(/\s+/, 2);
        if (name === reference) return normalizeCommit(commit);
    }
    return '';
}

function readGitCommit(appRoot) {
    const gitDirectory = resolveGitDirectory(appRoot);
    const head = fs.readFileSync(path.join(gitDirectory, 'HEAD'), 'utf8').trim();
    const detached = normalizeCommit(head);
    if (detached) return detached;
    const match = head.match(/^ref:\s*(.+)$/);
    if (!match) return '';
    const reference = match[1].trim();
    const loosePath = path.join(gitDirectory, ...reference.split('/'));
    if (fs.existsSync(loosePath)) return normalizeCommit(fs.readFileSync(loosePath, 'utf8'));
    return readPackedReference(gitDirectory, reference);
}

function getDeploymentCommit(env = process.env, appRoot = path.join(__dirname, '..')) {
    const configured = normalizeCommit(env.APP_COMMIT || env.GIT_COMMIT);
    if (configured) return configured;
    try {
        return readGitCommit(appRoot) || 'unknown';
    } catch {
        return 'unknown';
    }
}

module.exports = {
    getDeploymentCommit,
    normalizeCommit,
    readGitCommit
};

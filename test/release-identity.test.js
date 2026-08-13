const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getDeploymentCommit, normalizeCommit, readGitCommit } = require('../lib/release-identity');

test('release identity accepts only a safe configured Git commit', () => {
    assert.equal(normalizeCommit('ABCDEF1234567'), 'abcdef1234567');
    assert.equal(normalizeCommit('main'), '');
    assert.equal(normalizeCommit('abc123; token=value'), '');
    assert.equal(getDeploymentCommit({ APP_COMMIT: '1234567abcdef' }, 'missing'), '1234567abcdef');
});

test('release identity reads detached and referenced Git worktrees', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'metrics-release-'));
    try {
        const gitDirectory = path.join(root, '.git');
        fs.mkdirSync(gitDirectory);
        fs.writeFileSync(path.join(gitDirectory, 'HEAD'), 'abcdef1234567890\n');
        assert.equal(readGitCommit(root), 'abcdef1234567890');

        fs.mkdirSync(path.join(gitDirectory, 'refs', 'heads'), { recursive: true });
        fs.writeFileSync(path.join(gitDirectory, 'HEAD'), 'ref: refs/heads/main\n');
        fs.writeFileSync(path.join(gitDirectory, 'refs', 'heads', 'main'), '1234567890abcdef\n');
        assert.equal(readGitCommit(root), '1234567890abcdef');
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('release identity supports linked worktree pointers and unknown fallback', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'metrics-worktree-'));
    const gitDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'metrics-gitdir-'));
    try {
        fs.writeFileSync(path.join(root, '.git'), `gitdir: ${gitDirectory}\n`);
        fs.writeFileSync(path.join(gitDirectory, 'HEAD'), 'fedcba9876543210\n');
        assert.equal(readGitCommit(root), 'fedcba9876543210');
        assert.equal(getDeploymentCommit({}, path.join(root, 'missing')), 'unknown');
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
        fs.rmSync(gitDirectory, { recursive: true, force: true });
    }
});

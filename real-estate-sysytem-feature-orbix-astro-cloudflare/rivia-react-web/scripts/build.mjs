import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false, ...options });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (platform() !== 'win32') {
  run('npm', ['run', 'build:inner']);
  run('node', ['scripts/generate-sitemap.mjs']);
  run('node', ['scripts/prerender.mjs']);
  process.exit(0);
}

run('subst', ['X:', process.cwd()]);

try {
  run('cmd.exe', ['/d', '/s', '/c', 'cd /d X:\\ && npm.cmd run build:inner']);
  run('node', ['scripts/generate-sitemap.mjs']);
  run('node', ['scripts/prerender.mjs']);
} finally {
  spawnSync('cmd.exe', ['/d', '/s', '/c', 'subst X: /D'], { stdio: 'ignore', shell: false });
}

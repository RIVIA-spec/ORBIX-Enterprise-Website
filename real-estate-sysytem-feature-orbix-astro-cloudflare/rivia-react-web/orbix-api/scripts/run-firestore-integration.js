const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectId = 'orbix-local-dev';
const host = '127.0.0.1';
const port = 8080;
const jar = path.join(os.homedir(), '.cache', 'firebase', 'emulators', 'cloud-firestore-emulator-v1.21.0.jar');
const javaCandidates = [
  process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
  'C:\\Program Files\\Java\\jdk-25.0.1\\bin\\java.exe',
  'java'
].filter(Boolean);

if (!fs.existsSync(jar)) {
  throw new Error(`Firestore emulator jar not found: ${jar}`);
}

function canConnect() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForEmulator() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await canConnect()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Firestore emulator did not start in time');
}

function spawnFirst(commandCandidates, args, options) {
  for (const command of commandCandidates) {
    try {
      const child = spawn(command, args, options);
      child.once('error', () => undefined);
      return child;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error('Unable to start Java');
}

async function main() {
  const emulator = spawnFirst(
    javaCandidates,
    ['-jar', jar, '--host', host, '--port', String(port), '--project_id', projectId, '--single_project_mode', 'true', '--single_project_mode_error', 'true', '--rules', 'firestore.rules'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  emulator.stdout.on('data', (data) => process.stdout.write(data));
  emulator.stderr.on('data', (data) => process.stderr.write(data));

  try {
    await waitForEmulator();
    const env = {
      ...process.env,
      APP_ENV: 'local',
      NODE_ENV: 'test',
      DATA_BACKEND: 'firestore',
      FIREBASE_TARGET: 'emulator',
      ALLOW_REAL_FIREBASE: 'false',
      RUN_INTEGRATION: 'true',
      FIREBASE_PROJECT_ID: projectId,
      GCLOUD_PROJECT: projectId,
      FIRESTORE_EMULATOR_HOST: `${host}:${port}`,
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099'
    };
    const jestBin = path.join('node_modules', 'jest', 'bin', 'jest.js');
    const test = spawn(process.execPath, [jestBin, '--runInBand', '--testRegex=.*integration-spec\\.ts$'], { stdio: 'inherit', env });
    const code = await new Promise((resolve) => test.on('exit', resolve));
    process.exitCode = code ?? 1;
  } finally {
    emulator.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

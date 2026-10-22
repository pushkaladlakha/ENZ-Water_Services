import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function resolvePythonBinary() {
  const isWindows = process.platform === 'win32';
  const binDir = isWindows ? 'Scripts' : 'bin';
  const binaryName = isWindows ? 'python.exe' : 'python';

  const candidateDirs = [
    process.env.VIRTUAL_ENV,
    path.join(projectRoot, '.venv'),
    path.join(projectRoot, 'backend', '.venv'),
    path.join(projectRoot, 'venv'),
  ].filter(Boolean);

  for (const dir of candidateDirs) {
    const candidatePath = path.join(dir, binDir, binaryName);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  // Fallback to system python
  return isWindows ? 'python' : 'python3';
}

const pythonBin = resolvePythonBinary();
const args = process.argv.slice(2);

const env = {
  ...process.env,
  PYTHONPATH: process.env.PYTHONPATH
    ? `${projectRoot}${path.delimiter}${process.env.PYTHONPATH}`
    : projectRoot,
  PYTHONUNBUFFERED: '1',
};

const child = spawn(pythonBin, args, {
  stdio: 'inherit',
  cwd: projectRoot,
  env,
});

child.on('error', (err) => {
  console.error(`[run-python] Failed to start python process (${pythonBin}):`, err.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    if (child && !child.killed) {
      child.kill(sig);
    }
  });
}

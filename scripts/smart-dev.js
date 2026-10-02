const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(process.cwd(), '.next');
const TURBOPACK_CACHE_DIR = path.join(NEXT_DIR, 'dev', 'cache');

// Colors for terminal output
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

function logInfo(msg) {
  console.log(`${CYAN}${BOLD}[SmartDev Auto-Healer]${RESET} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${GREEN}${BOLD}[SmartDev Auto-Healer]${RESET} ${msg}`);
}

function logWarn(msg) {
  console.log(`${YELLOW}${BOLD}[SmartDev Auto-Healer]${RESET} ${msg}`);
}

function logError(msg) {
  console.log(`${RED}${BOLD}[SmartDev Auto-Healer]${RESET} ${msg}`);
}

function safeCleanCache() {
  logWarn('Cleaning corrupted Turbopack cache...');
  try {
    if (fs.existsSync(TURBOPACK_CACHE_DIR)) {
      fs.rmSync(TURBOPACK_CACHE_DIR, { recursive: true, force: true });
    } else if (fs.existsSync(NEXT_DIR)) {
      fs.rmSync(NEXT_DIR, { recursive: true, force: true });
    }
    logSuccess('Cache cleaned successfully! ✨');
    return true;
  } catch (err) {
    logError(`Failed to clean cache automatically: ${err.message}`);
    logWarn('If files are locked, please stop any background node processes.');
    return false;
  }
}

// Check for explicit --clean flag
if (process.argv.includes('--clean')) {
  logInfo('Forced cache clean requested.');
  safeCleanCache();
}

let child = null;
let restartAttempts = 0;
const MAX_RESTARTS = 3;

function getNextCliPath() {
  try {
    return require.resolve('next/dist/bin/next');
  } catch (_) {
    return path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  }
}

function startNextDev() {
  logInfo(`Starting Next.js dev server... (Attempt ${restartAttempts + 1})`);

  const nextCli = getNextCliPath();
  const rawArgs = process.argv.slice(2).filter(a => a !== '--clean');
  const nextArgs = [nextCli, 'dev', ...rawArgs];

  child = spawn(process.execPath, nextArgs, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env }
  });

  let isHealing = false;

  const handleOutput = (data, isError = false) => {
    const text = data.toString();

    // Filter out non-actionable filesystem / root infer deprecation warnings for ultra-clean log output
    if (
      text.includes('Slow filesystem detected') ||
      text.includes('inferred your workspace root')
    ) {
      return;
    }

    if (isError) {
      process.stderr.write(data);
    } else {
      process.stdout.write(data);
    }

    // Detect Turbopack SST / Corrupted Database panic patterns
    const isTurbopackPanic = 
      text.includes('Failed to restore task data (corrupted database or bug)') ||
      text.includes('Unable to open static sorted file') ||
      text.includes('Failed to open SST file') ||
      (text.includes('turbopack') && text.includes('panicked'));

    if (isTurbopackPanic && !isHealing) {
      isHealing = true;
      logError('🚨 Turbopack SST cache corruption detected!');
      
      if (child) {
        try {
          child.kill('SIGINT');
        } catch (_) {}
      }

      if (restartAttempts < MAX_RESTARTS) {
        restartAttempts++;
        logWarn(`Auto-healing in progress... Cleaning .next cache and restarting (Attempt ${restartAttempts}/${MAX_RESTARTS})`);
        setTimeout(() => {
          safeCleanCache();
          startNextDev();
        }, 1200);
      } else {
        logError('Maximum auto-heal restarts reached. Please check disk permissions or restart terminal.');
      }
    }
  };

  child.stdout.on('data', data => handleOutput(data, false));
  child.stderr.on('data', data => handleOutput(data, true));

  child.on('close', (code) => {
    if (!isHealing) {
      logInfo(`Next dev exited with code ${code}`);
      process.exit(code || 0);
    }
  });
}

// Intercept Ctrl+C / SIGINT / SIGTERM
process.on('SIGINT', () => {
  if (child) child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (child) child.kill('SIGTERM');
  process.exit(0);
});

startNextDev();

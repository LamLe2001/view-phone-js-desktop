/**
 * Build script cho View Phone Desktop
 * Tự động hóa quá trình build client, server và Electron app
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'src', 'client');
const SERVER_DIR = path.join(ROOT_DIR, 'src', 'server');
const ELECTRON_DIR = path.join(ROOT_DIR, 'electron');

function log(message) {
    console.log(`\n[BUILD] ${message}`);
    console.log('='.repeat(50));
}

function runCommand(command, cwd) {
    console.log(`> ${command}`);
    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
            env: { ...process.env, ELECTRON_RUN_AS_NODE: '' }
        });
        return true;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return false;
    }
}

async function build() {
    const startTime = Date.now();

    log('Step 1: Building Client (React + Vite)');
    if (!runCommand('npm run build', CLIENT_DIR)) {
        console.error('❌ Client build failed!');
        process.exit(1);
    }
    console.log('✅ Client build successful');

    log('Step 2: Building Server (Node.js + Webpack)');
    if (!runCommand('npm run build', SERVER_DIR)) {
        console.error('❌ Server build failed!');
        process.exit(1);
    }
    console.log('✅ Server build successful');

    log('Step 3: Installing Electron dependencies');
    if (!runCommand('npm install', ELECTRON_DIR)) {
        console.error('❌ Electron npm install failed!');
        process.exit(1);
    }
    console.log('✅ Electron dependencies installed');

    log('Step 4: Building Electron App (exe)');
    if (!runCommand('npm run build', ELECTRON_DIR)) {
        console.error('❌ Electron build failed!');
        process.exit(1);
    }
    console.log('✅ Electron build successful');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Build Complete! (${duration}s)`);
    console.log(`\nOutput: ${path.join(ROOT_DIR, 'dist')}`);
}

// Run build
build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});

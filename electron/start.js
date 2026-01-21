const { spawn } = require('child_process');
const path = require('path');

// Get the electron executable path
const electronPath = require('electron');

// Spawn electron with our main.js
const child = spawn(electronPath, [path.join(__dirname, 'main.js')], {
    stdio: 'inherit',
    env: process.env
});

child.on('close', (code) => {
    process.exit(code);
});

'use strict'

// This launcher removes ELECTRON_RUN_AS_NODE from the environment before
// spawning Electron. VSCode sets this variable (it's an Electron app itself),
// which causes Electron to behave as plain Node.js and breaks the app.

const { spawn } = require('child_process')
const electronPath = require('electron')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const proc = spawn(electronPath, ['.'], {
  env,
  stdio: 'inherit',
  cwd: process.cwd(),
})

proc.on('close', (code) => process.exit(code || 0))

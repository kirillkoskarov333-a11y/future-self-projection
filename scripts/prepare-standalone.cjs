const fs = require("node:fs")
const path = require("node:path")

const root = process.cwd()
const standaloneRoot = path.join(root, ".next", "standalone")
const standaloneStatic = path.join(standaloneRoot, ".next", "static")
const sourceStatic = path.join(root, ".next", "static")
const sourcePublic = path.join(root, "public")
const standalonePublic = path.join(standaloneRoot, "public")

function copyDir(source, target) {
  if (!fs.existsSync(source)) return
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.cpSync(source, target, { recursive: true, force: true })
}

if (!fs.existsSync(standaloneRoot)) {
  throw new Error(
    "Standalone build not found. Run `next build` with output: 'standalone' before packaging."
  )
}

copyDir(sourceStatic, standaloneStatic)
copyDir(sourcePublic, standalonePublic)

console.log("Standalone assets prepared for Electron packaging.")

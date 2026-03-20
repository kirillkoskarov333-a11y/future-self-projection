const e = require("electron")
console.log("type:", typeof e)
console.log("keys:", e ? Object.keys(e).slice(0,5) : "null/undefined")
const { app } = e || {}
console.log("app:", typeof app)
if (app) {
  app.whenReady().then(() => { console.log("READY"); app.quit() })
} else {
  console.log("app is undefined!")
  process.exit(1)
}

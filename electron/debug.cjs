console.log("LOADED BY:", process.execPath)
console.log("VERSIONS:", JSON.stringify(process.versions, null, 2).substring(0, 200))
const e = require("electron")
console.log("ELECTRON TYPE:", typeof e)
if (typeof e === "string") {
  console.log("ERROR: got string, not API. electron=", e.substring(0, 100))
} else {
  console.log("KEYS:", Object.keys(e).slice(0, 10))
}
process.exit(0)

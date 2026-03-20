const fs = require("node:fs")
const path = require("node:path")
const { PNG } = require("pngjs")
const toIco = require("to-ico")

const buildDir = path.join(process.cwd(), "build")
const pngPath = path.join(buildDir, "icon.png")
const icoPath = path.join(buildDir, "icon.ico")

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function createPngBuffer(size) {
  const png = new PNG({ width: size, height: size })
  const center = size / 2
  const maxRadius = size * 0.48

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (size * y + x) << 2
      const dx = x - center
      const dy = y - center
      const distance = Math.sqrt(dx * dx + dy * dy)
      const t = clamp(distance / maxRadius, 0, 1)

      const baseR = Math.round(12 + 16 * (1 - t))
      const baseG = Math.round(94 + 130 * (1 - t))
      const baseB = Math.round(34 + 54 * (1 - t))

      png.data[idx] = baseR
      png.data[idx + 1] = baseG
      png.data[idx + 2] = baseB
      png.data[idx + 3] = 255
    }
  }

  const ringColor = { r: 16, g: 40, b: 18, a: 255 }
  const glowColor = { r: 218, g: 255, b: 230, a: 220 }
  const rings = [size * 0.16, size * 0.28, size * 0.39]

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (size * y + x) << 2
      const dx = x - center
      const dy = y - center
      const distance = Math.sqrt(dx * dx + dy * dy)

      let alpha = 0
      for (const r of rings) {
        const ringDist = Math.abs(distance - r)
        if (ringDist < 2.2) {
          alpha = Math.max(alpha, 1 - ringDist / 2.2)
        }
      }

      if (distance < size * 0.04) {
        png.data[idx] = glowColor.r
        png.data[idx + 1] = glowColor.g
        png.data[idx + 2] = glowColor.b
        png.data[idx + 3] = glowColor.a
        continue
      }

      if (alpha > 0) {
        png.data[idx] = Math.round(ringColor.r * alpha + png.data[idx] * (1 - alpha))
        png.data[idx + 1] = Math.round(ringColor.g * alpha + png.data[idx + 1] * (1 - alpha))
        png.data[idx + 2] = Math.round(ringColor.b * alpha + png.data[idx + 2] * (1 - alpha))
      }
    }
  }

  return PNG.sync.write(png)
}

async function main() {
  fs.mkdirSync(buildDir, { recursive: true })
  const pngBuffer = createPngBuffer(256)
  fs.writeFileSync(pngPath, pngBuffer)

  const icoBuffer = await toIco([pngBuffer])
  fs.writeFileSync(icoPath, icoBuffer)

  console.log(`Icons generated: ${pngPath}, ${icoPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

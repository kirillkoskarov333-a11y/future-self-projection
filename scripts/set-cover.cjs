'use strict'
const fs = require('fs')
const path = require('path')
const os = require('os')

const bookId = process.argv[2]
const imgPath = process.argv[3]

const dbPath = path.join(os.homedir(), '.future-self-projection', 'mvp-db.json')

const imgBuffer = fs.readFileSync(imgPath)
const ext = path.extname(imgPath).toLowerCase().replace('.', '')
const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
const base64 = `data:${mime};base64,` + imgBuffer.toString('base64')

const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
const books = (db.reading && db.reading.books) || []
const book = books.find(function(b) { return b.id === bookId })

if (!book) {
  console.error('Book not found:', bookId)
  process.exit(1)
}

book.coverPath = base64
db.updatedAt = new Date().toISOString()

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8')
console.log('Cover set! base64 size:', Math.round(base64.length / 1024) + 'KB')

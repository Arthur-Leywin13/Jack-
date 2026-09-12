const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'data.json')

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ prefixes: {} }, null, 2))
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

function getPrefix(chatId, defaultPrefix) {
  const data = load()
  return data.prefixes[chatId] || defaultPrefix
}

function setPrefix(chatId, prefix) {
  const data = load()
  data.prefixes[chatId] = prefix
  save(data)
}

module.exports = { getPrefix, setPrefix }

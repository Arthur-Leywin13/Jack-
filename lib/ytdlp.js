const { execFile } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

function run(args) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', args, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message))
      resolve(stdout)
    })
  })
}

// Récupère juste les infos (titre, durée) sans télécharger
async function getInfo(url) {
  const out = await run(['-J', '--no-playlist', url])
  return JSON.parse(out)
}

// Télécharge en mp3 (audio uniquement), retourne le chemin du fichier
async function downloadAudio(url) {
  const outTemplate = path.join(os.tmpdir(), `%(id)s.%(ext)s`)
  await run([
    '-x', '--audio-format', 'mp3',
    '--no-playlist',
    '-o', outTemplate,
    url,
  ])
  const info = await getInfo(url)
  const file = path.join(os.tmpdir(), `${info.id}.mp3`)
  if (!fs.existsSync(file)) throw new Error('Fichier audio introuvable après téléchargement.')
  return { file, title: info.title }
}

// Télécharge en mp4 (vidéo), retourne le chemin du fichier
async function downloadVideo(url) {
  const outTemplate = path.join(os.tmpdir(), `%(id)s.%(ext)s`)
  await run([
    '-f', 'mp4/best',
    '--no-playlist',
    '-o', outTemplate,
    url,
  ])
  const info = await getInfo(url)
  const file = path.join(os.tmpdir(), `${info.id}.mp4`)
  if (!fs.existsSync(file)) throw new Error('Fichier vidéo introuvable après téléchargement.')
  return { file, title: info.title }
}

module.exports = { getInfo, downloadAudio, downloadVideo }

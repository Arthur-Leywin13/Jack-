const { createCanvas } = require('@napi-rs/canvas')

// Carte générique: titre + lignes de texte, fond dégradé
function buildCard({ title, lines = [], accentColor = '#d4af37' }) {
  const width = 700
  const height = 400
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Fond dégradé sombre
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#0f0f14')
  bg.addColorStop(1, '#1c1c26')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // Bordure accent
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, width - 6, height - 6)

  // Titre
  ctx.fillStyle = accentColor
  ctx.font = 'bold 42px sans-serif'
  ctx.fillText(title, 30, 70)

  // Ligne séparatrice
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(30, 90)
  ctx.lineTo(width - 30, 90)
  ctx.stroke()

  // Lignes de contenu
  ctx.fillStyle = '#f0f0f0'
  ctx.font = '30px sans-serif'
  let y = 150
  for (const line of lines) {
    ctx.fillText(line, 30, y)
    y += 50
  }

  return canvas.toBuffer('image/png')
}

module.exports = { buildCard }

const express = require('express')
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode')
const fs = require('fs')
const path = require('path')

const config = require('./config')
const db = require('./lib/db')

const app = express()
const PORT = process.env.PORT || 3000

let currentQR = null
let connectionStatus = 'Initialisation...'

// Charge dynamiquement toutes les commandes du dossier commands/
const commands = new Map()
for (const file of fs.readdirSync(path.join(__dirname, 'commands'))) {
  if (!file.endsWith('.js')) continue
  const cmd = require(path.join(__dirname, 'commands', file))
  commands.set(cmd.name, cmd)
  for (const alias of cmd.aliases || []) commands.set(alias, cmd)
}

// Routes Express
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/api/qr', async (req, res) => {
  if (!currentQR) {
    return res.json({ qr: null, status: connectionStatus })
  }
  try {
    const qrImage = await qrcode.toDataURL(currentQR)
    res.json({ qr: qrImage, status: connectionStatus })
  } catch (err) {
    console.error('Erreur génération QR:', err)
    res.json({ qr: null, status: connectionStatus, error: err.message })
  }
})

app.get('/api/status', (req, res) => {
  res.json({ status: connectionStatus })
})

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      currentQR = qr
      connectionStatus = '⏳ En attente de scan du QR code...'
      console.log('QR Code généré, prêt pour le scan')
    }

    if (connection === 'close') {
      currentQR = null
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      connectionStatus = shouldReconnect
        ? '🔄 Reconnexion...'
        : '❌ Déconnecté (relance manuelle requise)'
      console.log(
        'Connexion fermée.',
        shouldReconnect ? 'Reconnexion...' : 'Déconnecté (relance manuelle requise).'
      )
      if (shouldReconnect) setTimeout(() => start(), 3000)
    } else if (connection === 'open') {
      currentQR = null
      connectionStatus = `✅ ${config.BOT_NAME} connecté`
      console.log(`✅ ${config.BOT_NAME} connecté.`)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const jid = msg.key.remoteJid
    const isGroup = jid.endsWith('@g.us')
    const currentPrefix = db.getPrefix(jid, config.DEFAULT_PREFIX)

    const messageType = Object.keys(msg.message)[0]
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      ''

    if (!body.startsWith(currentPrefix)) return

    const [rawCmd, ...args] = body.slice(currentPrefix.length).trim().split(/\s+/)
    const cmd = commands.get(rawCmd.toLowerCase())
    if (!cmd) return

    // Contexte groupe (admin checks) — uniquement si nécessaire
    let groupMetadata = null
    let isSenderAdmin = false
    let isBotAdmin = false
    if (isGroup) {
      groupMetadata = await sock.groupMetadata(jid)
      const senderId = msg.key.participant || msg.participant
      const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'
      isSenderAdmin = groupMetadata.participants.some(
        (p) => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
      )
      isBotAdmin = groupMetadata.participants.some(
        (p) => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin')
      )
    }

    const isOwner =
      (msg.key.participant || msg.key.remoteJid || '').includes(config.OWNER_NUMBER)

    const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
    const quotedMessage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage || null
    const pushName = msg.pushName || "Quelqu'un"

    try {
      await cmd.execute({
        sock,
        msg,
        jid,
        args,
        prefix: currentPrefix,
        currentPrefix,
        isGroup,
        groupMetadata,
        isSenderAdmin,
        isBotAdmin,
        isOwner,
        mentionedJids,
        quotedMessage,
        pushName,
      })
    } catch (err) {
      console.error(`Erreur commande ${cmd.name}:`, err)
      await sock.sendMessage(jid, {
        text: `Un imprévu... même moi, je n'échappe pas au chaos parfois.`,
      })
    }
  })
}

// Démarre le serveur web
app.listen(PORT, () => {
  console.log(`🌐 Serveur web lancé sur http://localhost:${PORT}`)
})

// Démarre le bot
start()


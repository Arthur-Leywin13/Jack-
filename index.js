const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const path = require('path')

const config = require('./config')
const db = require('./lib/db')

// Charge dynamiquement toutes les commandes du dossier commands/
const commands = new Map()
for (const file of fs.readdirSync(path.join(__dirname, 'commands'))) {
  if (!file.endsWith('.js')) continue
  const cmd = require(path.join(__dirname, 'commands', file))
  commands.set(cmd.name, cmd)
  for (const alias of cmd.aliases || []) commands.set(alias, cmd)
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) qrcode.generate(qr, { small: true })

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log('Connexion fermée.', shouldReconnect ? 'Reconnexion...' : 'Déconnecté (relance manuelle requise).')
      if (shouldReconnect) start()
    } else if (connection === 'open') {
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
    const pushName = msg.pushName || 'Quelqu\'un'

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
      await sock.sendMessage(jid, { text: `Un imprévu... même moi, je n'échappe pas au chaos parfois.` })
    }
  })
}

start()

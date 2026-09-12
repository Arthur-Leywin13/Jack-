const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

module.exports = {
  name: 'vv',
  description: 'Révèle un message "vue unique" en réponse',
  async execute({ sock, jid, quotedMessage }) {
    if (!quotedMessage) {
      return sock.sendMessage(jid, { text: 'Répondez à ce qui devait disparaître, et je le retiendrai pour vous.' })
    }

    const viewOnce =
      quotedMessage.viewOnceMessage?.message ||
      quotedMessage.viewOnceMessageV2?.message ||
      quotedMessage.viewOnceMessageV2Extension?.message

    if (!viewOnce) {
      return sock.sendMessage(jid, { text: 'Ceci n\'était pas destiné à disparaître.' })
    }

    const type = viewOnce.imageMessage ? 'image' : viewOnce.videoMessage ? 'video' : null
    if (!type) {
      return sock.sendMessage(jid, { text: 'Cette forme m\'échappe encore.' })
    }

    const media = viewOnce[`${type}Message`]
    const stream = await downloadContentFromMessage(media, type)
    const buffer = await streamToBuffer(stream)

    await sock.sendMessage(jid, { [type]: buffer, caption: media.caption || '' })
  },
}

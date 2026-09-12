const fs = require('fs')
const persona = require('../lib/persona')
const { downloadVideo } = require('../lib/ytdlp')

module.exports = {
  name: 'dl',
  aliases: ['tiktok', 'ig', 'fb'],
  description: 'Télécharge une vidéo depuis un lien',
  async execute({ sock, jid, args }) {
    const url = args[0]
    if (!url) {
      return sock.sendMessage(jid, { text: 'Un lien, et cette scène sera vôtre.' })
    }

    await sock.sendMessage(jid, { text: persona.pick(persona.greetPatience) })

    try {
      const { file, title } = await downloadVideo(url)
      await sock.sendMessage(jid, { video: fs.readFileSync(file), caption: title || persona.pick(persona.done) })
      fs.unlinkSync(file)
    } catch (err) {
      await sock.sendMessage(jid, { text: `Ce lien m'échappe.\n(${err.message})` })
    }
  },
}

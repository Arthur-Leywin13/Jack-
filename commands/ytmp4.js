const fs = require('fs')
const config = require('../config')
const persona = require('../lib/persona')
const { getInfo, downloadVideo } = require('../lib/ytdlp')

module.exports = {
  name: 'ytmp4',
  aliases: ['video'],
  description: 'Télécharge une vidéo depuis YouTube',
  async execute({ sock, jid, args }) {
    const url = args[0]
    if (!url) {
      return sock.sendMessage(jid, { text: 'Donnez-moi un lien, et je vous ramènerai la scène.' })
    }

    await sock.sendMessage(jid, { text: persona.pick(persona.greetPatience) })

    try {
      const info = await getInfo(url)
      if (info.duration > config.YTDL_MAX_DURATION_SECONDS) {
        return sock.sendMessage(jid, {
          text: `Trop long pour mon goût — pas plus de ${config.YTDL_MAX_DURATION_SECONDS / 60} minutes.`,
        })
      }

      const { file, title } = await downloadVideo(url)
      await sock.sendMessage(jid, { video: fs.readFileSync(file), caption: title })
      fs.unlinkSync(file)
    } catch (err) {
      await sock.sendMessage(jid, { text: `${persona.pick(persona.error)}\n(${err.message})` })
    }
  },
}

const fs = require('fs')
const config = require('../config')
const persona = require('../lib/persona')
const { getInfo, downloadAudio } = require('../lib/ytdlp')

module.exports = {
  name: 'ytmp3',
  aliases: ['play', 'music'],
  description: 'Télécharge une musique depuis YouTube',
  async execute({ sock, jid, args }) {
    const url = args[0]
    if (!url) {
      return sock.sendMessage(jid, { text: 'Donnez-moi un lien, et je vous ramènerai sa mélodie.' })
    }

    await sock.sendMessage(jid, { text: persona.pick(persona.greetPatience) })

    try {
      const info = await getInfo(url)
      if (info.duration > config.YTDL_MAX_DURATION_SECONDS) {
        return sock.sendMessage(jid, {
          text: `Trop long pour mon goût — pas plus de ${config.YTDL_MAX_DURATION_SECONDS / 60} minutes.`,
        })
      }

      const { file, title } = await downloadAudio(url)
      await sock.sendMessage(jid, {
        audio: fs.readFileSync(file),
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
      })
      fs.unlinkSync(file)
    } catch (err) {
      await sock.sendMessage(jid, { text: `${persona.pick(persona.error)}\n(${err.message})` })
    }
  },
}

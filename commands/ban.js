const fs = require('fs')
const path = require('path')
const persona = require('../lib/persona')

module.exports = {
  name: 'ban',
  aliases: ['kick'],
  description: 'Retire un membre mentionné du groupe',
  async execute({ sock, jid, isGroup, isBotAdmin, isSenderAdmin, isOwner, mentionedJids }) {
    if (!isGroup) return sock.sendMessage(jid, { text: 'Cela ne se fait qu\'entre quatre murs — un groupe.' })
    if (!isBotAdmin) return sock.sendMessage(jid, { text: 'Sans autorité ici, je ne peux qu\'observer.' })
    if (!isSenderAdmin && !isOwner) return sock.sendMessage(jid, { text: `⛔ ${persona.pick(persona.denied)}` })

    if (!mentionedJids || mentionedJids.length === 0) {
      return sock.sendMessage(jid, { text: 'Désignez-moi quelqu\'un. Je ne travaille pas au hasard.' })
    }

    const imgPath = path.join(__dirname, '..', 'assets', 'img', 'ban.jpg')
    await sock.groupParticipantsUpdate(jid, mentionedJids, 'remove')

    const caption = persona.pick(persona.done)
    if (fs.existsSync(imgPath)) {
      await sock.sendMessage(jid, { image: fs.readFileSync(imgPath), caption })
    } else {
      await sock.sendMessage(jid, { text: caption })
    }
  },
}

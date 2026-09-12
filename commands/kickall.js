const fs = require('fs')
const path = require('path')
const persona = require('../lib/persona')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

module.exports = {
  name: 'kickall',
  description: 'Retire tous les membres non-admin du groupe',
  async execute({ sock, jid, isGroup, isBotAdmin, isSenderAdmin, isOwner, groupMetadata, pushName }) {
    if (!isGroup) return sock.sendMessage(jid, { text: 'Cela ne se fait qu\'entre quatre murs — un groupe.' })
    if (!isBotAdmin) return sock.sendMessage(jid, { text: 'Sans autorité ici, je ne peux qu\'observer.' })
    if (!isSenderAdmin && !isOwner) return sock.sendMessage(jid, { text: `⛔ ${persona.pick(persona.denied)}` })

    const imgPath = path.join(__dirname, '..', 'assets', 'img', 'kickall.jpg')
    const members = groupMetadata.participants.filter((p) => !p.admin).map((p) => p.id)

    if (members.length === 0) {
      return sock.sendMessage(jid, { text: 'Il ne reste que des âmes protégées ici. Rien à faire.' })
    }

    const caption = `Un grand ménage s'impose, sur ordre de ${pushName}.\n${members.length} départ(s) à organiser...`
    if (fs.existsSync(imgPath)) {
      await sock.sendMessage(jid, { image: fs.readFileSync(imgPath), caption })
    } else {
      await sock.sendMessage(jid, { text: caption })
    }

    for (const memberId of members) {
      try {
        await sock.groupParticipantsUpdate(jid, [memberId], 'remove')
      } catch (e) {}
      await sleep(1200)
    }

    await sock.sendMessage(jid, { text: persona.pick(persona.done) })
  },
}

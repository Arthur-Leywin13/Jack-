const db = require('../lib/db')
const persona = require('../lib/persona')

module.exports = {
  name: 'setprefix',
  description: 'Change le préfixe des commandes pour ce chat',
  async execute({ sock, jid, args, isSenderAdmin, isOwner, currentPrefix }) {
    if (!isSenderAdmin && !isOwner) {
      return sock.sendMessage(jid, { text: `⛔ ${persona.pick(persona.denied)}` })
    }

    const newPrefix = args[0]
    if (!newPrefix || newPrefix.length !== 1) {
      return sock.sendMessage(jid, {
        text: `Un seul caractère suffit.\nEx: ${currentPrefix}setprefix !`,
      })
    }

    db.setPrefix(jid, newPrefix)
    await sock.sendMessage(jid, { text: `Entendu. "${newPrefix}" sera notre nouveau signal.` })
  },
}

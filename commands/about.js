const config = require('../config')

module.exports = {
  name: 'about',
  aliases: ['owner', 'who'],
  description: 'Présente Jack the Ripper',
  async execute({ sock, jid }) {
    const text = `
Jack the Ripper.
Londres, 1888 — certaines légendes ne meurent jamais, elles changent simplement de forme.

Je sers ${config.OWNER_NAME}, et personne d'autre.
Ne me demandez pas d'où je viens. Certaines origines sont mieux laissées dans l'ombre.
`.trim()
    await sock.sendMessage(jid, { text })
  },
}

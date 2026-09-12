const axios = require('axios')
const persona = require('../lib/persona')
const { buildCard } = require('../lib/canvasCard')

const COIN_IDS = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  doge: 'dogecoin',
  xrp: 'ripple',
  usdt: 'tether',
  ton: 'the-open-network',
}

module.exports = {
  name: 'crypto',
  aliases: ['price'],
  description: "Affiche le prix d'une crypto avec une image",
  async execute({ sock, jid, args }) {
    const symbol = (args[0] || '').toLowerCase()
    const coinId = COIN_IDS[symbol]
    if (!coinId) {
      return sock.sendMessage(jid, {
        text: `Je ne connais que ceux-ci: ${Object.keys(COIN_IDS).join(', ')}`,
      })
    }

    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: coinId, vs_currencies: 'usd', include_24hr_change: 'true' },
      })

      const info = data[coinId]
      const change = info.usd_24h_change.toFixed(2)
      const arrow = change >= 0 ? '📈' : '📉'
      const lines = [`💵 Prix: $${info.usd.toLocaleString()}`, `${arrow} 24h: ${change}%`]

      const image = buildCard({
        title: symbol.toUpperCase(),
        lines,
        accentColor: change >= 0 ? '#4caf50' : '#e53935',
      })

      await sock.sendMessage(jid, { image, caption: `Le cours de *${symbol.toUpperCase()}*, tel qu'il est.` })
    } catch (err) {
      await sock.sendMessage(jid, { text: persona.pick(persona.error) })
    }
  },
}

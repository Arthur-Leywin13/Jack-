const axios = require('axios')
const config = require('../config')
const persona = require('../lib/persona')
const { buildCard } = require('../lib/canvasCard')

module.exports = {
  name: 'weather',
  aliases: ['meteo'],
  description: "Affiche la météo d'une ville avec une image",
  async execute({ sock, jid, args }) {
    const city = args.join(' ')
    if (!city) {
      return sock.sendMessage(jid, { text: 'Dites-moi quelle ville vous intéresse.' })
    }
    if (!config.OPENWEATHER_API_KEY) {
      return sock.sendMessage(jid, { text: 'Cette vision m\'est pour l\'instant fermée (clé API absente).' })
    }

    try {
      const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { q: city, appid: config.OPENWEATHER_API_KEY, units: 'metric', lang: 'fr' },
      })

      const lines = [
        `🌡️ Température: ${data.main.temp}°C (ressenti ${data.main.feels_like}°C)`,
        `☁️ Condition: ${data.weather[0].description}`,
        `💧 Humidité: ${data.main.humidity}%`,
        `💨 Vent: ${data.wind.speed} m/s`,
      ]

      const image = buildCard({ title: `Météo — ${data.name}`, lines, accentColor: '#4fa3f7' })
      await sock.sendMessage(jid, { image, caption: `Voici ce que le ciel réserve à *${data.name}*.` })
    } catch (err) {
      const msg = err.response?.status === 404 ? 'Cette ville m\'est inconnue.' : persona.pick(persona.error)
      await sock.sendMessage(jid, { text: msg })
    }
  },
}

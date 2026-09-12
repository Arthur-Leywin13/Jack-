module.exports = {
  OWNER_NAME: process.env.OWNER_NAME || 'Arthur',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '509XXXXXXXX', // ex: 50912345678
  DEFAULT_PREFIX: process.env.DEFAULT_PREFIX || '.',
  BOT_NAME: 'Jack the Ripper',

  // Clés API (gratuites) — définies en variables d'environnement sur Railway
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',

  // Limites
  YTDL_MAX_DURATION_SECONDS: 600, // 10 min max pour éviter les abus
}

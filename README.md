# Jack the Ripper — Bot WhatsApp multi-fonctions

Owner: **Arthur**

Le bot répond systématiquement dans le ton du personnage (calme, élégant, un rien inquiétant) — aucun message ne mentionne un moteur, une IA, ou une origine technique. `.about` répond aussi en restant dans le personnage si on lui demande d'où il vient.

## Installation (Termux ou serveur Linux)

```bash
# 1. Installer yt-dlp (nécessaire pour ytmp3/ytmp4/dl)
pkg install python -y        # Termux
pip install yt-dlp

# ou sur un serveur Debian/Ubuntu:
# sudo apt install python3-pip -y && pip3 install yt-dlp

# 2. Installer les dépendances Node
npm install

# 3. Configurer
# Ouvre config.js et remplis OWNER_NUMBER + OPENWEATHER_API_KEY

# 4. Lancer
npm start
```

Un QR code s'affiche dans le terminal : scanne-le avec WhatsApp (Paramètres > Appareils connectés).

## Structure

```
index.js            → connexion Baileys + routing des commandes
config.js            → owner, préfixe par défaut, clés API
lib/
  db.js              → stockage du préfixe par groupe (data.json auto-créé)
  ytdlp.js           → wrapper yt-dlp (téléchargement audio/vidéo)
  canvasCard.js       → génération des images météo/crypto
commands/
  menu.js            → .menu (vidéo + liste des commandes)
  setprefix.js       → .setprefix
  kickall.js         → .kickall (+ image)
  ban.js             → .ban / .kick (+ image)
  ytmp3.js           → .ytmp3 (musique YouTube)
  ytmp4.js           → .ytmp4 (vidéo YouTube)
  dl.js              → .dl (TikTok/Instagram/Facebook/etc.)
  weather.js         → .weather (+ image générée)
  crypto.js          → .crypto (+ image générée)
  vv.js              → .vv (révèle un vue unique)
  about.js           → .about / .owner / .who (identité, en restant dans le personnage)
assets/
  menu.mp4           → vidéo envoyée par .menu
  img/
    kickall.jpg
    ban.jpg
    menu-bg.jpg      → dispo si tu veux l'utiliser comme fond
    profile.jpg
```

## Ajouter une commande

Crée un fichier dans `commands/`, exporte `{ name, aliases, description, execute }`.
Il sera chargé automatiquement au démarrage — aucune autre modification nécessaire.

## Déploiement sur Railway

1. **Pousse le projet sur GitHub** (Railway déploie depuis un repo, pas depuis un zip). Crée un repo, push ce dossier dedans.

2. **Nouveau projet Railway** → "Deploy from GitHub repo" → sélectionne le repo.
   Railway détecte le `Dockerfile` automatiquement et l'utilise (il gère l'installation de `yt-dlp` + `ffmpeg`, contrairement au buildpack Node par défaut qui ne les a pas).

3. **Variables d'environnement** (Settings → Variables), à partir de `.env.example` :
   - `OWNER_NAME`
   - `OWNER_NUMBER`
   - `DEFAULT_PREFIX`
   - `OPENWEATHER_API_KEY`

4. **Volume persistant — étape critique** : sans ça, Jack perd sa session WhatsApp à chaque redéploiement et il faut rescanner le QR.
   Settings → Volumes → Add Volume → mount path `/app/auth_info`.

5. **Déploie**, puis va dans l'onglet **Logs** : le QR code s'affiche en ASCII directement dans les logs Railway. Scanne-le avec WhatsApp (Appareils connectés) dans les ~60 secondes.

6. Une fois connecté, tant que le volume reste attaché, les redéploiements suivants ne redemandent pas le QR.

### Limites à connaître sur Railway
- Le plan gratuit met le service en veille après inactivité réseau — mais un bot WhatsApp maintient une connexion websocket active, donc en pratique il ne devrait pas s'endormir tant que la connexion Baileys tourne.
- `yt-dlp` peut être bloqué occasionnellement par YouTube depuis des IPs de datacenter (Railway en fait partie) — si `.ytmp3`/`.ytmp4` échouent souvent, c'est la cause la plus probable, pas un bug du bot.

## Notes


- `.kickall` retire tous les non-admins d'un groupe où le bot est admin — irréversible, à utiliser avec précaution (WhatsApp peut limiter les kicks en masse rapides, un délai de 1.2s est déjà appliqué entre chaque kick).
- `.crypto` : ajoute d'autres symboles dans `commands/crypto.js` (objet `COIN_IDS`), l'id vient de CoinGecko.
- `.weather` nécessite une clé gratuite sur openweathermap.org.
- Déploiement Railway/Render : le dossier `auth_info/` doit persister entre les redémarrages (volume) sinon il faut rescanner le QR à chaque déploiement.

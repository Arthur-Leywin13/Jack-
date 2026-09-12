FROM node:20-slim

# yt-dlp a besoin de python3 + pip, ffmpeg pour l'extraction audio (mp3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Session WhatsApp — doit correspondre au volume monté sur Railway
VOLUME ["/app/auth_info"]

CMD ["node", "index.js"]

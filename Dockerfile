FROM node:18.20-bookworm-slim@sha256:cbfb3c9830932b7b1c2738abf47c66568fc7b06cf782d803e7ddff52b2fc835d
WORKDIR /app
RUN apt-get update && apt-get install -y curl gnupg \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ADD ./dji_bin.tar.gz /bin
ADD ./dji_lib.tar.gz /lib
COPY package*.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm ci
COPY . /app/
RUN npm run build
WORKDIR /app/src
CMD ["node", "server.js"]


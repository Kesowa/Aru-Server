FROM node@sha256:92f06fc13bcc09f1ddc51f6ebf1aa3d21a6532b74f076f224f188bc6b9317570
WORKDIR /app
RUN apt-get update && apt-get install -y wget libtbb2 --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb
ADD ./ffmpeg.tar.gz /bin
ADD  ./potree.tar.gz /bin
ADD ./dji_bin.tar.gz /bin
ADD ./dji_lib.tar.gz /lib
RUN cp /bin/liblaszip.so /usr/lib/liblaszip.so
COPY package*.json ./
RUN npm ci
RUN npm i puppeteer
COPY src ./src
COPY tsconfig.json ./
RUN npm run build
WORKDIR /app/src
ENV NODE_ENV=production
CMD ["node", "server.js"]

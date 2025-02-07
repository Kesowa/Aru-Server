FROM node:18.20-bookworm-slim@sha256:cbfb3c9830932b7b1c2738abf47c66568fc7b06cf782d803e7ddff52b2fc835d
WORKDIR /app

RUN apt-get update && apt-get install -y libgomp1

ADD ./dji_bin.tar.gz /bin
ADD ./dji_lib.tar.gz /lib
COPY package*.json ./
RUN npm ci
COPY . /app/
RUN npm run build
WORKDIR /app/src
CMD ["node", "server.js"]


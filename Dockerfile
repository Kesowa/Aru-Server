FROM node:22.14.0-bookworm-slim@sha256:6bba748696297138f802735367bc78fea5cfe3b85019c74d2a930bc6c6b2fac4

RUN apt-get update && apt-get install -y libgomp1

# RUN groupadd --system nodegroup && \
#   useradd --system --gid nodegroup --create-home --shell /usr/sbin/nologin nodeuser
# USER nodeuser

WORKDIR /app

ADD ./dji_bin.tar.gz /bin
ADD ./dji_lib.tar.gz /lib
COPY package*.json ./
RUN npm ci
COPY ./tsconfig.json ./
COPY ./src ./src
COPY ./aru-common ./aru-common

RUN npm run build

CMD ["node", "/app/src/server.js"]


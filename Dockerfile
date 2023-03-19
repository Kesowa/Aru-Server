FROM node@sha256:27fab5920246070cf13449cf44c25bc4f5adef18ca7482b2bda90b7cf9e64481
WORKDIR /app
RUN npm i -g ts-node-dev
COPY package.json /app
RUN npm install
COPY . /app
ENV NODE_ENV=development
CMD ["ts-node-dev", "src/server.ts"]
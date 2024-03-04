FROM node:20.11.1-slim

WORKDIR /usr/src/app

COPY package.json .
RUN npm install
COPY . .

CMD [ "node", "nests.js" ]
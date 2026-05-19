FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js index.html ./
EXPOSE 2002
CMD ["node", "server.js"]

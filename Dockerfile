FROM node:18-alpine

WORKDIR /usr/src/app

# install dependencies first (use package-lock when present)
COPY package*.json ./
RUN npm ci --only=production || npm install --production

# copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "app/src/server.js"]

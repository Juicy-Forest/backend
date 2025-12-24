FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g nodemon
RUN npm ci --only=production

COPY . .

EXPOSE 3033

CMD ["npm", "start"]


FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --ignore-scripts

COPY . .

EXPOSE 1234

VOLUME ["/app/storage"]

CMD ["npm", "start"]

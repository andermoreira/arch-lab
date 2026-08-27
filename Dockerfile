FROM node:22-alpine

WORKDIR /app

# Instala dependências nativas para compilação se necessário
RUN apk add --no-cache make gcc g++ python3

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "test"]

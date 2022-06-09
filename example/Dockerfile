FROM node:lts-bullseye

COPY package.json /app/package.json

WORKDIR /app
RUN npm install
COPY . /app

EXPOSE 8545

CMD ["npx", "hardhat", "ctf-node"]

FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

#added npm bcus pnpm was not working

RUN npm install

RUN npm install -g prisma

COPY . .

RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "start"]

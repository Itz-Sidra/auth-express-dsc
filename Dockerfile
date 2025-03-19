FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

#added npm bcus pnpm was not working

RUN npm install

COPY . .

RUN npx prisma generate 

# COPY /app/prisma ./prisma

EXPOSE 4000

CMD ["npm", "run", "dev"]

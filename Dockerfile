FROM node:21.7.3

WORKDIR /app

COPY . ./
RUN npm install
RUN npm run build
CMD ["node", "./dist/index.js"]

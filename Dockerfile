FROM node:latest

COPY ./ /src
WORKDIR /src

RUN npm install

EXPOSE  80
CMD ["npm", "start"]

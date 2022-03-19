FROM node:13

WORKDIR /usr/pp/backend-misc

COPY . .

EXPOSE 4012 4012

RUN ["npm", "install"]

CMD ["npm", "start"]

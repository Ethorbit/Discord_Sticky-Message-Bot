FROM node:12.20.1-alpine3.12

ENV BOT_TOKEN ""
ENV STICKY_COOLDOWN ""

WORKDIR /home/stickybot

RUN apk update &&\
    addgroup -g 6969 -S stickybot &&\
    adduser -S -u 6969 -h /home/stickybot stickybot

USER stickybot

RUN wget -q "https://github.com/Ethorbit/Discord_Sticky-Message-Bot/archive/main.zip" -O "./project.zip" &&\
    mkdir ./project &&\
    unzip ./project.zip -d ./project && rm ./project.zip && cd ./project &&\
    mv "./Discord_Sticky-Message-Bot-main" "./bot" && cd "./bot" &&\
    npm install

RUN chmod -R 700 ./

CMD ["node", "./project/bot/src/bot.js"]

FROM node:16.19.0-alpine3.17
ARG GIT_BRANCH="main"

ENV BOT_TOKEN=""
ENV STICKY_COOLDOWN=""

WORKDIR /home/stickybot
VOLUME /botdb
ENV BOT_DB_PATH="/botdb"

RUN apk update &&\
    apk add ca-certificates &&\
    update-ca-certificates &&\
    addgroup -g 6969 -S stickybot &&\
    adduser -S -u 6969 -h /home/stickybot stickybot

USER stickybot

RUN wget -q "https://github.com/Ethorbit/Discord_Sticky-Message-Bot/archive/${GIT_BRANCH}.zip" -O "./project.zip" &&\
    mkdir ./project &&\
    unzip ./project.zip -d ./project && rm ./project.zip && cd ./project &&\
    mv "./Discord_Sticky-Message-Bot-${GIT_BRANCH}" "./bot" && cd "./bot" &&\
    npm install

RUN chmod -R 700 ./

CMD ["node", "./project/bot/src/bot.js"]

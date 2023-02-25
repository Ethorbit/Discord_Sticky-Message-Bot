FROM node:16.19.0-alpine3.17
WORKDIR /home/stickybot
ARG GIT_BRANCH="main"
ARG PUID=6969
ARG PGID=6969
ENV BOT_TOKEN=""
ENV STICKY_COOLDOWN=""
VOLUME /botdb
ENV DB_PATH="/botdb"
RUN apk update &&\
    apk add ca-certificates &&\
    update-ca-certificates &&\
    apk add shadow &&\
    addgroup -g ${PGID} stickybot &&\
    adduser -D -u ${PUID} -G stickybot stickybot
RUN wget -q "https://github.com/Ethorbit/Discord_Sticky-Message-Bot/archive/${GIT_BRANCH}.zip" -O "./project.zip" &&\
    mkdir ./project &&\
    unzip ./project.zip -d ./project && rm ./project.zip && cd ./project &&\
    mv "./Discord_Sticky-Message-Bot-${GIT_BRANCH}" "./bot" && cd "./bot" &&\
    npm install
RUN chown -R stickybot:stickybot ./ &&\ 
    chmod -R 700 ./ 
USER stickybot
CMD ["node", "./project/bot/src/bot.js"]

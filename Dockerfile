FROM node:26.8.2-alpine3.23
WORKDIR /home/stickybot
ARG GIT_BRANCH="main"
ARG PUID=6969
ARG PGID=6969
ENV STICKY_COOLDOWN=""
RUN apk update &&\
    apk add ca-certificates &&\
    update-ca-certificates &&\
    apk add shadow &&\
    addgroup -g ${PGID} stickybot &&\
    adduser -D -u ${PUID} -G stickybot stickybot &&\
    mkdir -p /botdb &&\
    chown -R stickybot:stickybot /botdb
VOLUME /botdb
ENV DB_PATH="/botdb"
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN chown -R stickybot:stickybot ./ &&\ 
    chmod -R 700 ./ 
USER stickybot
CMD ["node", "./src/bot.js"]

FROM node:12.20.1-alpine3.12
WORKDIR /bot
ENV BOT_TOKEN ""
ENV STICKY_COOLDOWN ""
RUN apk update; wget -q "https://github.com/Ethorbit/Discord_Sticky-Message-Bot/archive/main.zip" -O "project.zip" &&\
    mkdir project && unzip project.zip -d project && rm project.zip && cd project &&\
    mv "Discord_Sticky-Message-Bot-main" "bot" && cd "bot" && npm install 
CMD ["node", "project/bot/src/bot.js"]
#!/bin/sh 
usermod -u "$PUID" stickybot > /dev/null 
usermod -g "$PGID" stickybot > /dev/null 
chown -R stickybot:stickybot /botdb
chmod 770 -R /botdb 
su stickybot -c "$*" 

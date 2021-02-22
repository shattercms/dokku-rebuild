#!/bin/sh
echo "- copying files"
cp ./dist/index.js /usr/bin/dokku-rebuild.js
cp ./dist/dokku-rebuild.service /etc/systemd/system/dokku-rebuild.service
echo "- reloading systemctl deamon"
systemctl daemon-reload
echo "- starting service"
systemctl start dokku-rebuild
systemctl enable dokku-rebuild
echo "- done"
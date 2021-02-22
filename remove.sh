#!/bin/sh
echo "- stopping service"
systemctl disable dokku-rebuild
systemctl stop dokku-rebuild
echo "- removing files"
rm /usr/bin/dokku-rebuild.js
rm /etc/systemd/system/dokku-rebuild.service
rm /var/run/dokku-rebuild -rf
echo "- reloading systemctl deamon"
systemctl daemon-reload
echo "- done"
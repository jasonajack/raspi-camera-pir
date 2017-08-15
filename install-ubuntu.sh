#!/bin/bash -x
cd $(dirname ${0})

# Update everything first
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get autoremove -y

# Install Node.js and NPM
sudo apt-get install -y nodejs npm
sudo ln -s /usr/bin/nodejs /usr/bin/node &> /dev/null || true

# Verify install
nodejs -v
npm -v

# Update Node modules
npm install

# Fix issue with not booting when no HDMI cable plugged in
sudo sed -ri s/#?hdmi_force_hotplug=.*/hdmi_force_hotplug=1/g /boot/config.txt

# Install systemd process
./install-systemd.sh


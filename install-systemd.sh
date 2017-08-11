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

# Copy this directory to the correct location to run as a service
service=raspi-camera-pir
dir=/usr/local/${service}
if [[ $(pwd) != ${dir} ]]; then
  sudo rm -rf ${dir}
  sudo mkdir -p ${dir}
  sudo cp -av .git .gitignore * ${dir}
fi
sudo mkdir -p ${dir} /usr/lib/systemd/system
sudo cp -av ${service}.service /usr/lib/systemd/system
sudo systemctl daemon-reload
sudo systemctl start ${service}
sudo systemctl enable ${service}

# Fix issue with not booting when no HDMI cable plugged in
sudo sed -ri s/#?hdmi_force_hotplug=.*/hdmi_force_hotplug=1/g /boot/config.txt


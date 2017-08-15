#!/bin/bash -x
cd $(dirname ${0})

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


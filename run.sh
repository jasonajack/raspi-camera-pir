#!/bin/bash
cd $(dirname ${0})
sudo killall raspivid &> /dev/null
sudo node src/camera.js src/config.json


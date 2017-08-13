#!/bin/bash
cd $(dirname ${0})

# Kill off all previous RaspiVid processes
sudo killall raspivid &> /dev/null

# Run RaspiVid in the background
./src/raspivid.sh &> /dev/null &
pid=$!

# Run Node service
sudo node src/camera.js

# Kill RaspiVid service
kill ${pid}


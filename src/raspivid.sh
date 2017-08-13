#!/bin/bash -x
cd $(dirname ${0})

# Read in variables from config.json
readvar() { cat config.json | python -c "import sys, json; print json.load(sys.stdin)['${1}']"; }
image=$(readvar 'image')
width=$(readvar 'width')
height=$(readvar 'height')
rotation=$(readvar 'rotation')
fps=$(readvar 'fps')
bitrate=$(readvar 'bitrate')

# Purge old images
rm -rf ${image}*

# Run video capture and pipe to ffmpeg to convert to JPG image
raspivid -n -ih -t 0 -rot ${rotation} -fps ${fps} -w ${width} -h ${height} -b ${bitrate} -cd MJPEG -o - | \
  ffmpeg -i - -q:v 1 -updatefirst 1 ${image}


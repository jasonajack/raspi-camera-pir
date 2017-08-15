'use strict'

// Pull in modules to spawn child processes and start the PNG streamer
const path = require('path');
const fs = require('fs');

// Read in configuration file and get name of the image that is updating in the background
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json'), 'utf8'));

// Johnny-Five for RPi
const raspi = require('raspi-io');
const five = require('johnny-five');
const board = new five.Board({repl: false, io: new raspi()});

// Flag to engage image copy
var inMotion = false;

// Enter loop when board starts
board.on('ready', () => {
  console.log('Johhny-Five: board is ready');

  // Create a new `motion` hardware instance.
  const motion = new five.Motion('P1-7'); //a PIR is wired on pin 7 (GPIO 4)

  // 'calibrated' occurs once at the beginning of a session
  motion.on('calibrated', () => {
    console.log('PIR: calibrated');
  });

  // Motion detected
  motion.on('motionstart', () => {
    console.log('PIR: motionstart');
    inMotion = true;
  });

  // 'motionend' events
  motion.on('motionend', () => {
    console.log('PIR: motionend');
    inMotion = false;
  });
});

// Connect to MongoDB
const MongoClient = require('mongodb').MongoClient;
var mongoDb = null;
var mongoCollection = null;

// Connect using MongoClient
MongoClient.connect(config.mongourl, function(err, db) {
  if (err) {
    console.log(`Failed to connect to MongoDB: ${err}`);
    process.exit(1);
  } else {
    // Use the admin database for the operation
    console.log(`Connected to MongoDB: ${config.mongourl}`);
    mongoDb = db;
    mongoCollection = db.collection('images');
  }
});

// Watch the file and if it changes we'll trigger a write operation
var imagesToWrite = [];
const maxImagesInBuffer = parseInt(config.maxImagesInBuffer);
setInterval(() => {
  // Only continue if PIR is detecting motion
  if (inMotion && imagesToWrite.length < maxImagesInBuffer) {
    fs.readFile(config.image, (err, image) => {
      // Check for errors
      var timestamp = Date.now();
      if (err || image.length == 0) {
        console.log(`${timestamp}: (ERROR) Image file not suitable for writing.`);
        return;
      }

      // Insert image into queue; use the timestamp as the unique ID and store the raw image
      // TODO: in some circumstances we might catch an image as it is being written; we need
      //       a way of detecting and discarding this bad data.
      //       I tried parsing the JPEGs each time but that seems to be very slow, so I'll
      //       need to find a better way later.
      console.log(`${timestamp}: Queueing up image of size ${image.length} bytes.`);
      imagesToWrite.push({ '_id': timestamp, 'image': image });
    });
  }
}, parseInt(1000 / parseInt(config.fps)));

// Write to MongoDB on interval
setInterval(() => {
  // Only write if we're not currently collecting images, and if there are images in the queue
  // and if we're connected to MongoDB
  if (imagesToWrite.length > 0 && mongoCollection && !inMotion) {
    // Insert all images into MongoDB
    var insertManyQueue = imagesToWrite;
    imagesToWrite = [];
    mongoCollection.insertMany(insertManyQueue, (err, result) => {
      if (err) {
        console.log(`${Date.now()}: Encountered error when writing to MongoDB: ${err}`);
      } else {
        console.log(`${Date.now()}: Wrote ${insertManyQueue.length} images to MongoDB.`);
      }
    });
  }
}, parseInt(config.writeInterval));

// Ctrl-C exit
process.on('SIGINT', () => {
  if (mongoDb) { mongoDb.close(); }
  process.exit();
});


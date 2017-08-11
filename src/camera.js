'use strict'

// Pull in modules to spawn child processes and start the PNG streamer
const fs = require('fs');
const spawn = require('child_process').spawn;
const PngStreamer = require('png-streamer');

// Read in configuration file and get name of the image that is updating in the background
const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

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

// Spawn the 'raspivid' process
const raspividArgs = [
  '-n',
  '-ih',
  '-t',
  '0',
  '-rot',
  config.rotation,
  '-w',
  config.width,
  '-h',
  config.height,
  '-fps',
  config.fps,
  '-b',
  config.bitrate,
  '-o',
  '-'];
const raspivid = spawn('raspivid', raspividArgs, {stdio: 'pipe'});

// Spawn the 'ffmpeg' process, piping 'raspivid' to 'ffmpeg'
const ffmpegArgs = [
  '-i',
  '-',
  '-qscale:v',
  '2',
  '-f',
  'image2pipe',
  '-vcodec',
  'png',
  '-'];
const ffmpeg = spawn('ffmpeg', ffmpegArgs, {stdio: [raspivid.stdout, 'pipe', 'pipe']});

// Start the PNG image streamer, parsing the output of the ffmpeg stream
new PngStreamer(ffmpeg, (err, png) => {
  // Only continue if PIR is detecting motion
  if (inMotion && mongoCollection) {
    var timestamp = Date.now();
    console.log(`Writing a PNG (${png.length} bytes) on ${timestamp}.`);

    // Insert image into MongoDB
    mongoCollection.insert(
      {
        'timestamp': timestamp,
        'image': png
      }, (err, result) => {
        if (err) {
          console.log(`Encountered error when writing to MongoDB: ${err}`);
        } else {
          console.log(`Wrote image to MongoDB at timestamp: ${timestamp}`);
        }
      });
  }
});

// Ctrl-C exit
process.on('SIGINT', () => {
  if (mongoDb) { mongoDb.close(); }
  process.exit();
});


var MIDI = require('midijs');
var fs = require('fs');

var file = new MIDI.File();

// add/remove tracks or events...

file.on('end', function () {
    // file at 'path' now contains binary MIDI data
    // ready to be played by any other MIDI program
    // (or re-read by this module later)
});

file.on('error', function (err) {
    throw err;
});

file.pipe(fs.createWriteStream(path));
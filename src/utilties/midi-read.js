var MIDI = require('midijs');
var fs = require('fs');

var file = new MIDI.File();

file.on('parsed', function () {
    // file.header contains header data
    // file.tracks contains file tracks
});

file.on('error', function (err) {
    throw err;
});

fs.createReadStream(path).pipe(file)
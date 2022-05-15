const songhelperfs = require('fs');
const { homedir: songhelperhomedir } = require('os');

let songHelperConfigDirectory;
if (process.platform == 'win32') {
	songHelperConfigDirectory =
		songhelperhomedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	songHelperConfigDirectory = songhelperhomedir() + '/.config/faceoffui/app';
}

function getMapDir(id) {
	// TODO: The checking thing doesn't work
	// Most functions should use this method because it checks
	// to see whether the song was preloaded or not, if it wasn't,
	// it'll download and carry on
	// if (!controlfs.existsSync(controlConfigDirectory + '/cache/' + id))
	// preloadMap(id);
	return songHelperConfigDirectory + '/cache/' + id;
}

function parseMapInfo(id) {
	const mapdir = getMapDir(id);
	if (controlfs.existsSync(mapdir + '/info.dat')) {
		return JSON.parse(controlfs.readFileSync(mapdir + '/info.dat'));
	} else {
		return JSON.parse(controlfs.readFileSync(mapdir + '/Info.dat'));
	}
}

function getMaps() {
	const songsdir = songhelperfs.readdirSync(
		songHelperConfigDirectory + '/cache',
	);
	let returnArray = [];

	for (let i = 0; i < songsdir.length; i++) {
		let objectToPush = {
			id: null,
			infofile: null,
		};

		objectToPush.id = songsdir[i];
		objectToPush.infofile = parseMapInfo(songsdir[i]);

		returnArray.push(objectToPush);
	}

	return returnArray;
}

function playPreview(id) {
	const mapDir = getMapDir(id);
	const mapinfo = parseMapInfo(id);

	let audio = new Audio(mapDir + '/' + mapinfo._songFilename);
	audio.currentTime = mapinfo._previewStartTime;
	audio.play();

	let duration = mapinfo._previewDuration;

	// Cap off max preview time for songs like 1fb94 that go on for 77 SECONDS
	if (duration > 17) duration = 12;
	duration = duration - 2; // Subtract 2 seconds to start cutoff early

	// Fade out audio, for hard cutoff, use below commented method

	setTimeout(() => {
		let fadeAudio = setInterval(() => {
			// When volume is zero cut off audio completely and unload
			if (audio.volume == 0.0) {
				clearInterval(fadeAudio);
				audio.pause();
				audio = null;
				return;
			}

			if (audio.volume - 0.1 < 0) audio.volume = 0;
			else audio.volume -= 0.1;
		}, 200);
	}, duration * 1000);

	/* setTimeout(() => {
		audio.pause();
		audio = null; // Unload from memory
	}, duration * 1000); */
}

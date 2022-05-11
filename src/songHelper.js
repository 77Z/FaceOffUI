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

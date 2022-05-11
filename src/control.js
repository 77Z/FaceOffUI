const BeatSaverAPI = require('beatsaver-api');
const { homedir: controlhomedir } = require('os');
const https = require('https');
const controlfs = require('fs');
const extract = require('extract-zip');
const { ipcRenderer } = require('electron');

let controlConfigDirectory;
if (process.platform == 'win32') {
	controlConfigDirectory =
		controlhomedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	controlConfigDirectory = controlhomedir() + '/.config/faceoffui/app';
}

let selectedPlayer1ID = null;
let selectedPlayer2ID = null;

const api = new BeatSaverAPI({
	AppName: 'FaceOffUI',
	Version: '0.1.0',
});

// Preloader
const preloadbutton = document.getElementById('preloadbutton');
const preloadtext = document.getElementById('preloadtext');

preloadbutton.addEventListener('click', function () {
	preloadMap(preloadtext.value);
});

function getMapDir(id) {
	// TODO: The checking thing doesn't work
	// Most functions should use this method because it checks
	// to see whether the song was preloaded or not, if it wasn't,
	// it'll download and carry on
	if (!controlfs.existsSync(controlConfigDirectory + '/cache/' + id))
		preloadMap(id);
	return controlConfigDirectory + '/cache/' + id;
}

function parseMapInfo(id) {
	const mapdir = getMapDir(id);
	if (controlfs.existsSync(mapdir + '/info.dat')) {
		return JSON.parse(controlfs.readFileSync(mapdir + '/info.dat'));
	} else {
		return JSON.parse(controlfs.readFileSync(mapdir + '/Info.dat'));
	}
}

function preloadMap(id) {
	let mapdir = controlConfigDirectory + '/cache/' + id;

	if (controlfs.existsSync(mapdir)) {
		console.error(
			'Song already pre-loaded! if you think this is an error, go delete the map folder',
		);
		return;
	}

	api.getMapByID(id)
		.then((map) => {
			let downloadURL = map.versions[0].downloadURL;

			console.log('Located map: ' + id);

			controlfs.mkdirSync(mapdir);

			const zipfile = controlfs.createWriteStream(mapdir + '/map.zip');
			const request = https.get(downloadURL, (response) => {
				response.pipe(zipfile);

				zipfile.on('finish', () => {
					zipfile.close();
					console.log('Download complete!');
					extractPreloadedZip(id);
				});
			});
		})
		.catch((err) => {
			throw err;
		});
}

function extractPreloadedZip(id) {
	let mapdir = controlConfigDirectory + '/cache/' + id;
	try {
		extract(mapdir + '/map.zip', { dir: mapdir });
		console.log('Extraction Complete, map is ready for use');
	} catch (err) {
		console.error('Unable to extract file!');
		console.error(err);
	}
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

function playerPickerReturn(playerid, playernum) {
	if (typeof playernum !== 'number')
		throw new TypeError('playernum must be number');
	if (typeof playerid !== 'string')
		throw new TypeError('playerid must be string');

	console.log('Got player ' + playerid + ' set to player ' + playernum);

	const roster = readRoster();

	switch (playernum) {
		case 1: {
			selectedPlayer1ID = playerid;
			document.getElementById('playerpicker1').innerText = `[ ${
				findPlayerById(roster, playerid).pretty
			} ]`;
			break;
		}
		case 2: {
			selectedPlayer2ID = playerid;
			document.getElementById('playerpicker2').innerText = `[ ${
				findPlayerById(roster, playerid).pretty
			} ]`;
			break;
		}
		default:
			throw new Error('playernum has to be 1 or 2');
	}
}

document.getElementById('playerpicker1').addEventListener('click', () => {
	ipcRenderer.send('pickplayer', 1);
});

document.getElementById('playerpicker2').addEventListener('click', () => {
	ipcRenderer.send('pickplayer', 2);
});

ipcRenderer.on('playerpicker.return', (_event, id, playerNumber) => {
	playerPickerReturn(id, playerNumber);
});

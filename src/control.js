const BeatSaverAPI = require('beatsaver-api');
const { homedir: controlhomedir } = require('os');
const https = require('https');
const controlfs = require('fs');
const extract = require('extract-zip');
const { ipcRenderer } = require('electron');
const toastr = require('toastr');

toastr.options.progressBar = true;
toastr.options.toastClass = 'toastClass';

let controlConfigDirectory;
if (process.platform == 'win32') {
	controlConfigDirectory =
		controlhomedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	controlConfigDirectory = controlhomedir() + '/.config/faceoffui/app';
}

// Running vars
let selectedPlayer1ID = null;
let selectedPlayer2ID = null;

// Player creation vars
let profilePictureUploadPath = null;

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

function preloadMap(id) {
	let mapdir = controlConfigDirectory + '/cache/' + id;

	if (controlfs.existsSync(mapdir)) {
		console.error(
			'Song already pre-loaded! if you think this is an error, go delete the map folder',
		);
		toastr.error(
			'Song already pre-loaded! if you think this is an error, go delete the map folder',
			'Beat Saver Download',
		);
		return;
	}

	api.getMapByID(id)
		.then((map) => {
			let downloadURL = map.versions[0].downloadURL;
			let mapTitle = map.name;

			toastr.info('Located map: ' + mapTitle, 'Beat Saver');

			console.log('Located map: ' + id);

			controlfs.mkdirSync(mapdir);

			const zipfile = controlfs.createWriteStream(mapdir + '/map.zip');
			const request = https.get(downloadURL, (response) => {
				response.pipe(zipfile);

				zipfile.on('finish', () => {
					zipfile.close();
					console.log('Download complete!');
					toastr.info(mapTitle, 'Download complete');
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
		toastr.success('Extraction Complete, map is ready for use!');
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

// Roster

document
	.getElementById('profilePictureUpload')
	.addEventListener('click', () => {
		ipcRenderer.send('selectProfilePicture');
	});

ipcRenderer.on('selectedPFP', (_event, location) => {
	console.log('selected profile picture: ' + location);
	toastr.success('Selected a profile picture!');
	profilePictureUploadPath = location;
});

ipcRenderer.on('did-not-selectPFP', () => {
	console.log('Did not select pfp');
	toastr.warning('Did not select profile picture');
});

const newPlayerName = document.getElementById('newPlayerName');

document.getElementById('addNewPlayerButton').addEventListener('click', () => {
	createNewPlayer(newPlayerName.value, profilePictureUploadPath);
	toastr.success(`Added ${newPlayerName.value} to the roster`);
	reloadRoster();
});

document
	.getElementById('reloadRosterButton')
	.addEventListener('click', reloadRoster);

const playersUL = document.getElementById('players');
function reloadRoster() {
	const roster = readRoster();

	while (playersUL.firstChild) playersUL.removeChild(playersUL.firstChild);

	for (let i = 0; i < roster.length; i++) {
		let entryLI = document.createElement('li');
		entryLI.innerHTML = `
								<img width='80' src='${configDirectory}/profiles/${roster[i].id}.png' />
								<p>${roster[i].pretty}</p>
							`;
		playersUL.appendChild(entryLI);
	}
}

reloadRoster();

// Charts

const mapsUL = document.getElementById('maps');
function reloadMaps() {
	const maps = getMaps();

	for (let i = 0; i < maps.length; i++) {
		let entryLI = document.createElement('li');

		let difficultytags = '';
		let beatmapSets = maps[i].infofile._difficultyBeatmapSets;

		// I got sick of writing for loops so we're using foreach now
		beatmapSets.forEach((mapSet) => {
			difficultytags += `<div class='mapcharacteristic'>${mapSet._beatmapCharacteristicName}</div>`;
			mapSet._difficultyBeatmaps.forEach((beatmap) => {
				if (
					beatmap.hasOwnProperty('_customData') &&
					beatmap._customData.hasOwnProperty('_difficultyLabel')
				) {
					difficultytags += `<div class='difficultytag'>${beatmap._customData._difficultyLabel}</div>`;
				} else {
					difficultytags += `<div class='difficultytag'>${beatmap._difficulty}</div>`;
				}
			});
		});

		// for (let l = 0; l < beatmaps.length; l++) {
		// 	let beatmap = beatmaps[l];
		// 	if (
		// 		beatmap.hasOwnProperty('_customData') &&
		// 		beatmap._customData.hasOwnProperty('_difficultyLabel')
		// 	) {
		// 		difficultytags += `<div class='difficultytag'>${beatmap._customData._difficultyLabel}</div>`;
		// 	} else {
		// 		difficultytags += `<div class='difficultytag'>${beatmap._difficulty}</div>`;
		// 	}
		// }

		entryLI.innerHTML = `
								<img width='80' src='${controlConfigDirectory}/cache/${maps[i].id}/${maps[i].infofile._coverImageFilename}' />
								<div>
									<span class='bold'>${maps[i].infofile._songName}</span>
									<br />
									<span>${maps[i].infofile._songAuthorName} [${maps[i].infofile._levelAuthorName}]</span>
									<br />
									<div class='difficultytags'>
										${difficultytags}
									</div>
								</div>
							`;
		mapsUL.appendChild(entryLI);
	}
}

reloadMaps();

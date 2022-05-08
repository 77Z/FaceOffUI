const BeatSaverAPI = require('beatsaver-api');
const { homedir } = require('os');
const https = require('https');
const fs = require('fs');
const extract = require('extract-zip');

let configDirectory;
if (process.platform == 'win32') {
	configDirectory = homedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	configDirectory = homedir() + '/.config/faceoffui/app';
}

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

function getMapDir() {
	// Most functions should use this method because it checks
	// to see whether the song was preloaded or not, if it wasn't,
	// it'll download and carry on
}

function preloadMap(id) {
	let mapdir = configDirectory + '/cache/' + id;

	if (fs.existsSync(mapdir)) {
		console.error(
			'Song already pre-loaded! if you think this is an error, go delete the map folder',
		);
		return;
	}

	api.getMapByID(id)
		.then((map) => {
			let downloadURL = map.versions[0].downloadURL;

			console.log('Located map: ' + id);

			fs.mkdirSync(mapdir);

			const zipfile = fs.createWriteStream(mapdir + '/map.zip');
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
	let mapdir = configDirectory + '/cache/' + id;
	try {
		extract(mapdir + '/map.zip', { dir: mapdir });
		console.log('Extraction Complete, map is ready for use');
	} catch (err) {
		console.error('Unable to extract file!');
		console.error(err);
	}
}

function playPreview(id) {}

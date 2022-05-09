const fs = require('fs');
const { homedir } = require('os');

let configDirectory;
if (process.platform == 'win32') {
	configDirectory = homedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	configDirectory = homedir() + '/.config/faceoffui/app';
}

const playersUL = document.getElementById('playersUL');

const roster = JSON.parse(fs.readFileSync(configDirectory + '/roster.json'));

if (roster.length === 0) {
	playersUL.innerText = 'No Players Registered';
} else reload();

function reload() {
	for (let i = 0; i < roster.length; i++) {
		let entryLI = document.createElement('li');
		entryLI.innerHTML = `<img width='80' src='${configDirectory}/profiles/${roster[i].id}.png' /> <p>${roster[i].pretty}</p>`;
		playersUL.appendChild(entryLI);
	}
}

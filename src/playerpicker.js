const { ipcRenderer } = require('electron');
const fs = require('fs');
const { homedir } = require('os');

let configDirectory;
if (process.platform == 'win32') {
	configDirectory = homedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	configDirectory = homedir() + '/.config/faceoffui/app';
}

let playernumber;

ipcRenderer.on('playernumber', (_event, number) => {
	playernumber = number;
});

const playersUL = document.getElementById('playersUL');

const roster = JSON.parse(fs.readFileSync(configDirectory + '/roster.json'));

if (roster.length === 0) {
	playersUL.innerText = 'No Players Registered';
} else reload();

function reload() {
	for (let i = 0; i < roster.length; i++) {
		let entryLI = document.createElement('li');
		entryLI.addEventListener('click', () => {
			ipcRenderer.send(
				'pickplayer.MAIN.return',
				roster[i].id,
				playernumber,
			);

			window.close();
		});
		entryLI.innerHTML = `<img width='80' src='${configDirectory}/profiles/${roster[i].id}.png' /> <p>${roster[i].pretty}</p>`;
		playersUL.appendChild(entryLI);
	}
}

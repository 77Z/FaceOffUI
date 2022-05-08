const electron = require('electron');
const { app, BrowserWindow, ipcMain } = require('electron');
const { mkdirSync, writeFileSync } = require('fs');
const { existsSync } = require('original-fs');
const { homedir } = require('os');

let controlWindow;
let displayWindow;

let configDirectory;
if (process.platform == 'win32') {
	configDirectory = homedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	configDirectory = homedir() + '/.config/faceoffui/app';
}

function startup() {
	// FS setup
	if (!existsSync(configDirectory)) {
		mkdirSync(configDirectory);
		mkdirSync(configDirectory + '/cache');
		writeFileSync(configDirectory + '/roster.json', '');
	}

	let displays = electron.screen.getAllDisplays();
	if (displays.length === 1) throw new Error('Only one display found!');

	console.log('Found multiple displays! Using the first non-primary one');
	let externalDisplay = displays.find((display) => {
		return display.bounds.x !== 0 || display.bounds.y !== 0;
	});

	displayWindow = new BrowserWindow({
		x: externalDisplay.bounds.x,
		y: externalDisplay.bounds.y,
		fullscreen: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	displayWindow.loadFile(`./dom/displayClient.html`);
	displayWindow.on('closed', () => {
		displayWindow = null;
	});

	controlWindow = new BrowserWindow({
		x: 10,
		y: 10,
		width: 960,
		height: 900,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	controlWindow.loadFile('./dom/control.html');
	controlWindow.on('closed', () => {
		controlWindow = null;
	});
}

app.on('ready', () => {
	startup();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) startup();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

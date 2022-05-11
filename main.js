const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { mkdirSync, writeFileSync } = require('fs');
const { existsSync } = require('original-fs');
const { homedir } = require('os');

let controlWindow;
let displayWindow;
let componentsWindow;

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
		mkdirSync(configDirectory + '/profiles');
		writeFileSync(configDirectory + '/roster.json', '[]');
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

	// componentsWindow = new BrowserWindow({
	// 	x: 10,
	// 	y: 10,
	// 	width: 500,
	// 	height: 500,
	// 	webPreferences: {
	// 		nodeIntegration: true,
	// 		contextIsolation: false,
	// 	},
	// });

	// componentsWindow.loadFile('./dom/debugComponents.html');
	// componentsWindow.on('closed', () => {
	// 	componentsWindow = null;
	// });
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

let playerPicker;

ipcMain.on('pickplayer', (_event, playerNumber) => {
	playerPicker = new BrowserWindow({
		width: 500,
		height: 800,
		alwaysOnTop: true,
		x: 40,
		y: 40,
		resizable: false,
		minimizable: false,
		maximizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	playerPicker.loadFile('./dom/playerpicker.html');

	playerPicker.webContents.on('did-finish-load', () => {
		playerPicker.webContents.send('playernumber', playerNumber);
	});

	playerPicker.on('closed', () => {
		playerPicker = null;
	});
});

ipcMain.on('pickplayer.MAIN.return', (_event, id, playerNumber) => {
	controlWindow.webContents.send('playerpicker.return', id, playerNumber);
});

ipcMain.on('selectProfilePicture', (event) => {
	dialog
		.showOpenDialog({
			properties: ['openFile'],
		})
		.then((data) => {
			if (data.filePaths.length !== 0) {
				console.log(data.filePaths);
				event.sender.send('selectedPFP', data.filePaths[0]);
			} else {
				event.sender.send('did-not-selectPFP');
			}
		});
});

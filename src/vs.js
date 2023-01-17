const { ipcRenderer } = require('electron');
const { homedir: vshomedir } = require('os');

const player = document.getElementById('player');
const lefthalf = document.getElementById('lefthalf');
const righthalf = document.getElementById('righthalf');
// Initialize Canvas
const animationcanvas = document.getElementById('videocanvas');
const animationctx = animationcanvas.getContext('2d', {
	willReadFrequently: true,
});

const songtitle = document.getElementById('songtitle');
const artistnameandid = document.getElementById('artistnameandid');
const coverartelement = document.getElementById('coverart');

const mainscreen = document.getElementById('mainscreen');

let vsConfigDirectory;
if (process.platform == 'win32') {
	vsConfigDirectory = vshomedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	vsConfigDirectory = vshomedir() + '/.config/faceoffui/app';
}

ipcRenderer.on(
	'controlpanel.MAIN.playsong',
	(_e, selectedPlayer1ID, selectedPlayer2ID, selectedSong) => {
		transitionToVS(selectedSong.id, selectedPlayer1ID, selectedPlayer2ID);
	},
);

function transitionToVS(songid, player1id, player2id) {
	stopIntermissionAnimation();

	// Initialize all data before playing any animation
	const roster = readRoster();
	const player1 = findPlayerById(roster, player1id);
	const player2 = findPlayerById(roster, player2id);

	lefthalf.innerHTML =
		generateProfileImageHex(
			`${vsConfigDirectory}/profiles/${player1.id}.png`,
			'#f00',
			'#00f',
		) + `<span class='playername'>${player1.pretty}</span>`;

	righthalf.innerHTML =
		generateProfileImageHex(
			`${vsConfigDirectory}/profiles/${player2.id}.png`,
			'#0f0',
			'#ff0',
		) + `<span class='playername'>${player2.pretty}</span>`;

	righthalf.style.bottom = '200px';
	righthalf.style.right = '200px';

	lefthalf.style.top = '100px';
	lefthalf.style.left = '200px';

	player.style.display = 'block';
	// player.src = '../media/opening.mp4';
	player.src = '../media/fullanimation.mp4';
	player.play();
	timerCallback();

	let versusSound = new Audio('../media/versus.ogg');
	versusSound.play();

	setTimeout(() => {
		mainscreen.style.display = 'block';

		const mapinfo = parseMapInfo(songid);
		console.log(mapinfo);
		songtitle.innerText = mapinfo._songName;
		artistnameandid.innerText = mapinfo._songAuthorName + ' - ' + songid;

		const coverart = getMapDir(songid) + '/' + mapinfo._coverImageFilename;
		coverartelement.src = coverart;
	}, 500);

	setTimeout(() => {
		player.pause();
		ipcRenderer.send('playPreview', songid);
		setTimeout(() => {
			player.play();
			timerCallback();

			righthalf.style.right = '-600px';
			lefthalf.style.left = '-600px';
		}, 10000);
	}, 2000);
}

function timerCallback() {
	if (player.paused || player.ended) return;

	computeFrame();
	setTimeout(function () {
		timerCallback();
	}, 0);
}

function computeFrame() {
	animationctx.drawImage(player, 0, 0, 1920, 1080);
	let frame = animationctx.getImageData(0, 0, 1920, 1080);
	let l = frame.data.length / 4;

	for (let i = 0; i < l; i++) {
		let r = frame.data[i * 4 + 0];
		let g = frame.data[i * 4 + 1];
		let b = frame.data[i * 4 + 2];
		if (g > 100 && r < 20 && b < 20) frame.data[i * 4 + 3] = 0;
	}
	animationctx.putImageData(frame, 0, 0);
	return;
}

function resetTransition() {
	// Reset Positions
	righthalf.style.bottom = '-500px';
	righthalf.style.right = '400px';

	lefthalf.style.top = '-500px';
	lefthalf.style.left = '400px';
}

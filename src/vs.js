const { homedir: vshomedir } = require('os');

const player = document.getElementById('player');
const lefthalf = document.getElementById('lefthalf');
const righthalf = document.getElementById('righthalf');

let vsConfigDirectory;
if (process.platform == 'win32') {
	vsConfigDirectory = vshomedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	vsConfigDirectory = vshomedir() + '/.config/faceoffui/app';
}

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
	player.src = '../media/closing.mov';
	player.play();
}

function resetTransition() {
	// Reset Positions
	righthalf.style.bottom = '-500px';
	righthalf.style.right = '400px';

	lefthalf.style.top = '-500px';
	lefthalf.style.left = '400px';
}

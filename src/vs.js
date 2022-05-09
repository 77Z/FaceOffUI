const player = document.getElementById('player');
const lefthalf = document.getElementById('lefthalf');
const righthalf = document.getElementById('righthalf');

function transitionToVS() {
	stopIntermissionAnimation();

	lefthalf.innerHTML = generateProfileImageHex(
		'/home/vince/.config/faceoffui/app/profiles/vince.png',
		'#f00',
		'#00f',
	);

	righthalf.innerHTML = generateProfileImageHex(
		'/home/vince/.config/faceoffui/app/profiles/vince.png',
		'#0f0',
		'#ff0',
	);

	lefthalf.style.top = '0';
	righthalf.style.top = '0';

	player.style.display = 'block';
	player.src = '../media/opening.mp4';
	player.play();
}

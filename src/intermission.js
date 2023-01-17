let canvas = document.getElementById('background');
let ctx = canvas.getContext('2d');
let possibleColors = ['#f0f'];

let animationFrameHandle;
let blobberrunning = true;

function playIntermissionAnimation() {
	window.requestAnimationFrame(frame);
	blobberrunning = true;
}

function stopIntermissionAnimation() {
	window.cancelAnimationFrame(animationFrameHandle);
	blobberrunning = false;
}

reproject();

let blobs = [];

setInterval(function () {
	if (!blobberrunning) return;
	addBlob();
}, 500);

window.onresize = function () {
	reproject();
};

function removeBlob(blobIndex) {
	blobs.splice(blobIndex, 1);
}

function getRandomRange(min, max) {
	return Math.random() * (max - min) + min;
}

function addBlob() {
	let blob = {
		x: Math.floor(getRandomRange(0, window.innerWidth)),
		y: window.innerHeight + 170,
		size: Math.floor(getRandomRange(70, 170)),
		color: possibleColors[
			Math.floor(Math.random() * possibleColors.length)
		],
		speed: Math.floor(getRandomRange(0, 3)),
	};
	blobs.push(blob);
}

function reproject() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function render() {
	for (let i = 0; i < blobs.length; i++) {
		let c = blobs[i];
		ctx.fillStyle = c.color;
		ctx.beginPath();
		ctx.arc(c.x, c.y, c.size, 0, 2 * Math.PI);
		ctx.fill();
	}
}

function frame() {
	canvas.width = canvas.width;
	render();
	for (let i = 0; i < blobs.length; i++) {
		let c = blobs[i];
		c.y -= c.speed;
		if (c.y < -170) removeBlob(i);
	}
	animationFrameHandle = window.requestAnimationFrame(frame);
}
frame();

const songstatus = document.getElementById('songstatus');
const dbgloadbtn = document.getElementById('dbgloadbtn');
const dbgloadinp = document.getElementById('dbgloadinp');
const lightsyncfs = require('fs');

// Format:
/* 

each element of timeindex represents one beat.
In each beat is all the events that happen on that beat
(decimal beats are rounded to the nearest beat)

timeindex [
	[
		{
			_time: 1,
			_type: 0,
			_value: 6,
			_floatValue: 1
		},
		{
			_time: 1,
			_type: 1,
			_value: 3,
			_floatValue: 1
		}
	]
]

*/

let timeindex = [];
let BPM = 0;
let gblsongid = null;

dbgloadbtn.addEventListener('click', function () {
	const songid = dbgloadinp.value;
	gblsongid = songid;

	const map = parseMapInfo(songid);

	songstatus.innerText = `Song: ${map._songName} BPM: ${map._beatsPerMinute}`;

	BPM = map._beatsPerMinute;

	console.log('Finding ExpertPlusStandard.dat');

	const chartdata = JSON.parse(
		lightsyncfs.readFileSync(getMapDir(songid) + '/ExpertPlusStandard.dat'),
	);
	const eventData = chartdata._events; // This is an array

	console.log(eventData.length);

	for (let i = 0; i < eventData.length; i++) {
		let currentBeatFromObject = Math.round(eventData[i]._time);

		if (timeindex[currentBeatFromObject] === undefined) {
			timeindex[currentBeatFromObject] = [eventData[i]];
		} else {
			timeindex[currentBeatFromObject].push(eventData[i]);
		}
	}

	console.log('ready to play');
});

function light(id, color) {
	document.getElementById(id).style.background = color;
}

document.getElementById('playbutton').addEventListener('click', function () {
	let songPos = 0;

	const map = parseMapInfo(gblsongid);
	const mapdir = getMapDir(gblsongid);

	let audio = new Audio(mapdir + '/' + map._songFilename);
	audio.play();

	setInterval(function () {
		if (timeindex[songPos] !== undefined) {
			timeindex[songPos].forEach((lightEvent) => {
				console.log(
					`type ${lightEvent._type} with value ${lightEvent._value}`,
				);

				let lightType = null;
				let lightColor = null;

				switch (lightEvent._type) {
					case 0:
						lightType = 'back-lasers';
						break;
					case 1:
						lightType = 'big-rings';
						break;
					case 2:
						lightType = 'left-rotating-lasers';
						break;
					case 3:
						lightType = 'right-rotating-lasers';
						break;
					case 4:
						lightType = 'center-lights';
						break;
					default:
						lightType = 'center-lights';
						break;
				}

				switch (lightEvent._value) {
					case 0:
						lightColor = '#fff';
						break;
					case 1:
						lightColor = '#00f';
						break;
					case 2:
						lightColor = '#00f';
						break;
					case 3:
						lightColor = '#00f';
						break;
					case 5:
						lightColor = '#f00';
						break;
					case 6:
						lightColor = '#f00';
						break;
					case 7:
						lightColor = '#f00';
						break;
					default:
						lightColor = '#000';
						break;
				}

				light(lightType, lightColor);
			});
		}

		songPos++;
	}, 60000 / BPM);
});

const fs = require('fs');
const { homedir } = require('os');
const { v4: uuidv4 } = require('uuid');

let configDirectory;
if (process.platform == 'win32') {
	configDirectory = homedir() + '/AppData/Roaming/faceoffui/app';
} else {
	// Assume UNIX-like
	configDirectory = homedir() + '/.config/faceoffui/app';
}

function generateProfileImageHex(image, gradientcolor1, gradientcolor2) {
	return `<svg
	width="333"
	height="373"
	viewBox="0 0 333 373"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
>
	<path
		d="M170.656 12.5853L166.5 10.2558L162.344 12.5853L13.8206 95.8353L9.47664 98.2702V103.25V269.75V274.73L13.8206 277.165L162.344 360.415L166.5 362.744L170.656 360.415L319.179 277.165L323.523 274.73V269.75V103.25V98.2702L319.179 95.8353L170.656 12.5853Z"
		fill="url(#pattern0)"
		stroke="url(#paint0_linear_24_3)"
		stroke-width="17"
	/>
	<defs>
		<pattern
			id="pattern0"
			patternContentUnits="objectBoundingBox"
			width="1"
			height="1"
		>
			<use
				xlink:href="#image0_24_3"
				transform="translate(-0.0763323) scale(0.00343055 0.00353357)"
			/>
		</pattern>
		<linearGradient
			id="paint0_linear_24_3"
			x1="-5"
			y1="186.5"
			x2="338"
			y2="186.5"
			gradientUnits="userSpaceOnUse"
		>
			<stop stop-color="${gradientcolor1}" />
			<stop offset="1" stop-color="${gradientcolor2}" />
		</linearGradient>
		<image
			id="image0_24_3"
			width="336"
			height="283"
			xlink:href="${image}"
		/>
	</defs>
</svg>`;
}

function readRoster() {
	return JSON.parse(fs.readFileSync(configDirectory + '/roster.json'));
}

function createNewPlayer(name, locationToPfp) {
	const roster = readRoster();
	const newplayerID = uuidv4();

	const newroster = roster;
	newroster.push({
		id: newplayerID,
		pretty: name,
	});

	fs.copyFileSync(
		locationToPfp,
		`${configDirectory}/profiles/${newplayerID}.png`,
	);

	fs.writeFileSync(
		configDirectory + '/roster.json',
		JSON.stringify(newroster, null, '\t'),
	);
}

function findPlayerById(rosterObject, id) {
	return rosterObject.filter((rosterObject) => {
		return rosterObject['id'] == id;
	})[0];
}

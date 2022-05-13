const { Adb } = require('@devicefarmer/adbkit');

const client = Adb.createClient();

function adbRun(command, device) {
	// TODO: This is a stub
	// https://github.com/DeviceFarmer/adbkit
}

function restartBeatSaber() {
	adbRun('shell am force-stop com.beatgames.beatsaber');
	adbRun(
		'shell am start com.beatgames.beatsaber/com.unity3d.player.UnityPlayerActivity',
	);
}

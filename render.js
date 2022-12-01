

import { desktopCapturer } from 'electron';

import { writeFile } from 'fs';
import { remote } from '@electron/remote';
const { Menu } = remote;
const { dialog } = remote;


// Global State
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');
const StartBtn = document.getElementById('startBtn');
StartBtn.onclick = (e) => {
	mediaRecorder.start();
	StartBtn.classList.add('is-danger');
	StartBtn.innerText = 'Recording';
};
const StopBtn = document.getElementById('stopBtn');
StopBtn.onclick = (e) => {
	mediaRecorder.stop();
	StartBtn.classList.remove('is-danger');
	StartBtn.innerText = 'Start';
};

const videoSelectBtn = document.getElementById('videoSelectionBtn');
videoSelectBtn.onclick = getVideoSources;



// Get the available video sources
async function getVideoSources() {
	const inputSources = await desktopCapturer.getSources({
		types: ['window', 'screen']
	});

	const videoOptionsMenu = Menu.buildFromTemplate(
		inputSources.map(source => {
			return {
				label: source.name,
				click: () => selectSources(source)
			};
		})
	);
	videoOptionsMenu.popup();
}



// Change the videoSource window to record
async function selectSources(source) {
	videoSelectBtn.innerText = source.name;

	const constraints = {
		audio: false,
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id
			}
		}
	};

	// Create a Stream
	const stream = await navigator.mediaDevices.getUserMedia(constraints);

	// Preview the source in a video element
	videoElement.srcObject = stream;
	videoElement.play();
}


// Create the Media Recorder

const options = { mimeType: 'video/webm; codecs=vp9' };
mediaRecorder = new MediaRecorder(stream, options);

// Register Event handlers

mediaRecorder.ondataavailable = handleDataAvailable;
mediaRecorder.onstop = handleStop;


// captures all recorded chunks

function handleDataAvailable(e) {
	console.log('video data available');
	recordedChunks.push(e.data);
}



// saves the video file on stop
async function handleStop(e) {
	const blob = new Blob(recordedChunks, {
		type: 'video/webm; codecs=vp9'
	});

	const buffer = Buffer.from(await blob.arrayBuffer());

	const { filePath } = await dialog.showSaveDialog({
		buttonLabel: 'Save video',
		defaultPath: `vid-${Date.now()}.webm`
	});


	if (filePath) {
		writeFile(filePath, buffer, () => console.log('video saved successfully!'))
	}
}
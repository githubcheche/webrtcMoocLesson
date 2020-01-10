'use strict'

// 增加devices标签
var audioSource = document.querySelector('select#audioSource');
var audioOutput = document.querySelector('select#audioOutput');
var videoSource = document.querySelector('select#videoSource');

var videoplay = document.querySelector('video#player');

//filter
var filtersSelect = document.querySelector('select#filter');

//picture
var snapshot = document.querySelector('button#snapshot');
var picture = document.querySelector('canvas#picture');
picture.width = 640;
picture.height = 480;

var divConstraints = document.querySelector('div#constraints');

// 增加获取设备列表后回调处理
function gotDevices(deviceInfos) {
	if (!videoSource.value) {
		deviceInfos.forEach(function (deviceinfo) {
			var option = document.createElement('option');
			option.text = deviceinfo.label;
			option.value = deviceinfo.deviceId;

			if (deviceinfo.kind === 'audioinput') {
				audioSource.appendChild(option);
			} else if (deviceinfo.kind === 'audiooutput') {
				audioOutput.appendChild(option);
			} else if (deviceinfo.kind === 'videoinput') {
				videoSource.appendChild(option);
			}

		})
	}
}



function start() {
	if (window.stream) {
		window.stream.getTracks().forEach(track => {
			track.stop();
		});
	}

	if (!navigator.mediaDevices ||
		!navigator.mediaDevices.getUserMedia) {

		console.log('getUserMedia is not supported!');
		return;

	} else {
		var deviceId = videoSource.value;
		var constraints = {
			video: {
				width: 640,
				height: 480,
				frameRate: 15,
				facingMode: 'enviroment',
				deviceId: deviceId ? {
					exact: deviceId
				} : undefined
			},
			audio: {
				noiseSuppression: true,
				echoCancellation: true
			}
		}

		navigator.mediaDevices.getUserMedia(constraints)
			.then(gotMediaStream)
			.then(gotDevices)
			.catch(handleError);
	}
}

start();

videoSource.onchange = start;

filtersSelect.onchange = function () {
	videoplay.className = filtersSelect.value;
}

// snapshot点击事件
snapshot.onclick = function () {
	picture.className = filtersSelect.value; //设置滤镜
	picture.getContext('2d').drawImage(videoplay, 0, 0, picture.width, picture.height);
}

function gotMediaStream(stream) {
	var videoTrack = stream.getVideoTracks()[0];
	var videoConstraints = videoTrack.getSettings();

	divConstraints.textContent = JSON.stringify(videoConstraints, null, 2);

	window.stream = stream;
	videoplay.srcObject = stream;
	// 增加返回enumerateDevices的promise
	return navigator.mediaDevices.enumerateDevices();
}

function handleError(err) {
	console.log('getUserMedia error:', err);
}


//record
var recvideo = document.querySelector('video#recplayer');
var btnRecord = document.querySelector('button#record');
var btnPlay = document.querySelector('button#recplay');
var btnDownload = document.querySelector('button#download');

var buffer;
var mediaRecorder;

function startRecord() {
	buffer = [];

	var options = {
		//音頻視頻同時有的時候是video只有音頻的時候是audio
		mimeType: 'video/webm;codecs=vp8'
	}

	// 判断是否支持mimeType
	if (!MediaRecorder.isTypeSupported(options.mimeType)) {
		console.error(`${options.mimeType} is not supported!`);
		return;
	}

	try {
		mediaRecorder = new MediaRecorder(window.stream, options);
	} catch (e) {
		console.error('Failed to create MediaRecorder:', e);
		return;
	}

	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.start(10);
}

function stopRecord() {
	mediaRecorder.stop();
}

// 处理时间片
function handleDataAvailable(e) {
	if (e && e.data && e.data.size > 0) {
		buffer.push(e.data);
	}
}

// 录制点击事件
btnRecord.onclick = () => {
	if (btnRecord.textContent === 'Start Record') {
		startRecord();
		btnRecord.textContent = 'Stop Record';
		btnPlay.disabled = true;
		btnDownload.disabled = true;
	} else {
		stopRecord();
		btnRecord.textContent = 'Start Record';
		btnPlay.disabled = false;
		btnDownload.disabled = false;
	}
}

// 播放点击事件
btnPlay.onclick = () => {
	var blob = new Blob(buffer, {
		type: 'video/webm'
	});
	recvideo.src = window.URL.createObjectURL(blob);
	recvideo.srcObject = null; // 直播流时赋值stream，播放流时置空
	recvideo.controls = true;
	recvideo.play();
}

// 下载点击事件
btnDownload.onclick = () => {
	var blob = new Blob(buffer, {
		type: 'video/webm'
	});
	var url = window.URL.createObjectURL(blob);
	var a = document.createElement('a');

	a.href = url;
	a.style.display = 'none';
	a.download = 'aaa.webm';
	a.click();
}
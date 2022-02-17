import React from 'react';
import { useEffect } from 'react';
import { useSocketIO } from '../../../utils/custom-hooks/useSocketIO';

const peerConnections = {};
let videoCameraSelected = 0;
let intervalId = null;

const config = {
  iceServers: [
    {
      "urls": "stun:stun.l.google.com:19302",
    },
    // {
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ]
};
let stream;

export const DragonTigerBroadcast = () => {
  const socket = useSocketIO()

  useEffect(() => {
    socket.on("answer", (id, description) => {
      peerConnections[id].setRemoteDescription(description);
    });

    socket.on("watcher", id => {
      const peerConnection = new RTCPeerConnection(config);
      peerConnections[id] = peerConnection;

      stream = videoElement.srcObject;
      stream.getTracks().forEach(track => {
        return peerConnection.addTrack(track, stream);
      });

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit("candidate", id, event.candidate);
        }
      };

      peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socket.emit("offer", id, peerConnection.localDescription);
        });
    });

    socket.on("candidate", (id, candidate) => {
      peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("disconnectPeer", id => {
      peerConnections[id].close();
      delete peerConnections[id];
    });

    window.onunload = window.onbeforeunload = () => {
      socket.close();
    };
  }, [socket])

  // Get camera and microphone
  let videoElement = null
  let audioSelect = null
  let videoSelect = null

  useEffect(() => {
    videoElement = document.querySelector("video");
    audioSelect = document.querySelector("select#audioSource");
    videoSelect = document.querySelector("select#videoSource");
  }, [])

  useEffect(()=>{
    return () => {
      const tracks = videoElement.srcObject.getTracks();
      tracks[0].stop();
      tracks.forEach(track => track.stop());
      clearInterval(intervalId)
    }
  }, [videoElement])

  useEffect(() => {
    if (audioSelect && videoSelect) {
      intervalId = setInterval(()=> {
        videoCameraSelected = (videoCameraSelected + 1) % videoSelect.options.length
        changeCamera(videoSelect.options[videoCameraSelected].value)
      }, 5000)
    }
  }, [])

  useEffect(() => {
    if (audioSelect && videoSelect) {
      console.log('change video source')
      audioSelect.onchange = getStream;
      videoSelect.onchange = getStream;
      getStream()
        .then(getDevices)
        .then(gotDevices);
    }
  }, [videoElement, audioSelect, videoSelect])

  const getDevices = async () => {
    return await navigator.mediaDevices.enumerateDevices();
  }

  function gotDevices(deviceInfos) {
    window.deviceInfos = deviceInfos;
    for (const deviceInfo of deviceInfos) {
      const option = document.createElement("option");
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === "audioinput") {
        option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
        audioSelect.appendChild(option);
      } else if (deviceInfo.kind === "videoinput") {
        option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
        videoSelect.appendChild(option);
      }
    }
  }

  function getStream() {
    if (window.stream) {
      window.stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    const audioSource = audioSelect.value;
    const videoSource = videoSelect.value;
    console.log(videoSelect.value)
    const constraints = {
      audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
      video: { deviceId: videoSource ? { exact: videoSource } : undefined }
    };
    return navigator.mediaDevices
      .getUserMedia(constraints)
      .then(gotStream)
      .catch(handleError);
  }

  function changeCamera(videoSource) {
    const audioSource = audioSelect.value;
    const constraints = {
      audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
      video: { zoom: 1000, deviceId: videoSource ? { exact: videoSource } : undefined }
    };
    return navigator.mediaDevices
      .getUserMedia(constraints)
      .then(gotStream)
      .catch(handleError);
  }

  function gotStream(stream) {
    window.stream = stream;
    audioSelect.selectedIndex = [...audioSelect.options].findIndex(
      option => option.text === stream.getAudioTracks()[0].label
    );
    videoSelect.selectedIndex = [...videoSelect.options].findIndex(
      option => option.text === stream.getVideoTracks()[0].label
    );
    videoElement.srcObject = stream;
    socket.emit("broadcaster");
  }

  function handleError(error) {
    console.error("Error: ", error);
  }


  return (
    <>
      <section className="select">
        <label htmlFor="audioSource">Audio source: </label>
        <select id="audioSource"></select>
      </section>

      <section className="select">
        <label htmlFor="videoSource">Video source: </label>
        <select id="videoSource"></select>
      </section>

      <video height={800} width={1200} playsInline autoPlay muted></video>
    </>
  );
};

import React from 'react';
import { useEffect } from 'react';
import { useSocketIO } from '../../../utils/custom-hooks/useSocketIO';

let peerConnection;
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

export const DragonTigerViewer = () => {
  const socket = useSocketIO()

  let video = null
  useEffect(() => {
    video = document.querySelector("video");
  }, [])

  useEffect(() => {
    if (video) {
      socket.on("offer", (id, description) => {
        peerConnection = new RTCPeerConnection(config);
        peerConnection
          .setRemoteDescription(description)
          .then(() => peerConnection.createAnswer())
          .then(sdp => peerConnection.setLocalDescription(sdp))
          .then(() => {
            socket.emit("answer", id, peerConnection.localDescription);
          });
        peerConnection.ontrack = event => {
          video.srcObject = event.streams[0];
        };
        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
          }
        };
      });


      socket.on("candidate", (id, candidate) => {
        peerConnection
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(e => console.error(e));
      });

      socket.on("connect", () => {
        socket.emit("watcher");
      });

      socket.on("broadcaster", () => {
        socket.emit("watcher");
      });
    }
  }, [socket, video])

  useEffect(() => {
    window.onunload = window.onbeforeunload = () => {
      socket.close();
      peerConnection.close();
    };
  }, [window.onunload])


  const handleAudio = (boolean) => {
    if (video) {
      video.muted = boolean;
    }
  }

  return (
    <>
      <video playsInline autoPlay muted height={500} width={800}></video>
      <button id="enable-audio" onClick={() => handleAudio(false)}>Enable audio</button>
      <button id="enable-audio" onClick={() => handleAudio(true)}>Disable audio</button>
    </>
  );
};

// * Note - 
//        navigator.getUserMedia() is getting deprecated now it works on some browsers like chrome but not works in firefox
//        To resolve this problem we need to use navigator.mediaDevices.getUserMedia(). You can search this on google to get more info about.

const socket = io(); // This will work on all IPS connected through different networks
const divVideoChatLobby = document.getElementById("video-chat-lobby");
const divVideoChatRoom = document.getElementById("video-chat-room");
const userVideo = document.getElementById("user-video");
const peerVideo = document.getElementById("peer-video");
const roomInput = document.getElementById("roomName");
const divButtonGroup = document.getElementById("btn-group");
const audioButton = document.getElementById("audioButton");
const cameraButton = document.getElementById("cameraButton");
const leaveButton = document.getElementById("leaveButton");

let roomCreator = false
let rtcPeerConnection = null
let userStream = null
let roomName = null
let audioEnabled = false
let cameraEnabled = false

// Contains the stun server URL we will be using.
let iceServers = {
    iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
    ],
}


const onIceCandidateFunction = (event) => {
    if (event.candidate) {
        socket.emit("candidate", event.candidate, roomName)
    }
}

const OnTrackFunction = (event) => {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = (e) => {
        peerVideo.play()
    }
}

// capture user media streams
const getUserMediaStream = () => {
    const constraints = {
        audio: true,
        video: { width: 720, height: 480 }
    }

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
            /* use the stream */
            userStream = stream;
            divVideoChatLobby.style = "display:none";
            userVideo.style = "border: 1px solid white;";
            peerVideo.style = "border: 1px solid white;";
            divButtonGroup.style = "display:flex";

            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            };
            if (!roomCreator) {
                socket.emit("room_ready_to_join", roomName);
            }
        })
        .catch((err) => {
            /* handle the error */
            alert("Couldn't Access User Media");
        });
}

// Join room function triggers when user clicks join room button
const joinRoom = () => {
    if (roomInput.value === "") {
        alert("Please enter the room name !")
    }
    else {
        //emit event to join a room
        roomName = roomInput.value;
        socket.emit('join_room', roomName)
    }
}

// Listening room created event
socket.on("room_created", () => {
    roomCreator = true
    getUserMediaStream()
})

// Listening room joined event
socket.on("room_joined", () => {
    roomCreator = false
    getUserMediaStream()
})

// Listening room full event
socket.on("room_full", () => {
    alert("Sorry, Room is full, you can't join right now. Please try to join after some time !");
})

// Listening room_ready_to_join event
socket.on("room_ready_to_join", () => {
    if (roomCreator) {
        //Establishing peer connection using ICE Servers
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        // Exchanging candidates by assigning function onIceCandidateFunction in rtcPeerConnection.onicecandidate interface
        // Runs onicecandidate everytime when it gets candidate from STUN server
        rtcPeerConnection.onicecandidate = onIceCandidateFunction
        // OnTrack Function gets triggered when we start to get media stream from peer to which we are trying to connect.
        rtcPeerConnection.ontrack = OnTrackFunction;
        //To send out media stream to other peer side
        console.log(userStream.getTracks())
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream) // 0 represent audio track
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream) // 1 represent video track
        // Now we need to create Offer (Offer contains info about session, transcoding and type of stream)
        rtcPeerConnection.createOffer().then((offer) => {
            rtcPeerConnection.setLocalDescription(offer);
            socket.emit("offer", offer, roomName);
        }).catch((error) => {
            console.log(error);
        });
    }
})

// Listening candidate event to exchange ICE Candidates
socket.on("candidate", (candidate) => {
    let icecandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(icecandidate);
})

// Listening offer event to create and set offer
socket.on("offer", (offer) => {
    if (!roomCreator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection
            .createAnswer()
            .then((answer) => {
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit("answer", answer, roomName);
            })
            .catch((error) => {
                console.log(error);
            });
    }
})

// Listening answer event to create and set answer
socket.on("answer", (answer) => {
    rtcPeerConnection.setRemoteDescription(answer);
})

const controlAudio = () => {
    audioEnabled = !audioEnabled
    if (audioEnabled) {
        userStream.getTracks()[0].enabled = false
        audioButton.textContent = "Unmute"
    } else {
        userStream.getTracks()[0].enabled = true
        audioButton.textContent = "Mute"
    }
}

const controlCamera = () => {
    cameraEnabled = !cameraEnabled
    if (cameraEnabled) {
        userStream.getTracks()[1].enabled = false
        cameraButton.textContent = "Show Camera"
    } else {
        userStream.getTracks()[1].enabled = true
        cameraButton.textContent = "Hide Camera"
    }
}

const leaveRoom = () => {
    socket.emit("leave_room", roomName)

    // Updated UI changes according to leave room
    divVideoChatLobby.style = "display: block";
    userVideo.style = "border: none";
    peerVideo.style = "border: none";
    divButtonGroup.style = "display: none";

    // Stop the tracks when somebody leaves the room
    if (userVideo.srcObject) {
        userVideo.srcObject.getTracks().forEach(track => track.stop())
    }
    if (peerVideo.srcObject) {
        peerVideo.srcObject.getTracks().forEach(track => track.stop())
    }

    // Safely Disconnect RTCPeerConnection from Peer 
    if(rtcPeerConnection){
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
        rtcPeerConnection = null
    }
}

// Listens leave_room and safely redirect changes on UI by disconnecting peer 
socket.on("leave_room", () => {
    roomCreator = true // This person is now the creator of room because he/she only in the room now.

    if(rtcPeerConnection){
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
        rtcPeerConnection = null
    } 

    if (peerVideo.srcObject) {
        peerVideo.srcObject.getTracks().forEach(track => track.stop()) // stops receiving tracks of audio and video
    }
})

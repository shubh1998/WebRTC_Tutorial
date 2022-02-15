// * Note - 
//        navigator.getUserMedia() is getting deprecated now it works on some browsers like chrome but not works in firefox
//        To resolve this problem we need to use navigator.mediaDevices.getUserMedia(). You can search this on google to get more info about.

const socket = io.connect("http://localhost:5000");
const divVideoChatLobby = document.getElementById("video-chat-lobby");
const divVideoChatRoom = document.getElementById("video-chat-room");
const userVideo = document.getElementById("user-video");
const peerVideo = document.getElementById("peer-video");
const roomInput = document.getElementById("roomName");

let roomCreator = false
const rtcPeerConnection = null
const IceServers = {
    iceServers: [
        { url: "stun:stun.services.mozilla.com" },
        { url: "stun1.l.google.com:19302" }
    ]
}

// capture user media streams
const getUserMediaStream = async () => {
    let stream = null;
    const constraints = {
        audio: true,
        video: { width: 1280, height: 720 }
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        /* use the stream */
        divVideoChatLobby.style.display = "none"
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = (e) => {
            userVideo.play();
        }
    } catch (error) {
        /* handle the error */
        alert("Could not access user media !")
        console.log(error)
    }
}

// Join room function triggers when user clicks join room button
const joinRoom = () => {
    if (roomInput.value === "") {
        alert("Please enter the room name !")
        return
    }
    else {
        //emit event to join a room
        socket.emit('join_room', roomInput.value)
    }
}

// Listening room created event
socket.on("room_created", () => {
    roomCreator = true
    getUserMediaStream()
})

// Listening room joined event
socket.on("room_joined", () => {
    getUserMediaStream()
})

// Listening room full event
socket.on("room_full", () => {
    alert("Sorry, Room is full, you can't join right now. Please try to join after some time !");
    return
})

// Listening room_ready_to_join event
socket.on("room_ready_to_join", () => { 
    if(roomCreator){
        //Establishing peer connection using ICE Servers
        rtcPeerConnection = new RTCPeerConnection(IceServers)
        // Exchanging candidates by assigning function onIceCandidateFunction in rtcPeerConnection.onicecandidate interface
        // Runs onicecandidate everytime when it gets candidate from STUN server
        rtcPeerConnection.onicecandidate = onIceCandidateFunction
        // OnTrack Function gets triggered when we start to get media stream from peer to which we are trying to connect.
        rtcPeerConnection.ontrack = OnTrackFunction
    }
})

// Listening candidate event to exchange ICE Candidates
socket.on("candidate", () => { })

// Listening offer event to create and set offer
socket.on("offer", () => { })

// Listening answer event to create and set answer
socket.on("answer", () => { })


const onIceCandidateFunction = (event)=>{
    if(event.candidate){
        socket.emit("candidate", event.candidate, roomInput.value)
    }
}

const OnTrackFunction = (event)=>{
    peerVideo.srcObject = event.stream[0];
    peerVideo.onloadedmetadata = (e)=>{
        peerVideo.play()
    }
}
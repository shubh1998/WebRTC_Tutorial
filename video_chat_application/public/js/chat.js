const socket = io.connect("http://localhost:5000");
const divVideoChatLobby = document.getElementById("video-chat-lobby");
const divVideoChatRoom = document.getElementById("video-chat-room");
const userVideo = document.getElementById("user-video");
const peerVideo = document.getElementById("peer-video");
const roomInput = document.getElementById("roomName");

const joinRoom = () => {
    if (roomInput.value === "") {
        alert("Please enter the room name !")
        return
    }
    else {
        const constraints = {
            audio: true,
            video: { width: 1280, height: 720 }
        }

        const successsCallback = (stream)=>{
            divVideoChatLobby.style.display = "none"
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = (e)=>{
                userVideo.play();
            }
        }

        const errorCallback = (error)=>{
            alert("Could not access user media !")
            console.log(error)
        }

        // Taking user media by webcam
        navigator.getUserMedia(constraints ,successsCallback, errorCallback)
    }
}


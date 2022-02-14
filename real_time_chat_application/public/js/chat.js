const socket = io.connect("http://localhost:4000")

const messageElement = document.getElementById("message");
const usernameElement = document.getElementById("username");
const outputElement = document.getElementById("output");

const sendMessage = ()=>{
    socket.emit("sendingMessage", {
        message: messageElement.value,
        username: usernameElement.value
    })
}

socket.on("broadcastMessage", (data)=>{
    const {username, message} = data;
    outputElement.innerHTML = outputElement.innerHTML + `<p><strong>${username} : </strong>${message}</p>`
})
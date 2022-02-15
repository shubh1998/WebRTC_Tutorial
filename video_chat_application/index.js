const socket = require("socket.io");
const express = require("express");
const app = express();
const path = require("path")
const viewStaticContents = path.join(__dirname, '/public/views')
const cssContents = path.join(__dirname, '/public/css')
const jsContents = path.join(__dirname, '/public/js')
const PORT = 5000

app.use(express.static(viewStaticContents))
app.use(express.static(cssContents))
app.use(express.static(jsContents))

const server = app.listen(PORT, () => {
    console.log(`Server starts listening at Port ${PORT}`)
})

const io = socket(server)

io.on('connection', (socket) => {
    console.log("Web socket connected", socket.id)

    // logic to join a room
    socket.on('join_room', (roomName) => {
        const rooms = io.sockets.adapter.rooms;
        const roomAlreadyExist = rooms.get(roomName)

        if (roomAlreadyExist === undefined) {
            socket.join(roomName)
            socket.emit("room_created")
        } else if (roomAlreadyExist.size === 1) {
            socket.join(roomName)
            socket.emit("room_joined")
        } else {
            socket.emit("room_full")
        }
    })

    // logic to inform room creator someone joins your room
    socket.on("room_ready_to_join", (roomName) => {
        socket.broadcast.to(roomName).emit("room_ready_to_join")
    })

    // logic to exchnage ICE candidates to establish connection
    socket.on("candidate", (candidate, roomName) => {
        // console.log(candidate)
        socket.broadcast.to(roomName).emit("candidate", candidate)
    })

    // logic to make an offer 
    socket.on("offer", (offer, roomName) => {
        // console.log(offer)
        socket.broadcast.to(roomName).emit("offer", offer)
    })

    // logic to make an answer
    socket.on("answer", (answer, roomName) => {
        // console.log(answer)
        socket.broadcast.to(roomName).emit("answer", answer)
    })
})
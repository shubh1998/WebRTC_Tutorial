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

const server = app.listen(PORT, ()=>{
    console.log(`Server starts listening at Port ${PORT}`)
})

const io = socket(server)

io.on('connection', (socket)=>{
    console.log("Web socket connected", socket.id)
})
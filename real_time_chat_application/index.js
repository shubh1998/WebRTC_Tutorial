const socket = require("socket.io");
const express = require("express");
const app = express();
const path = require("path")
const staticContents = path.join(__dirname, '/public')

app.use(express.static(staticContents))

app.listen(4000, ()=>{
    console.log("Server starts listening at Port 4000")
})
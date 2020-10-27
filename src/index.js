//Express is server
const express = require('express');

const http = require('http');
// importedd for customizing the path
const path = require('path');
const socketio = require('socket.io')
const Filter = require('bad-words');

const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")

//declaring the express server
const app = express()
const server = http.createServer(app)
const io = socketio(server);

// declaring the port
const port = process.env.PORT || 3000;


// customizing the path
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));


io.on('connection', (socket) => {
    console.log('Connection established');



    socket.on('join', ({ username, room }, callback) => {

        console.log(username, room)
        const { error, user } = addUser({
            id: socket.id,
            username,
            room
        })


        if (error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit('message', generateMessage('Welcome  !!!! '));
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has Joined!!`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    })


    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter();


        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        const user = getUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage(user.username, message));
        }
        callback();
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {

            io.to(user.room).emit('message', generateMessage(`${user.username} has left!!!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }


    })




    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);

        if (user) {
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        }

        callback();
    })
})


server.listen(port, () => {
    console.log(`Server is up at port ${port}`)
})
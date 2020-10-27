const socket = io();


//  Elements


const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#message')
// const $locationURL = document.querySelector('#location-url-id');

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationURLTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;


// Options

const {username , room} =Qs.parse(location.search, { ignoreQueryPrefix : true});


//AutoScroll
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
    // $messages.scrollTop = $messages.scrollHeight
}



socket.on('message', (message)=>{
    console.log(message);
    const html =  Mustache.render(messageTemplate, {
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('hh:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
})


socket.on('locationMessage',(message)=>{
    console.log("LocationMessage",message);

    const html = Mustache.render(locationURLTemplate, {
        username : message.username,
        url : message.url,
        createdAt : moment(message.createdAt).format('hh:mm a')
    })

    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();

})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    
    // disable the form
    $messageFormButton.setAttribute('disabled','disabled');
  

    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value='';
        $messageFormInput.focus();
        if(error)
        {
            return console.log(error);
        }
        console.log('the message was delivered!!', message);
    });



})


document.querySelector('#send-location').addEventListener('click', ()=>{
    
    // send location disable
    $sendLocationButton.setAttribute('disabled', 'disabled');


    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser');
    }

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation', {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location shared successfully');
        })
    })
})


socket.emit('join',{username, room},(error) => {

    if(error){
        alert(error);
        location.href = '/';
    }

})
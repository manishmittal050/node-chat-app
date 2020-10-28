const socket = io();


//  Elements


const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('textarea');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#message')
// const $locationURL = document.querySelector('#location-url-id');

const messageTemplateLeft = document.querySelector('#message-template-left').innerHTML;
const messageTemplateRight = document.querySelector('#message-template-right').innerHTML;
const locationURLTemplateLeft = document.querySelector('#location-template-left').innerHTML;
const locationURLTemplateRight = document.querySelector('#location-template-right').innerHTML;
const templateCenter = document.querySelector('#template-center').innerHTML;

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
    let currentUser=this.location.search.substring(10);
    currentUser = currentUser.substring(0, currentUser.indexOf("&")).toLowerCase();
    let html;
    if(message.username=="Welcome  !!!! "){
        html =  Mustache.render(templateCenter, {
            username : message.username.substring(0, 7) + " "+currentUser.substring(0,1).toUpperCase()+currentUser.substring(1)+"  !",
            createdAt : moment(message.createdAt).format('hh:mm a')
        });
    }
    else if(message.username.endsWith("has Joined!!") || message.username.endsWith("has left!!!")){
        html =  Mustache.render(templateCenter, {
            username : message.username.substring(0,1).toUpperCase()+message.username.substring(1),
            createdAt : moment(message.createdAt).format('hh:mm a')
        });
    }
    else if(currentUser==message.username){
        html =  Mustache.render(messageTemplateRight, {
            username : message.username,
            message : message.text,
            createdAt : moment(message.createdAt).format('hh:mm a')
        });
    }else{
        html =  Mustache.render(messageTemplateLeft, {
            username : message.username,
            message : message.text,
            createdAt : moment(message.createdAt).format('hh:mm a')
        });
    }
    
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
})


socket.on('locationMessage',(message)=>{
    console.log("LocationMessage",message);
    let currentUser=this.location.search.substring(10);
    currentUser = currentUser.substring(0, currentUser.indexOf("&")).toLowerCase();
    let html;
    if(currentUser==message.username){
        html = Mustache.render(locationURLTemplateRight, {
            username : message.username,
            url : message.url,
            createdAt : moment(message.createdAt).format('hh:mm a')
        })
    }else{
        html = Mustache.render(locationURLTemplateLeft, {
            username : message.username,
            url : message.url,
            createdAt : moment(message.createdAt).format('hh:mm a')
        })
    }
    

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
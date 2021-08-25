function start_js () {
    let ws_url  = JSON.parse($('#wss').text()).replace('http', 'ws')
    const socket_client = new WebSocket(ws_url)
    let localStream = new MediaStream()
    let localVideo = document.querySelector('#localVideo')
    let username  = $('#username').first()
    let btn  = $('#process-username').first()
    let peers = {}

    $('#replace-username').text(username.val().trim())
    username.attr('style', 'display: none')
    btn.attr('style', 'display: none')
    
    const myUsername = $('#replace-username').text()

        const constrains = {
            audio: true,
            video: true
        }
    
/**
 * signal section
 */
        const prepareSignalMessage = (message) => {
            return {
                'sdp': message['sdp'],
                'received_channel_name': message['received_channel_name']
            }
        }

        const parseToSignal = (action, message)=>{
            if (message) {
                message  = prepareSignalMessage(message)
            }
            
            return JSON.stringify({
                peer: myUsername,
                action: action,
                message: message
            })
        }

        const sendSignal = (action, signal)=>{
            console.log(signal)
            
            signal  = parseToSignal(action, signal)
            console.log(signal)
            socket_client.send(signal)

        }

/**
 * Signal End
 */


/*
        ********************************************************************************
        ********************************************************************************
        ********************************************************************************
*/

/***
 * 
 * MessageParse
 */

 const parseResponse = (event) => {
    const data = JSON.parse(event.data)

    return {
        receivedUsername : data['peer']
        , receivedAction : data['action'] 
        , receivedMessage : data['message'] 
        , receivedChannel : data['message']['received_channel_name'] 
        , receivedHint : data['hint'] 
    }
}
/**
 * MessageParse End
 */


/***
 * 
 * SendMediaStream Tracks to the RTCPeerConnection
 */

    const sendMediaStreamToRTC = (stream, rtc)=>{
        stream.getTracks().forEach(track => {
            rtc.addTrack(track, stream)
        });
        return;
    }
/**
 * 
 * SendMediaStream End
 */

/***
 * DATACHANNEL section
 */


const dcMessageCallback = (event) => {
    const message  = event.data
    const li = document.createElement('li')
    const textnode = document.createTextNode(message)
    li.appendChild(textnode)
    $('#dc-messages').append(li)
}

/**
 * 
 * DATACHANNEL End
 */



 /**
 * Create and stream the remote video  
*/
    


 const createRemoteVideo = (recivedPeerUsername) => {
    const remoteVideo = document.createElement('video')
    remoteVideo.id = recivedPeerUsername +'-video'
    remoteVideo.muted = true
    remoteVideo.playsInline = true
    const liVideo = document.createElement('li')
    liVideo.appendChild(remoteVideo)
    $('#ul-remoteVideos').append(liVideo)
    return remoteVideo
}

// async function appendStreamToRTC(rtc, event) {
//     rtc.addTrack(event.track, stream)
// }

const streamRemoteVideo = (remoteVideoElement, rtcConnection) => {
    let remoteMediaStream = new MediaStream()
    remoteVideoElement.srcObject = remoteMediaStream
    
    rtcConnection.addEventListener('track', async event => {
        remoteMediaStream.addTrack(event.track, remoteMediaStream)
    });
}
/**
 * Remotevideo End  
 */



/**
 * removeUneededPeer section
*/

const removeVideoElemnt = (videoElement) => {
    $(videoElement).remove()
}


/**
 * removeUneededPeer End
 */

















/***
 * 
 * SendOfferTONewPeer 
 * Recvied from the server when it sent a new-peer signal to the server
 *  
 */

 function sendOffer() {
     
 }



 socket_client.addEventListener('open', ()=> {
    /**
     * Connect to the server 
     */
    sendSignal('new-peer', {})}
     
     
);



 socket_client.addEventListener('message', (event) => {
    console.log('we have a message from django')
    const data = parseResponse(event)
    /***
     * received data from the server after the message is sent throught websocket
    */

    const action = data['receivedAction'] 
    const peerUsername = data['receivedUsername'] 
    const peerChannel = data['receivedChannel'] 
    const peerMessage = data['receivedMessage']

    if (peerUsername == myUsername) {
        console.log('can\'t send offer to myself closing...')
        return;
    }
    /**
     * Send Offer to connect with the new peer
     */
    if (action == 'new-peer') {
        sendOffer(peerUsername, peerChannel)
        return;
    }











 });






/**
 * SOCKET End
 */


        navigator.mediaDevices.getUserMedia(constrains)
        .then(stream=>{
            localStream = stream;
            localVideo.srcObject = localStream;
            localVideo.muted = true
        });
}


$('#process-username').click(start_js);

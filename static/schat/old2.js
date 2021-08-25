function start_js() {
    let ws_url = JSON.parse($('#wss').text()).replace('http', 'ws')
    const socket_client = new WebSocket(ws_url)
    let localStream = new MediaStream()
    let localVideo = document.querySelector('#localVideo')
    let username = $('#username').first()
    let btn = $('#process-username').first()
    let peers = {}

    $('#replace-username').text(username.val().trim())
    username.attr('style', 'display: none')
    btn.attr('style', 'display: none')

    const myUsername = $('#replace-username').text()


    const constrains = {
        audio: true,
        video: true
    }

    function prepareMessage(message) {
        if (message) {
         return {
             'sdp': message['sdp'],
             'received_channel_name': message['received_channel_name']
         }        
        }
    }
    

    function makeSignal(action, message) {
        message = prepareMessage(message)
        return JSON.stringify(
            {
                peer: myUsername,
                action: action,
                message: message
            }
        )
    }

    
    function sendSignal(action, signal) {
        signal = makeSignal(action, signal)
        socket_client.send(signal)
    }

    function createRemoteVideo(peerName) {
        let video = document.createElement('video')
        video.id = peerName +'-video'
        video.muted = true
        video.playsInline=true
        video.autoplay = true    
        $('#ul-remoteVideos').append(video)
        return video
    }

    function createSendOffer(peerName, peerChannel) {
        let rtcConnection = new RTCPeerConnection(null)
        localStream.getTracks().forEach(track=>rtcConnection.addTrack(track, localStream))
        let dc_channel = rtcConnection.createDataChannel('channel')
        dc_channel.addEventListener('message', data => {
            let li = document.createElement('li')
            let textNode = document.createTextNode(data)
            li.appendChild(textNode)
            $('#dc-messages').append(li)
        })
        
        let video =  createRemoteVideo(peerName)
        let remoteStream = new MediaStream()
        video.srcObject = remoteStream
        rtcConnection.addEventListener('track', async event => remoteStream.addTrack(event.track, remoteStream))

        peers[peerName] = [peerChannel, dc_channel]

        rtcConnection.addEventListener('icecandidate', event=>{
            if (event.candidate) {
                return
            }

            sendSignal('new-offer', {
                'sdp': rtcConnection.localDescription,
                'received_channel_name': peerChannel
            });
        });
        
        rtcConnection.createOffer()
        .then(
            offer => rtcConnection.setLocalDescription(offer)
        )
    }

    function createSendAnswer(peerName, peerChannel, offer) {
        let rtcConnection = new RTCPeerConnection(null)
        localStream.getTracks().forEach(track => rtcConnection.addTrack(track, localStream) )
        let video = createRemoteVideo(peerName) 
        
        let remoteStream = new MediaStream()
        video.srcObject = remoteStream
        rtcConnection.addEventListener('track', event=> remoteStream.addTrack(event.track, remoteStream));
        
        rtcConnection.addEventListener('datachannel', event=>{
            rtcConnection.dc = event.channel
            rtcConnection.dc.addEventListener('message', data => {
                    let li = document.createElement('li')
                    let textNode = document.createTextNode(data)
                    li.appendChild(textNode)
                    $('#dc-messages').append(li)
                    peers[peerName]= [peerChannel,rtcConnection.dc] 
                });
        })

        
        rtcConnection.addEventListener('icecandidate', event=>{
            if (event.candidate) {
                return
            }
            sendSignal('new-answer', {
                'sdp': rtcConnection.localDescription,
                'received_channel_name': peerChannel
            })
        });
    
        rtcConnection.setRemoteDescription(offer)
        .then(
            ()=>{
                return rtcConnection.createAnswer()
            }
        ).then(
            answer => rtcConnection.setLocalDescription(answer)
        )
    }

    navigator.mediaDevices.getUserMedia(constrains)
    .then(stream => {
        localStream = stream
        localVideo.srcObject = stream
        localVideo.muted = true
    })

    socket_client.addEventListener('open', ()=> sendSignal('new-peer', {}))

    socket_client.addEventListener('message', (event)=>{
        let data = JSON.parse(event.data)
        action =          data['action'],
        recivedPeer =     data['peer'],
        message =         data['message'],
        receivedChannel = message['received_channel_name'];

        if (myUsername == recivedPeer){
            console.log('same  user bye')
            return;
        }
        console.log(action)
        if (action == 'new-peer') {
            createSendOffer(recivedPeer, receivedChannel)
            return;
        }

        if(action == 'new-offer') {
            let offer = message['sdp']
            createSendAnswer(recivedPeer, receivedChannel, offer)
            return
        }
        
        if (action === 'new-answer') {
            let answer = message['sdp']
            let peer = peers[recivedPeer][0]
            peer.setRemoteDescription(answer)
            return
        }
    });
}


$('#process-username').click(start_js)
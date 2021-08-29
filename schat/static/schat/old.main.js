function start_js() {
    let ws_url = JSON.parse($('#wss').text()).replace('http', 'ws')
    const socket_client = new WebSocket(ws_url)
    let localStream = new MediaStream()
    let localVideo = document.querySelector('#localVideo')
    let username = $('#username').first()
    let btn = $('#process-username').first()
    let peers = {}

    const constrains = {
        video :  true,
        audio: true
    }

    $('#replace-username').text(username.val().trim())
    username.attr('style', 'display: none')
    btn.attr('style', 'display: none')

    const myUsername = $('#replace-username').text()

     navigator.mediaDevices.getUserMedia(constrains)
    .then(stream=>{
        console.log(stream)
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted=true;
    })





    function parseSignalContent(signal) {
        if (! signal){
            return {
                sdp:'',
                recived_peer_channel:''
            }
        }
        return {
            'sdp': signal['sdp'],
            'recived_peer_channel': signal['sdp'],
        }
    }

    function parseSignal(action, signal) {
        message = parseSignalContent(signal)
        return JSON.stringify(
            {
              peer: myUsername,
              action: action,
              message: message  
            }
        )
    }

    function recivedSignal(rawSignal) {
        return JSON.parse(rawSignal.data)
    }
    
    function sendSignal(action, signal) {
        let test = parseSignal(action, signal)
        socket_client.send(test)
    }

    socket_client.addEventListener('open', event => sendSignal('new-peer'))

    socket_client.addEventListener('message', (data)=>{
        let signal = recivedSignal(data),
        peer = signal['peer'],
        mesage = signal['message'],
        action = signal['action'],
        sdp = mesage['sdp'],
        peer_channel = message['recived_peer_channel']
      
        if (myUsername == peer) {
            return;
        }

        if (action=='new-peer'){
            createOffer(peer, peer_channel)
            return;
        }

        if (action=='new-offer'){
            let offer = mesage['sdp'] 
            createAnswer(peer, peer_channel, offer)
            return;
        }

        if (action=='new-answer'){
            let answer = mesage['sdp'] 
            let rtc = peers[peer][0]

            rtc.setRemoteDescription(answer)
            return;
        }
        


    });         
    function createAnswer(peer, peer_channel, offer) {
        let rtcConnetion = new RTCPeerConnection(null)
        addTracks(rtcConnetion)

        let video = createVideo(peer)
        setOnTrack(video, rtcConnetion)
        
        rtcConnetion.addEventListener('datachannel', event=>{
            rtcConnetion.dc = event.channel
            rtcConnetion.dc.addEventListener('message', dcOnMessage)
            peers[peer] =[rtcConnetion, rtcConnetion.dc]
        })
        
        rtcConnetion.addEventListener('icecandidate', (event)=>{
            if (event.candidate) {
                return;
            }
            sendSignal('new-answer', {
                sdp: rtcConnetion.localDescription,
                recived_peer_channel: peer_channel
            })
        });

        // connection with the new-offer send throught its SDP passed to the channel
        rtcConnetion.setRemoteDescription(offer)
        .then(
            ()=>{
                return rtcConnetion.createAnswer()
            }
        ).then(answer=> rtcConnetion.setLocalDescription(answer))
    }

    function createOffer(peer, peer_channel){
        let rtcConnetion = new RTCPeerConnection(null)
        addTracks(rtcConnetion)
        let dc_channel = rtcConnetion.createDataChannel('channel')
        dc_channel.addEventListener('message', dcOnMessage)
        let video = createVideo(peer)
        setOnTrack(video, rtcConnetion)
        peers[peer] =[rtcConnetion, dc_channel]

        rtcConnetion.addEventListener('icecandidate', (event)=>{
            if (event.candidate) {
                return;
            }
            sendSignal('new-offer', {
                sdp: rtcConnetion.localDescription,
                recived_peer_channel: peer_channel
            })
        });

        rtcConnetion.createOffer()
        .then(offer=>rtcConnetion.setLocalDescription(offer))
    }   

    function addTracks(rtc) {
        localStream.getTracks().forEach(track=>rtc.addTrack(track, localStream))
    }
    
    function dcOnMessage(event) {
        let li = document.createElement('li')
        let textNode = document.createTextNode(event.data)
        li.appendChild(textNode)
        $('#dc-messages').append(li)
    }

    function createVideo(peer) {
        let video = document.createElement('video')
        video.id = peer +'-video'
        video.muted = true
        video.playsInline=true
        video.active = true
        video.autoplay = true

        $('#ul-remoteVideos').append(video)
        return video
    }

    function setOnTrack(video, rtc) { 
        let remoteStream = new MediaStream();
        video.srcObject = remoteStream
        console.log(rtc)
        rtc.addEventListener('track', async event => remoteStream.addTrack(event.track, remoteStream))
    }

}$('#process-username').click(start_js)

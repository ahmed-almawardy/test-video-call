function joinChat(event) {
    let username = $('#username').val().trim()
    let localStream = new MediaStream()
    // let localVideo = $('#localVideo').first()
    let localVideo = document.getElementById('localVideo')
    const constrians = {
        video: true,
        audio: true
    }
    let peers =[]

    navigator.mediaDevices.getUserMedia(constrians)
    .then(stream=>{
        localStream = stream
        localVideo.srcObject = localStream
        localVideo.muted= true
    })
    if (! username ) {
        return
    }
    
    function parseSignal(signal){
        return signal ? {
            'sdp': signal['sdp'],
            'recived_peer_channel': signal['recived_peer_channel']}  
            : 
            {sdp:'',recived_peer_channel:''}
    }

    function prepareSignal(action, signal){
        signal = parseSignal(signal) 
            return JSON.stringify({
                peer: username,
                action: action,
                message: signal
            })
    }
    
    function sendSignal(action, signal){
        socket_client.send(
            prepareSignal(action, signal)
        )
    }

    function parseSocketData(event){
        return JSON.parse(event.data)
    }
    
    function streamLocalMedia(rtc) {
        localStream.getTracks().map(track=>rtc.addTrack(track, localStream))
    }

    function createMyVideoForRemoteUser(peerUsername) {
        let video = document.createElement('vide')
        video.id= peerUsername+'-video'
        video.auotoPlay = true
        video.playsInline = true
        video.muted=true
        let li = document.createElement('li')
        li.appendChild(video)

        document.getElementById('ul-remoteVideos').appendChild(li)
        return video
    }

    function streamRemoteVideo(rtc, remoteVideo) {
        let remoteStream = new MediaStream()
        remoteVideo.srcObject = remoteStream
        rtc.addEventListener('track', 
            async event=>remoteStream.addTrack(event.track, remoteStream)
            )
    }

    function sendSingalToServer(rtc, remotePeerChannel, action){
        rtc.addEventListener('icecandidate', event=>{
            if(event.candidate) {
                return
            }
            
            sendSignal(action, {
                sdp: rtc.localDescription,
                recived_peer_channel: remotePeerChannel
            })
        })
    }
    function sendOffer(remotePeerUsername, remotePeerChannel) {
        let rtc  = new RTCPeerConnection(null)
        streamLocalMedia(rtc)
        let remoteVideo = createMyVideoForRemoteUser(remotePeerUsername)
        streamRemoteVideo(rtc, remoteVideo)
        sendSingalToServer(rtc, remotePeerChannel, 'new-offer')
        console.log(remotePeerUsername)
        peers[remotePeerUsername]=rtc
        rtc.createOffer()
        .then(offer=> rtc.setLocalDescription(offer))
    }

    function sendAnswer(remotePeer, remoteChannel, offer) {
        let rtc = new RTCPeerConnection()
        streamLocalMedia(rtc)
        let remoteVideo = createMyVideoForRemoteUser(remotePeer)
        streamRemoteVideo(rtc, remoteVideo)
        sendSingalToServer(rtc, remoteChannel, 'new-answer')
        peers[remotePeer]=rtc

        rtc.setRemoteDescription(offer)
        .then(()=>{
            return rtc.createAnswer()
        }).then(answer=> rtc.setLocalDescription(answer))
    }

    function socketOnMessage(event) {
        let data = parseSocketData(event)
        let message = data['message']
        let peer = data['peer']
        let action = data['action']
        let sdp = message['sdp']
        let recived_peer_channel = message['recived_peer_channel']

        if (username == peer) {
            console.log('can\'t send to same user')
            return
        }

        if (action == 'new-peer') {
            sendOffer(peer, recived_peer_channel)
            return
        }

        if (action == 'new-offer') {
            sendAnswer(peer, recived_peer_channel, sdp)
            return
        }

        if (action == 'new-answer') {
            let rtc = peers[peer]
            rtc.setRemoteDescription(sdp)
            return
        }

        
    }

    let socket_client = new WebSocket(JSON.parse($('#wss').text()))
    socket_client.addEventListener('open',()=>{sendSignal('new-peer')} )

    socket_client.addEventListener('message', socketOnMessage)




















}$('#process-username').click(joinChat)
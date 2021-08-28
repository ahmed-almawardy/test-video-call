function joinChat(event) {
    let username = $('#username').val().trim()
    let localStream = new MediaStream()
    let localVideo = document.getElementById('localVideo')
    
    document.getElementById('process-username').style.display= 'none'
    document.getElementById('username').style.display= 'none'
    $(document.getElementById('replace-username')).text(username)     
    let offer_rtc = null

    const constrians = {
        video: true,
        audio: true
    }


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
            'recived_peer_channel': signal['recived_peer_channel'],
            // 'rtc': signal['offerer_rtc']
        }  
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
        signal = prepareSignal(action, signal)
        socket_client.send(
            signal
        )
    }

    function parseSocketData(event){
        return JSON.parse(event.data)
    }
    
    function streamLocalMedia(rtc) {
        localStream.getTracks().forEach(track=>
                rtc.addTrack(track, localStream)
           )
    }


    function createRemoteVideoFor(peerUsername) {
        let label = document.createElement('label')
        $(label).text(peerUsername)
        label.style.display = 'block'
        let video = document.createElement('video')
        video.id= peerUsername+'-video'
        video.autoPlay = true
        video.playsInline = true
        video.addEventListener('canplay', event=>video.play())
        video.muted=true
        let li = document.createElement('li')
        li.appendChild(label)
        li.appendChild(video)
        document.getElementById('ul-remoteVideos').appendChild(li)
        return video
    }
    
    function sendRemoteStream(rtc, video) {
        let remotedStream = new MediaStream()
        rtc.addEventListener('track',  event=>
            remotedStream.addTrack(event.track, remotedStream)
            
        )
        video.srcObject = remotedStream
        video.muted=true
        video.autoPlay=true
    }

    function newSendOffer(peerUsername, peerChannel){
        let rtc = new RTCPeerConnection(null)
        streamLocalMedia(rtc)
        let video = createRemoteVideoFor(peerUsername)
        sendRemoteStream(rtc, video)
        let channel = rtc.createDataChannel('dataCahnnel')
        channel.onopen = (event) => console.log('Connection opened by user ', peerUsername)
        channel.onmessage = (event)=> console.log(peerUsername+' : '+event.data)


        rtc.onicecandidate = (event) =>{
            if (event.candidate) {
                return
            }
                sendSignal('new-offer', {
                    sdp: rtc.localDescription, 
                    recived_peer_channel: peerChannel
                }
                    )
        offer_rtc = rtc
        offer_dc = channel
        }


        rtc.createOffer()
        .then(offer=> rtc.setLocalDescription(offer))
        
    }

  
    function newSendAnswer(remotePeer, remoteChannel, offer) {
        let rt = new RTCPeerConnection(null)
        let answer = null
        streamLocalMedia(rt)
        let videoed = createRemoteVideoFor(remotePeer)
        sendRemoteStream(rt, videoed)
  
        rt.ondatachannel = (event) => {
            rt.dc = event.channel
            rt.dc.onopen= (event)=> console.log('reciving/opening data channel with user', remotePeer)
            rt.dc.onmessage = (event)=> console.log(remotePeer,":", event.data)
        }   


        rt.onicecandidate = (event)=> {
            if (event.candidate) {
                return
            }
                answer= rt.localDescription
                sendSignal('new-answer', {sdp: answer, recived_peer_channel: remoteChannel})
        }

   
   
         rt.setRemoteDescription(offer)
        rt.createAnswer().
        then(a=>{rt.setLocalDescription(a); })

    }

    function showPeerUsername(peerUsername) {
        $(document.getElementById('ul-remoteVideos'))
        .append("<li id="+peerUsername+">new-peer "+peerUsername +" is here</li>")
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
            newSendOffer(peer, recived_peer_channel)
            return
        }

        if (action == 'new-offer') {
            newSendAnswer(peer, recived_peer_channel, sdp) 
            return
        }

        if (action == 'new-answer') {
            offer_rtc.setRemoteDescription(sdp)
            setTimeout(() => {
                offer_dc.send('ee')
            }, 200);
            return
        }

        
    }

    let socket_client = new WebSocket(JSON.parse($('#wss').text()))
    socket_client.addEventListener('open',()=>{sendSignal('new-peer')} )

    socket_client.addEventListener('message', socketOnMessage)




















}$('#process-username').click(joinChat)
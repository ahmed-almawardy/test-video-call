function joinChat(event) {
   const btnz= '<div class="btn-group" role="group" aria-label="Basic example">'+
   '<button type="button" class="btn btn-secondary" id="mute-viedo">mute</button>'+
   '<button type="button" class="btn btn-secondary" id="stop-video">stop</button></div>'
    let username = $('#username').val().trim()
    let localStream = new MediaStream()
    let localVideo = document.getElementById('localVideo')
    let locolVideoHolder = document.getElementById('videos')
    const stun_servers = {
        iceServers: [
            {
                urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']
            }
        ],
        iceCandidatePoolSize:10
    }

    $(locolVideoHolder).append(btnz)
    
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
        localVideo.muted= false
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
        $(label).addClass('text-center')
        label.style.display = 'block'
        let video = document.createElement('video')
        let video_div = document.createElement('div')
        video_div.className = 'row'
        video.id= peerUsername+'-video'
        video.autoPlay = true
        video.playsInline = true
        video.addEventListener('canplay', event=>video.play())
        video.muted=false
        let li = document.createElement('li')
        li.appendChild(label)
        $(video_div).append(video, btnz)
        li.appendChild(video_div)
        document.getElementById('ul-remoteVideos').appendChild(li)
        
        return video
    }
    
    function sendRemoteStream(rtc, video) {
        let remotedStream = new MediaStream()
        rtc.addEventListener('track',  event=>
            remotedStream.addTrack(event.track, remotedStream)
            
        )
        video.srcObject = remotedStream
        video.muted=false
        video.autoPlay=true
    }

    function sendOffer(peerUsername, peerChannel){
        let rtc = new RTCPeerConnection(stun_servers)
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

  
    function sendAnswer(remotePeer, remoteChannel, offer) {
        let rtc = new RTCPeerConnection(stun_servers)
        let answer = null
        streamLocalMedia(rtc)
        let videoed = createRemoteVideoFor(remotePeer)
        sendRemoteStream(rtc, videoed)
  
        rtc.ondatachannel = (event) => {
            rtc.dc = event.channel
     
            rtc.dc.onopen= (event)=> console.log('reciving/opening data channel with user', remotePeer)
            rtc.dc.onmessage = (event)=> console.log(remotePeer,":", event.data)
        }   


        rtc.onicecandidate = (event)=> {
            if (event.candidate) {
                return
            }
                answer= rtc.localDescription
                sendSignal('new-answer', {sdp: answer, recived_peer_channel: remoteChannel})
        }

   
        rtc.setRemoteDescription(offer)
        rtc.createAnswer().
        then(a=>{rtc.setLocalDescription(a); })

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
        console.log(action, recived_peer_channel)
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
            offer_rtc.setRemoteDescription(sdp)
            setTimeout(() => {
                offer_dc.send('ee')
            }, 200);
            return
        }

        
    }
    let url = JSON.parse($('#wss').text())
    let temp_url = 'wss://a-test-video-call.herokuapp.com/schat/room/ws/' 
    let socket_client = new WebSocket(temp_url)
    socket_client.addEventListener('open',(event)=>{
    
        sendSignal('new-peer', {sdp: '', recived_peer_channel: ''})
    })
    
    socket_client.addEventListener('message', socketOnMessage)


}$('#process-username').click(joinChat)
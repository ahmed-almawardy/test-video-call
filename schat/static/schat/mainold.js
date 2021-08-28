    let  process_username = () => {
        let username = $('#username').val().trim()
        let local_video = document.getElementById('localVideo')
        let local_stream = new MediaStream()
        let constrains = {
            video: true,
            audio: true
        }
        let peers = []

        navigator.mediaDevices.getUserMedia(constrains)
        .then(stream=>{
            local_stream = stream
            local_video.srcObject = local_stream
            local_video.muted = true
        })


        if (! username) {
            return
        }

        let parse_signal = (signal)=>{
            return signal ? {
                sdp:  signal['sdp'] ,
                recived_peer_channel:  signal['recived_peer_channel'] 
            } : {
                sdp:'',
                recived_peer_channel:''
            }
        }

        let make_signal = (action, signal) => {
            signal = parse_signal(signal)
            return JSON.stringify({
                peer:username,
                action: action,
                message: signal
            })
        }

        let send_signal = (action, signal) => {
            socket_client.send(make_signal(action, signal))
        }


        let parse_data = (data) => {
            return JSON.parse(data)
        } 

        let send_local_stream = (rtc) => {
            local_stream.getTracks().forEach(track=> rtc.addTrack(track, local_stream))
        }
        
        let create_remote_video = (peer_username)=> {
            let  video = document.createElement('video')
            let  li = document.createElement('li')
            video.id= peer_username +'-video'
            $(li).append(video)
            document.getElementById('ul-remoteVideos').appendChild(li)
            return video
        }

        let send_remote_tracks = (rtc, remote_video) => {
            let remote_stream = new MediaStream()
            remote_video.srcObject = remote_stream
            rtc.addEventListener('track',  async(event)=>{
                remote_stream.addTrack(event.track, remote_stream)
            })
        
        }

        let send_offer = (peer_username, recived_peer_channel) => {
            console.log('sending offer to ', peer_username)
            let rtc = new RTCPeerConnection(null)
            send_local_stream(rtc)
            let remote_video  = create_remote_video(peer_username)
            send_remote_tracks(rtc, remote_video)
            rtc.addEventListener('icecandidate', (event)=>{
                if(event.candidate) {
                    return
                }

                send_signal('new-offer', {
                    sdp: rtc.localDescription,
                    recived_peer_channel: recived_peer_channel
                })
            })


            rtc.createOffer()
            .then(offer=> rtc.setLocalDescription(offer))
        }

        let send_answer = (peer_username, recived_peer_channel, offer) => { 
            let rtc = new RTCPeerConnection(null)
            send_local_stream(rtc)
            let video = create_remote_video(peer_username)
            send_remote_tracks(rtc, video)
            rtc.addEventListener('icecandidate', event=>{
                if (event.candidate) {
                    return
                }
                send_signal('new-answer', {
                    sdp: rtc.localDescription,
                    recived_peer_channel: recived_peer_channel 
                })
            });
            rtc.setRemoteDescription(offer)
            .then(()=>{
                return rtc.createAnswer(()=>{})
            }).then(answer=> rtc.setLocalDescription(answer))
            peers[peer_username] = rtc
        }

        
        let socket_on_message = (event)=> {
            let data = parse_data(event.data)
            let action = data['action']            
            let peer_username = data['peer']            
            let message = data['message']            
            let sdp = message['sdp']
            let recived_peer_channel = message['recived_peer_channel']            
            
            if (peer_username == username){ 
                console.log('cannot send offer to the same user')
                return
            }

            if (action == 'new-peer') {
                send_offer(peer_username, recived_peer_channel)
                return
            }

            if (action == 'new-offer') {
                send_answer(peer_username, recived_peer_channel, sdp)
                return
            }

            if (action == 'new-answer') {
                let answer_rtc = peers[peer_username]
                answer_rtc.setRemoteDescription(sdp)
                return
            }




        }
        let socket_url  = JSON.parse($('#wss').text()) 
       let socket_client = new WebSocket(socket_url)
       setTimeout(()=>{
           socket_client.addEventListener('open', send_signal('new-peer'))
           socket_client.addEventListener('message', socket_on_message)
        }, 100)
    }

    $("#process-username").click(process_username)
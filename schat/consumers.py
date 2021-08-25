from channels.generic.websocket import AsyncWebsocketConsumer
from json import dumps, loads



class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'Test-video-call'

        await self.channel_layer.group_add(
            # add the group to the channel
            self.room_group_name,
            #  add the channel name of the requester 'peer' into the room
            self.channel_name
        )

        await self.accept()

    
    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            # place of the group to remove the channel name from 
            self.room_group_name,
            # id of the requester in Djnago channels
            self.channel_name
        )

    async def receive(self, text_data, bytes_data=None):
        recived_data  = loads(text_data)
        peer = recived_data['peer']
        action = recived_data['action']
        message = recived_data['message']
        session_description_protocol = message['sdp']
        message['recived_peer_channel'] = self.channel_name
        
        if action == 'new-offer' or action == 'new-answer':
            # channel of the new-offer sender to ahve aconnection with the new-peer P2P
            channel_name_of_the_peer_peer_connection=message['recived_peer_channel']
            # new channel for other users
            recived_data['message']['recived_peer_channel'] = self.channel_name 
        
            await self.channel_layer.send(
            # group name to send to
            channel_name_of_the_peer_peer_connection,
            {
                # session_description_protocol
                'type': 'send.session_description_protocol',
                'recived_data':  recived_data,
                # 'recived_peer_channel':  recived_peer_channel,
            }
        )    


        # sending to whole group using the method in type
        await self.channel_layer.group_send(
            # group name to send to
            self.room_group_name,
            {
                # session_description_protocol
                'type': 'send.session_description_protocol',
                'recived_data':  recived_data,
                # 'recived_peer_channel':  recived_peer_channel,
            }
        )
        
    async def send_session_description_protocol(self, event):
        await self.send(dumps(event['recived_data']))
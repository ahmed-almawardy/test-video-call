from channels.generic.websocket import AsyncWebsocketConsumer
from json import dumps, loads



class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'test-video-chat'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )


        # accept connection        
        await self.accept()



    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )


    async def receive(self, text_data):
            data = loads(text_data)
            print(data)
            message  = data['message'] 
            action  = data['action'] 
            data['hint']= f'this channel for user {data["peer"]}'

            if action == 'new-offer' or action == 'new-answer': 
                remote_peer_channel_name = message['received_channel_name'] 
                data['received_channel_name']= self.channel_name


                await self.channel_layer.send(
                remote_peer_channel_name,
               # event
                {
                    
                    'type': 'send.sdp', # session_description_protocol
                    'received_signal': data
                }
                )    
                return
            
            data['message']['received_channel_name']= self.channel_name
            
            
            await self.channel_layer.group_send(
                self.room_group_name,
               # event
                {
                    
                    'type': 'send.sdp', # session_description_protocol
                    'received_signal': data
                }
            )

    async def send_sdp(self, event):
        message = event['received_signal']

        await self.send(text_data=dumps(message))

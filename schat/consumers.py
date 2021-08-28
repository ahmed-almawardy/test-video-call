from channels.generic.websocket import AsyncWebsocketConsumer
from json import dumps, loads



class ChatConsumer(AsyncWebsocketConsumer):
    offerer_rtc = None

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
        peersChannel = message['recived_peer_channel']
        message['recived_peer_channel'] = self.channel_name

        if action == 'new-offer' or action == 'new-answer':
            print(action)
            # rtc = message.get('rtc')
            # print(rtc)
            # if rtc:
            #     self.offerer_rtc = rtc
                # print(self.offerer_rtc)


            # recived_data['rtc'] = self.offerer_rtc
            await  self.channel_layer.send(
                peersChannel,
                {
                'type': 'send.session_description_protocol',
                'recived_data':  recived_data,
                }
            )
            return 

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
import gc, json, asyncio

import server

# gc.disable()

class chat_server:
    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads['chat_server']['instance'] = self
        
        self.message_box = dict()
        asyncio.run(self.chat_server_main())
        
    async def chat_server_main(self):
        while True:
            for chat_server_user_to in self.message_box.keys():
                if len(self.message_box[chat_server_user_to]['message_queue']) > 0:
                    print('Processing user {}\'s message.'.format(chat_server_user_to))
                
                for chat_messages in self.message_box[chat_server_user_to]['message_queue']:
                    response = {
                        'type': 'chat_message',
                        'from': chat_messages['from'],
                        'content': chat_messages['messages'],
                    }
                    
                    await self.message_box[chat_server_user_to]['websocket_protocol'].send(json.dumps(response));
                
                self.message_box[chat_server_user_to]['message_queue'].clear()
            
            await asyncio.sleep(0)
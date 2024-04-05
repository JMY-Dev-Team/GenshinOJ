import json
import asyncio

class chat_server:
    def __init__(self, server_instance) -> None:
        self.server_instance = server_instance
        self.chat_server_message_queue = dict()

    async def chat_server_main():
        while True:
            for chat_server_user_to in global_message_queue.chat_server_message_queue.keys():
                if len(global_message_queue.chat_server_message_queue[chat_server_user_to]['message_queue']) > 0:
                    print('Processing user {}\'s message.'.format(chat_server_user_to))
                
                for chat_messages in global_message_queue.chat_server_message_queue[chat_server_user_to]['message_queue']:
                    response = {
                        'type': 'chat_message',
                        'from': chat_messages['from'],
                        'content': chat_messages['chat_messages'],
                    }
                    await global_message_queue.chat_server_message_queue[chat_server_user_to]['websocket_protocol'].send(json.dumps(response));
                
                global_message_queue.chat_server_message_queue[chat_server_user_to]['message_queue'].clear()
            
            await asyncio.sleep(0) 
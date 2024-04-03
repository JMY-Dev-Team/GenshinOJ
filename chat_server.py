import json
import asyncio
import global_matter

async def chat_server():
    while True:
        for chat_server_user_to in global_matter.chat_server_message_queue.keys():
            if len(global_matter.chat_server_message_queue[chat_server_user_to]['message_queue']) > 0:
                print('Processing user {}\'s message.'.format(chat_server_user_to))
            
            for chat_messages in global_matter.chat_server_message_queue[chat_server_user_to]['message_queue']:
                response = {
                    'type': 'chat_message',
                    'from': chat_messages['from'],
                    'content': chat_messages['chat_messages'],
                }
                await global_matter.chat_server_message_queue[chat_server_user_to]['websocket_protocol'].send(json.dumps(response)); await asyncio.sleep(0)
            
            global_matter.chat_server_message_queue[chat_server_user_to]['message_queue'].clear()
            await asyncio.sleep(0)
        
        await asyncio.sleep(0) 

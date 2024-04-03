import asyncio, global_matter

async def chat_server():
    for chat_server_user_to in global_matter.chat_server_message_queue:
        print('Processing user {}\'s message.'.format(chat_server_user_to))
        pass

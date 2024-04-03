import os, platform

try:
    import pymysql, asyncio, websockets
except:
    if platform.system() == "Windows":
        os.system('pip install pymysql asyncio websockets')
    elif platform.system() == "Linux":
        os.system('pip3 install pymysql asyncio websockets')
        
    import pymysql, asyncio, websockets
    
import receive, global_matter, judge, chat_server

if __name__ == '__main__': # Main
    policy = asyncio.get_event_loop_policy()
    policy.get_event_loop().set_debug(True)
    print('Server started.')
    global_matter.DatabaseConnection() # Connect to database
    ws_server = websockets.serve(ws_handler = receive.receive, host = global_matter.SERVER_HOST, port = global_matter.SERVER_PORT) # Start WS server
    asyncio.get_event_loop().run_until_complete(asyncio.wait([judge.judge(), chat_server.chat_server(), ws_server]))
    asyncio.get_event_loop().run_forever()
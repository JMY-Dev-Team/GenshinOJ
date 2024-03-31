import logging, os, sys, signal, random, json, threading, platform
import receive, global_matter, judge

try:
    import pymysql, asyncio, websockets, icecream
except:
    if platform.system() == "Windows":
        os.system('pip install pymysql asyncio websockets icecream')
    elif platform.system() == "Linux":
        os.system('pip3 install pymysql asyncio websockets icecream')
        
    import pymysql, asyncio, websockets

if __name__ == '__main__': # Main
    print('Server started.')
    global_matter.DatabaseConnection() # Connect to database
    ws_server = websockets.serve(receive.receive, '0.0.0.0', global_matter.SERVER_PORT) # Start WS server
    asyncio.get_event_loop().run_until_complete(asyncio.wait([judge.judge(), ws_server]))
    asyncio.get_event_loop().run_forever()
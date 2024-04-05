import asyncio, websockets

from .. import ws_server
from .... import

class judge_ws_server_application(ws_server.ws_server_application_protocol):
    def log(
        self, 
        log: str, 
        log_level: ws_server.ws_server_log_level = ws_server.ws_server_log_level.LEVEL_INFO
    ):
        if log_level is ws_server.ws_server_log_level.LEVEL_INFO:
            print('[CHAT_SERVER] [INFO] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_DEBUG:
            print('[CHAT_SERVER] [DEBUG] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_WARNING:
            print('[CHAT_SERVER] [WARNING] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_ERROR:
            print('[CHAT_SERVER] [ERROR] {}'.format(log))
    
    async def on_login(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        username: str,
        password: str
    ):
        self.log('{} tries to login with the password: {}'.format(username, password))

    async def on_quit(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        username: str, 
        session_token: str
    ):
        self.log('{} quitted with session token: {}'.format(username, session_token))
        

    async def on_message(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        username: str, 
        session_token: str, 
        message: str
    ):
        self.log('{} (session token: {}) message: {}'.format(username, session_token, message))

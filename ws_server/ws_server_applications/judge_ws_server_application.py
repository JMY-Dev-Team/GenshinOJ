import websockets

from .. import ws_server

class judge_ws_server_application(ws_server.ws_server_application_protocol):
    def log(
        self, 
        log: str, 
        log_level: ws_server.ws_server_log_level = ws_server.ws_server_log_level.LEVEL_INFO
    ):
        if log_level is ws_server.ws_server_log_level.LEVEL_INFO:
            print('[JUDGE_SERVER] [INFO] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_DEBUG:
            print('[JUDGE_SERVER] [DEBUG] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_WARNING:
            print('[JUDGE_SERVER] [WARNING] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_ERROR:
            print('[JUDGE_SERVER] [ERROR] {}'.format(log))
    
    async def on_login(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        content: dict
    ):
        self.log('The user {} tries to login with the hash: {}'.format(content['username'], self.get_md5(content['password'])))

    async def on_quit(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        content: dict
    ):
        self.log('The user {} quitted with session token: {}'.format(content['username'], content['session_token']))

    def get_md5(self, data):
        import hashlib
        hash = hashlib.md5('add-some-salt'.encode('utf-8'))
        hash.update(data.encode('utf-8'))
        return hash.hexdigest()
    
    async def on_submission(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        content: dict
    ):
        self.ws_server_instance.server_instance.get_module_instance('judge').now_submission_id = self.ws_server_instance.server_instance.get_module_instance('judge').now_submission_id + 1
        submission_code_path = self.ws_server_instance.server_instance.get_module_instance('global_message_queue').get_submission_code_path(
            self.ws_server_instance.server_instance.get_module_instance('judge').now_submission_id,
            content['language']
        ); 
        open(submission_code_path, 'w').close() # Create 
        submission_code = open(submission_code_path, 'w+'); submission_code.seek(0)
        content = submission_code.read(); new_content = '' + content
        submission_code.seek(0); submission_code.write(new_content)
        for line in content['code']:
            submission_code.write(line)

        submission_code.flush(); submission_code.close()
        self.ws_server_instance.server_instance.get_module_instance('judge').judgment_queue.append({
            'submission_id': self.ws_server_instance.server_instance.get_module_instance('judge').now_submission_id, 
            'problem_number': content['problem_number'], 
            'language': content['language'], 
            'username': self.ws_server_instance.server_instance.get_module_instance('judge').sessions[content['session_token']], 
            'websocket_protocol': websocket_protocol
        });
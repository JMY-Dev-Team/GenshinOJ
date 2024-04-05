import gc, os, sys, abc, json, enum, random, typing, importlib
import asyncio, websockets.server
import server

gc.disable()

sessions = dict()

def generate_session_token(self, session_token_seed: int) -> str:
    if session_token_seed > 1:
        generated_session_token =                    \
        generated_session_token                      \
        +                                            \
        chr(session_token_seed * 1  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 3  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 5  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 7  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 9  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 11 % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 13 % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 15 % 26 + ord('a'))
        return generated_session_token + self.generate_session_token(int(session_token_seed / 5))
    else:
        return 's'

WS_SERVER_CONFIG_JSON_PATH = os.getcwd() + '/ws_server/ws_server_config.json'
class ws_server:
    def __init__(self, server_instance: server.server, server_host = '0.0.0.0', server_port = 9982) -> None:
        self.server_instance = server_instance
        with open(WS_SERVER_CONFIG_JSON_PATH, 'r') as ws_server_config_json_file:
            self.ws_server_config = json.load(ws_server_config_json_file)
        
        self.ws_server_applications_config = self.ws_server_config['ws_server_applications']
        self.ws_server_applications: list[ws_server_application_protocol] = []
        if self.ws_server_config['enable_default_ws_server_application']:
            self.ws_server_applications.append(simple_ws_server_application(self))
        
        for ws_server_application_config in self.ws_server_applications_config:
            if ws_server_application_config['enabled']:
                print(ws_server_application_config['path'])
                self.ws_server_applications.append(getattr(getattr(importlib.__import__(ws_server_application_config['path']), ws_server_application_config['id']), ws_server_application_config['id'])(self))
        
        self.ws_server = websockets.server.serve(self.receive, server_host, server_port)
        self.main_loop = asyncio.get_event_loop()
        self.main_loop.run_until_complete(self.ws_server)

    def __del__(self) -> None:
        pass
        
    async def receive(self, websocket_protocol):
        try:
            async for original_message in websocket_protocol:
                message = json.loads(original_message)
                try:
                    for ws_server_application in self.ws_server_applications:
                        try:
                            getattr(ws_server_application, 'on_message')()
                            getattr(ws_server_application, format('on_' + message['type']))(message['content'])
                        except AttributeError:
                            pass
                        except Exception as e:
                            raise e
                except:
                    pass
        except Exception as e:
            if type(e) is not websockets.exceptions.ConnectionClosedOK:
                raise e
            
            for ws_server_application in self.ws_server_applications:
                ws_server_application.on_quit()

    async def process(self, this_websocket: websockets.server.WebSocketServerProtocol, original_message: str):
        pass
        #     elif message['type'] == 'quit':
        #         print('user ' + global_message_queue.sessions[message['session_token']] + ' quit.')
        #         try:
        #             del global_message_queue.sessions[this_websocket.session_token]
        #             del global_message_queue.chat_server_message_queue[session_token[this_websocket.session_token]]
        #         except:
        #             pass 
        #         await this_websocket.close(); response.clear(); await asyncio.sleep(0)

        #     elif message['type'] == 'submission': # Submission
        #         global_message_queue.now_submission_id = global_message_queue.now_submission_id + 1
        #         submission_code_path = global_message_queue.get_submission_code_path(global_message_queue.now_submission_id, message['language']); open(submission_code_path, 'w').close()
        #         submission_code = open(submission_code_path, 'w+'); submission_code.seek(0)
        #         content = submission_code.read(); new_content = '' + content
        #         submission_code.seek(0); submission_code.write(new_content)
        #         for line in message['code']:
        #             submission_code.write(line)

        #         submission_code.flush(); submission_code.close()
        #         global_message_queue.judgment_queue.append({'submission_id': global_message_queue.now_submission_id, 'problem_number': message['problem_number'], 'language': message['language'], 'username': global_message_queue.sessions[message['session_token']], 'websocket': this_websocket}); await asyncio.sleep(0)
        #     elif message['type'] == 'problem_statement':
        #         problem_number = message['problem_number']
        #         try:
        #             with open(global_message_queue.get_problem_statement_json_path(problem_number), 'r') as problem_statement_json_file:
        #                 response = json.load(problem_statement_json_file)
                    
        #             response['type'] = 'problem_statement'
        #         except Exception as e:
        #             print('problem_statement.json is not found!')
                
        #         await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)

        #     elif message['type'] == 'problem_set':
        #         response['type'] = 'problem_set'; response['problem_set'] = []
        #         try:
        #             # print('Try to open ' + os.path.dirname(__file__) + '/problem/problem_set.json')
        #             with open(global_message_queue.get_problem_set_json_path(), 'r') as problem_set_json_file:
        #                 response['problem_set'] = json.load(problem_set_json_file)['problem_set']
                        
        #         except Exception:
        #             print('problem_set.json is not found!')
                    
        #         await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)

        #     elif message['type'] == 'online_user':
        #         response['type'] = 'online_user'; response['content'] = []
        #         for session_token, session_username in global_message_queue.sessions.items():
        #             response['content'].append(session_username)
                
        #         await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)

class ws_server_log_level(enum.Enum):
    LEVEL_INFO = 0
    LEVEL_DEBUG = 1
    LEVEL_WARNING = 2
    LEVEL_ERROR = 3

class ws_server_application_protocol:
    """
    Base class for any implementations of additional websocket server applications
    """
    @typing.final
    def __init__(
        self, 
        ws_server_instance: ws_server
    ):
        self.ws_server_instance: ws_server = ws_server_instance
    
    @abc.abstractmethod
    def log(
        self, 
        log: str, 
        log_level: ws_server_log_level = ws_server_log_level.LEVEL_INFO
    ):
        """
        Logging method
        Args:
            log (str): Log information
            log_level (ws_server_log_level): Logging level
        Info:
            It is suggested that you should override this method to distinguish between the official application and yours.
        """
        if log_level is ws_server_log_level.LEVEL_INFO:
            print('[WS_SERVER] [INFO] {}'.format(log))
        if log_level is ws_server_log_level.LEVEL_DEBUG:
            print('[WS_SERVER] [DEBUG] {}'.format(log))
        if log_level is ws_server_log_level.LEVEL_WARNING:
            print('[WS_SERVER] [WARNING] {}'.format(log))
        if log_level is ws_server_log_level.LEVEL_ERROR:
            print('[WS_SERVER] [ERROR] {}'.format(log))
    
    @abc.abstractmethod
    async def on_login(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        username: str,
        password: str
    ):
        """
        Callback method `on_login`
        Args:
            websocket_protocol (websockets.server.WebSocketServerProtocol): the protocol of a websocket connection
            username (str): the login username
            password (str): the login password
        Info:
            You need to implement this method to do the specific actions you want whenever a user tries to login.
        """
        self.log('{} tries to login with the password: {}'.format(username, password))

    @abc.abstractmethod
    async def on_quit(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        username: str, 
        session_token: str
    ):
        """ 
        Callback method `on_quit`
        Args:
            websocket_protocol (websockets.server.WebSocketServerProtocol): the protocol of a websocket connection
            username (str): the username of whom wants to quit
            session_token (str): the token whose session is going to be quit
        Info:
            You need to implement this method to do the specific actions you want whenever a user tries to quit.
        """
        self.log('{} quitted with session token: {}'.format(username, session_token))

    @abc.abstractmethod
    async def on_message(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        username: str, 
        session_token: str, 
        message: str
    ):
        """
        Callback method `on_message`
        Args:
            websocket_protocol (websockets.server.WebSocketServerProtocol): the protocol of a websocket connection
            username (str): _description_
            session_token (str): _description_
            message (str): _description_
        Info:
            You need to implement this method to do the specific actions you want whenever a user send messages
        """
        self.log('{} (session token: {}) message: {}'.format(username, session_token, message))

class simple_ws_server_application(ws_server_application_protocol):
    """
    A simple, official implementation of websocket server application, providing some simple plugins.
    """
    def log(
        self, 
        log: str, 
        log_level: ws_server_log_level = ws_server_log_level.LEVEL_INFO
    ):
        return super().log(log, log_level)

    async def on_login(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        username: str, 
        password: str
    ):
        """
        Official callback method for login with a authentication plugin.
        """
        password_hash = server.get_module_instance('global_message_queue').get_md5(password)
        self.log('The user {} try to login with hash: {}.'.format(username, password_hash))
        self.server_instance.get_module_instance('db_connector').database_cursor.execute(f'SELECT password FROM users WHERE username = \'{username}\';')
        tmp = self.server_instance.get_module_instance('db_connector').database_cursor.fetchone()
        try:
            real_password_hash = tmp[0]
        except:
            self.log('The user {} failed to login.'.format(username), ws_server_log_level.LEVEL_ERROR)
            response = {
                'type': 'quit',
                'content': 'authentication_failure'
            }
            await websocket_protocol.send(json.dumps(response)); response.clear();

        if real_password_hash != None and real_password_hash == password_hash:
            new_session_token = self.generate_session_token(random.randint(1000000000000000, 10000000000000000))
            response = {'type': 'session_token', 'content': new_session_token}
            await websocket_protocol.send(json.dumps(response)); response.clear();
            websocket_protocol.session_token = new_session_token
            self.sessions[new_session_token] = username
            self.log('The user {} logged in successfully.'.format(username))
            self.log('The session token: {}'.format(new_session_token));
        else:
            print('The user {} failed to login.'.format(username))
            response = {'type': 'quit', 'content': 'authentication_failure'}
            await websocket_protocol.send(json.dumps(response)); response.clear();

    async def on_quit(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        username: str, 
        session_token: str
    ):
        super().on_quit(self, websocket_protocol, username, session_token)
        await websocket_protocol.close()
        self.log('{} quitted with session token: {}'.format(username, session_token))

    async def on_message(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        username: str, 
        session_token: str, 
        message: str
    ):
        self.log('Deprecated method.', ws_server_log_level.LEVEL_WARNING)

    def get_md5(data):
        import hashlib
        hash = hashlib.md5('add-some-salt'.encode('utf-8'))
        hash.update(data.encode('utf-8'))
        return hash.hexdigest()

    async def register(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        content: dict
    ):
        """
        Official callback method for registration
        """
        register_username = content['register_username']; register_password = content['register_password']
        register_password_hash = self.get_md5(register_password)
        self.log('The user {} try to register with hash: {}.'.format(register_username, register_password_hash))
        self.server_instance.get_module_instance('db_connector').database_cursor.execute(f'SELECT password FROM users WHERE username = \'{register_username}\';')
        tmp = self.server_instance.get_module_instance('db_connector').database_cursor.fetchone()
        if tmp == None:
            try:
                self.server_instance.get_module_instance('db_connector').database_cursor.execute(f'INSERT INTO users (username, password) VALUES (\'{register_username}\', \'{register_password_hash}\');')
                self.server_instance.get_module_instance('db_connector').database.commit()
                print(f'The user {register_username} registered successfully.')
            except:
                self.server_instance.get_module_instance('db_connector').database.rollback()

            response = {'type': 'quit', 'content': 'registration_success'}    
            await websocket_protocol.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
        else:
            print(f'The user {register_username} failed to register.')
            response = {'type': 'quit', 'content': 'registration_failure'}    
            await websocket_protocol.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
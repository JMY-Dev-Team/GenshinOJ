import os, sys, json, random, logging
import asyncio, websockets, websockets.server
from .. import server

class ws_server:
    def __init__(self) -> None:
        self.ws_server = websockets.serve(receive)
        server.get_module_instance('global_message_queue').add_task_to_event_loop(self.ws_server)
        pass

def generate_session_token(session_token_seed: int):
    if session_token_seed > 1:
        generated_session_token = ''
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
        return generated_session_token + generate_session_token(int(session_token_seed / 5))
    else:
        return 's'

async def receive(this_websocket):
    global session_token
    setattr(this_websocket, 'session_token', '')
    # Client messages process
    try:
        async for original_message in this_websocket: 
            await process(this_websocket, original_message)
            await asyncio.sleep(0)
            
        await this_websocket.recv()
        await asyncio.sleep(0)
    except Exception as e:
        if type(e) is not websockets.exceptions.ConnectionClosedOK:
            logging.exception(e)
        
        print('Connection closed, session token: {}'.format(this_websocket.session_token))
        if not this_websocket.session_token == '':
            try:
                del global_message_queue.sessions[this_websocket.session_token]
                del global_message_queue.chat_server_message_queue[session_token[this_websocket.session_token]]
            except:
                pass

        await this_websocket.close()

async def process(this_websocket: websockets.server.WebSocketServerProtocol, original_message: str):
    try:
        response = dict()
        message = json.loads(original_message)
        print(f'Received message from {this_websocket.remote_address[0]} (port: {this_websocket.remote_address[1]}): {message}')
        if message['type'] == 'login':
            login_username = message['login_username']; login_password = message['login_password']
            login_password_hash = global_message_queue.get_md5(login_password)
            print(f'The user {login_username} try to login with hash: {login_password_hash}.')
            global_message_queue.database_cursor.execute(f'SELECT password FROM users WHERE username = \'{login_username}\';')
            tmp = global_message_queue.database_cursor.fetchone()
            try:
                real_password_hash = tmp[0]
            except Exception as e:
                print(f'The user {login_username} failed to login.')
                response = {
                    'type': 'quit',
                    'content': 'authentication_failure'
                }
                await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)

            if real_password_hash != None and real_password_hash == login_password_hash:
                new_session_token = generate_session_token(random.randint(1000000000000000, 10000000000000000))
                response = {'type': 'session_token', 'content': new_session_token}
                await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                this_websocket.session_token = new_session_token
                global_message_queue.sessions[new_session_token] = login_username
                global_message_queue.chat_server_message_queue[login_username] = dict()
                global_message_queue.chat_server_message_queue[login_username]['message_queue'] = []
                global_message_queue.chat_server_message_queue[login_username]['websocket_protocol'] = this_websocket
                
                print(f'The user {login_username} logged in successfully.')
                print(f'The session token: {new_session_token}');
            else:
                print(f'The user {login_username} failed to login.')
                response = {'type': 'quit', 'content': 'authentication_failure'}
                await this_websocket.send(json.dumps(response)); response.clear();
                
            await asyncio.sleep(0)

        elif message['type'] == 'register':
            register_username = message['register_username']; register_password = message['register_password']
            register_password_hash = global_message_queue.get_md5(register_password)
            print(f'The user {register_username} try to register with hash: {register_password_hash}.')
            global_message_queue.database_cursor.execute(f'SELECT password FROM users WHERE username = \'{register_username}\';')
            tmp = global_message_queue.database_cursor.fetchone()
            if tmp == None:
                try:
                    global_message_queue.database_cursor.execute(f'INSERT INTO users (username, password) VALUES (\'{register_username}\', \'{register_password_hash}\');')
                    global_message_queue.database.commit()
                    print(f'The user {register_username} registered successfully.')
                except:
                    global_message_queue.database.rollback()

                response = {'type': 'quit', 'content': 'registration_success'}    
                await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
            else:
                print(f'The user {register_username} failed to register.')
                response = {'type': 'quit', 'content': 'registration_failure'}    
                await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)

        elif message['type'] == 'quit':
            print('user ' + global_message_queue.sessions[message['session_token']] + ' quit.')
            try:
                del global_message_queue.sessions[this_websocket.session_token]
                del global_message_queue.chat_server_message_queue[session_token[this_websocket.session_token]]
            except:
                pass 
            await this_websocket.close(); response.clear(); await asyncio.sleep(0)

        elif message['type'] == 'close_connection':
            await this_websocket.close()

        elif message['type'] == 'submission': # Submission
            global_message_queue.now_submission_id = global_message_queue.now_submission_id + 1
            submission_code_path = global_message_queue.get_submission_code_path(global_message_queue.now_submission_id, message['language']); open(submission_code_path, 'w').close()
            submission_code = open(submission_code_path, 'w+'); submission_code.seek(0)
            content = submission_code.read(); new_content = '' + content
            submission_code.seek(0); submission_code.write(new_content)
            for line in message['code']:
                submission_code.write(line)

            submission_code.flush(); submission_code.close()
            global_message_queue.judgment_queue.append({'submission_id': global_message_queue.now_submission_id, 'problem_number': message['problem_number'], 'language': message['language'], 'username': global_message_queue.sessions[message['session_token']], 'websocket': this_websocket}); await asyncio.sleep(0)
        elif message['type'] == 'problem_statement':
            problem_number = message['problem_number']
            try:
                with open(global_message_queue.get_problem_statement_json_path(problem_number), 'r') as problem_statement_json_file:
                    response = json.load(problem_statement_json_file)
                
                response['type'] = 'problem_statement'
            except Exception as e:
                print('problem_statement.json is not found!')
            
            await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)

        elif message['type'] == 'problem_set':
            response['type'] = 'problem_set'; response['problem_set'] = []
            try:
                # print('Try to open ' + os.path.dirname(__file__) + '/problem/problem_set.json')
                with open(global_message_queue.get_problem_set_json_path(), 'r') as problem_set_json_file:
                    response['problem_set'] = json.load(problem_set_json_file)['problem_set']
                    
            except Exception:
                print('problem_set.json is not found!')
                
            await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)

        elif message['type'] == 'online_user':
            response['type'] = 'online_user'; response['content'] = []
            for session_token, session_username in global_message_queue.sessions.items():
                response['content'].append(session_username)
            
            await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)

        elif message['type'] == 'chat_message':
            chat_message_user_from = message['from']; chat_message_user_to = message['to']; chat_messages = message['content']; session_token = message['session_token']
            if global_message_queue.sessions[session_token] == chat_message_user_from:
                if chat_message_user_to in global_message_queue.sessions.values(): # To whom is online
                    global_message_queue.chat_server_message_queue[chat_message_user_to]['message_queue'].append({
                        'from': chat_message_user_from,
                        'chat_messages': chat_messages
                    })
                    response['type'] = 'chat_echo'; response['content'] = [1]
                    await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                else: # To whom is offline
                    response['type'] = 'chat_echo'; response['content'] = [0, 'The function of chat cache is not implemented yet. Please retry to send message to whom is online.']
                    pass # TODO(JMY): Implement the function of chat cache
            else:
                response['type'] = 'chat_echo'; response['content'] = [0, 'Bad session token. Please logout and retry.']
                await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
    except Exception as e:
        if type(e) is not websockets.ConnectionClosedOK:
            logging.exception(e)
        
        print('Connection closed, session token: {}'.format(this_websocket.session_token))
        if not this_websocket.session_token == '':
            try:
                del global_message_queue.sessions[this_websocket.session_token]
                del global_message_queue.chat_server_message_queue[session_token[this_websocket.session_token]]
            except:
                pass
        
        await this_websocket.close()
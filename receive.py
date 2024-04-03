import random, json, asyncio, global_matter

def generate_session_token(session_token_seed: int):
    if session_token_seed > 1:
        generated_session_token = ''
        generated_session_token = generated_session_token                      \
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
    try:
        # Client messages process
        async for original_message in this_websocket: 
            try:
                message = json.loads(original_message)
                print(f'Received message from {this_websocket.remote_address[0]} (port: {this_websocket.remote_address[1]}): {message}')
                if message['type'] == 'login':
                    login_username = message['login_username']; login_password = message['login_password']
                    print(f'The user {login_username} try to login with the password: {login_password}.')
                    global_matter.database_cursor.execute(f'SELECT password FROM users WHERE username = \'{login_username}\';')
                    tmp = global_matter.database_cursor.fetchone()
                    try:
                        real_password = tmp[0]
                    except Exception as e:
                        print(f'The user {login_username} failed to login.')
                        response = {
                            'type': 'quit',
                            'content': 'authentication_failure'
                        }
                        await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                        continue

                    if real_password != None and real_password == login_password:
                        new_session_token = generate_session_token(random.randint(1000000000000000, 10000000000000000))
                        response = {'type': 'session_token', 'content': new_session_token}
                        await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                        global_matter.sessions[new_session_token] = login_username
                        global_matter.chat_server_message_queue[login_username] = dict
                        global_matter.chat_server_message_queue[login_username]['message_queue'] = []
                        global_matter.chat_server_message_queue[login_username]['websocket_protocol'] = this_websocket
                        print(f'The user {login_username} logged in successfully.')
                        print(f'The session token: {new_session_token}')
                    else:
                        print(f'The user {login_username} failed to login.')
                        response = {'type': 'quit', 'content': 'authentication_failure'}
                        await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)

                elif message['type'] == 'register':
                    register_username = message['register_username']; register_password = message['register_password']
                    print(f'The user {register_username} try to register with the password: {register_password}.')
                    global_matter.database_cursor.execute(f'SELECT password FROM users WHERE username = \'{register_username}\';')
                    tmp = global_matter.database_cursor.fetchone()
                    if tmp == None:
                        try:
                            global_matter.database_cursor.execute(f'INSERT INTO users (username, password) VALUES (\'{register_username}\', \'{register_password}\');')
                            global_matter.database.commit()
                            print(f'The user {register_username} registered successfully.')
                        except:
                            global_matter.database.rollback()

                        response = {'type': 'quit', 'content': 'registration_success'}    
                        await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                    else:
                        print(f'The user {register_username} failed to register.')
                        response = {'type': 'quit', 'content': 'registration_failure'}    
                        await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                elif message['type'] == 'quit':
                    print('user ' + global_matter.sessions[message['session_token']] + ' quit.'); del global_matter.sessions[message['session_token']]; await this_websocket.close(); response.clear(); await asyncio.sleep(0)
                elif message['type'] == 'close_connection':
                    await this_websocket.close()
                elif message['type'] == 'submission': # Submission
                    global_matter.now_submission_id = global_matter.now_submission_id + 1
                    submission_code_path = global_matter.get_submission_code_path(global_matter.now_submission_id, message['language']); open(submission_code_path, 'w').close()
                    submission_code = open(submission_code_path, 'w+'); submission_code.seek(0)
                    content = submission_code.read(); new_content = '' + content
                    submission_code.seek(0); submission_code.write(new_content)
                    for line in message['code']:
                        submission_code.write(line)

                    submission_code.flush(); submission_code.close()
                    global_matter.judgment_queue.append({'submission_id': global_matter.now_submission_id, 'problem_number': message['problem_number'], 'language': message['language'], 'username': global_matter.sessions[message['session_token']], 'websocket': this_websocket})
                    # print(judgment_queue); 
                elif message['type'] == 'problem_statement':
                    problem_number = message['problem_number']
                    try:
                        with open(global_matter.get_problem_statement_json_path(problem_number), 'r') as problem_statement_json_file:
                            response = json.load(problem_statement_json_file)
                        
                        response['type'] = 'problem_statement'
                    except Exception as e:
                        print('problem_statement.json is not found!')
                    
                    await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                    
                elif message['type'] == 'problem_set':
                    response['type'] = 'problem_set'; response['problem_set'] = []
                    try:
                        # print('Try to open ' + os.path.dirname(__file__) + '/problem/problem_set.json')
                        with open(global_matter.get_problem_set_json_path(), 'r') as problem_set_json_file:
                            response['problem_set'] = json.load(problem_set_json_file)['problem_set']
                            
                    except Exception:
                        print('problem_set.json is not found!')
                        
                    await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                elif message['type'] == 'online_user':
                    response['type'] = 'online_user'; response['content'] = []
                    for session_token, session_username in global_matter.sessions.items():
                        response['content'].append(session_username)
                        
                    await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                elif message['type'] == 'chat_message':
                    chat_message = message['content']
                    chat_message_user_from = message['from']; chat_message_user_to = message['to']; session_token = message['session_token']
                    if global_matter.sessions[session_token] == chat_message_user_from:
                        global_matter.chat_server_message_queue[chat_message_user_to]['message_queue'].append({'from': chat_message_user_from, \
                                                                                                               'chat_message': chat_message})
                        response['type'] = 'chat_echo'; response['content'] = [1]
                        await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                    else:
                        response['type'] = 'chat_echo'; response['content'] = [0, 'Bad session token. Please logout and retry.']
                        await this_websocket.send(json.dumps(response)); response.clear(); await asyncio.sleep(0)
                    
            except Exception as e:
                pass     

    except Exception as e:
        pass

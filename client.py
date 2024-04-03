import os, sys, json, time, threading, logging
try:
    import websocket, urwid
except:
    os.system('pip install websocket-client urwid')
    import websocket

SERVER_HOST = 'ws://148.100.112.58:80' # Test server address

session_token = ''
login_username = ''; login_password = ''
register_username = ''; register_password = ''
is_processing_message = False; is_logged = False; exit_flag = False
t: threading.Thread
ws: websocket.WebSocketApp

def message_processing(self, original_message):
    global is_processing_message, is_logged, exit_flag, session_token
    is_processing_message = True
    try:
        message = json.loads(original_message)
        if message['type'] == 'problem_set':
            print('+ Problem Set')
            for problem_number in message['problem_set']:
                print(problem_number, end = '')

            print(); print('- Problem Set')
        elif message['type'] == 'problem_statement':
            print('+ Problem Statement')
            print('Name: {} - {}'.format(message['problem_number'], message['problem_name']))
            print('Difficulty: {}'.format(message['difficulty']))
            for line in message['problem_statement']:
                print(line)

            print('- Problem Statement')
        elif message['type'] == 'submission_result':
            print('+ Submission Result')
            print('Result: {}'.format(message['result']))
            if format(message['result']) == 'WA':
                for reason in message['reasons']:
                    print('Reason: {}'.format(reason))
                
            print('- Submission Result')
        elif message['type'] == 'session_token':
            session_token = message['content']
            print('Session Token: {}'.format(session_token))
            is_logged = True
        elif message['type'] == 'online_user':
            print('Online Users: ', end = '')
            for online_user in message['content']:
                print('{} '.format(online_user), end = '')

            print()
        elif message['type'] == 'quit':
            if message['content'] == 'authentication_failure':
                print('Authentication Failure')
            if message['content'] == 'registration_failure':
                print('Registration Failure')
            if message['content'] == 'registration_success':
                print('Registration Success')

            response = {'type': 'close_connection'}
            self.send(json.dumps(response)); response.clear()
            exit_flag = True; is_processing_message = False
            exit(0)

    except Exception as e:
        logging.exception(e)

    is_processing_message = False

def input_processing(self):
    global login_username, is_processing_message
    while not is_logged:
        if exit_flag:
            exit(0)

    while True:
        try:
            while is_processing_message == True:
                if exit_flag:
                    exit(0)

            command = input('> ').strip().split()
            if command == []:
                continue
            if command[0] == '%help':
                print('使用 %problem_set 来获取题目列表')
                print('使用 %problem_statement[题目编号] 来获取指定题目信息')
                print('使用 %submit [题目编号] [源文件名] 来递交代码测评指定题目')
                print('使用 %quit 来退出登录')
            elif command[0] == '%debug':
                websocket.enableTrace(True)
            elif command[0] == '%problem_set':
                is_processing_message = True
                response = {'type': 'problem_set'}
                self.send(json.dumps(response)); response.clear()
            elif command[0] == '%problem_statement':
                is_processing_message = True
                response = {
                    'type': 'problem_statement',
                    'problem_number': command[1]
                }
                self.send(json.dumps(response)); response.clear()
            elif command[0] == '%submit':
                is_processing_message = True
                problem_number = command[1]; file_name = command[2]
                response = {'type': 'submission', 'username': login_username, 'session_token': session_token, 'problem_number': problem_number, 'language': 'cpp', 'code': []}
                try:
                    with open(file_name, 'r') as file:
                        lines = file.readlines()
                        for line in lines:
                            response['code'].append(line)
                except FileNotFoundError:
                    pass

                self.send(json.dumps(response)); response.clear()
            elif command[0] == '%online_user':
                is_processing_message = True
                response = {'type': 'online_user'}
                self.send(json.dumps(response)); response.clear()
            elif command[0] == '%quit':
                break

            if exit_flag:
                response = {'type': 'quit', 'session_token': session_token}
                self.send(json.dumps(response)); response.clear()
                exit(0)

        except KeyboardInterrupt:
            break
        except Exception as e:
            logging.exception(e)
            break

    response = {'type': 'quit', 'session_token': session_token}
    self.send(json.dumps(response)); response.clear()
    exit(0)
                
def login_session(self):
    response = {'type': 'login', 'login_username': login_username, 'login_password': login_password}
    self.send(json.dumps(response)); response.clear()
    
def register_session(self):
    response = {'type': 'register', 'register_username': register_username, 'register_password': register_password}
    self.send(json.dumps(response)); response.clear()

def websocket_session(on_open):
    global ws, t
    ws = websocket.WebSocketApp(SERVER_HOST, on_message = message_processing, on_open = on_open)
    t = threading.Thread(target = input_processing, args = (ws, )).start()
    ws.run_forever()

if __name__ == '__main__':
    try:
        print('欢迎使用 Genshin OJ 的客户端！')
        print('1. 登录')
        print('2. 注册')
        print('输入其余选项则退出')
        option = input().strip()
        if option == '1':
            try:
                login_username = input('请输入您的用户名: ')
                if login_username.find('%') != -1:
                    print('非法用户名！')
                    exit(0)

                login_password = input('请输入您的密码: ')
                if login_password.find('%') != -1:
                    print('非法密码！')
                    exit(0)

                websocket_session(login_session)

            except Exception as e:
                print(f'Error: {e}')
                exit(0)

        elif option == '2':
            try:
                register_username = input('请输入您的注册用户名: ')
                if register_username.find('%') != -1:
                    print('非法注册用户名！')
                    exit(0)

                register_password = input('请输入您的注册密码: ')
                if register_password.find('%') != -1:
                    print('非法注册密码！')
                    exit(0)

                websocket_session(register_session)

            except Exception as e:
                print(f'Error: {e}')
                exit(0)
        else:
            exit(0)

    except Exception:
        response = {'type': 'close_connection'}
        ws.send(json.dumps(response)); response.clear()
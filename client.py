import os, sys, json, time, logging, platform, threading
try:
    import websocket, urwid
except:
    os.system('pip3 install websocket-client urwid')
    import websocket

SERVER_HOST: str = 'ws://127.0.0.1:9982' # Test server address

session_token: str = ''
login_username: str = ''; login_password: str = ''
register_username: str = ''; register_password: str = ''
is_processing: bool = True; is_logged: bool = False
t: threading.Thread
ws: websocket.WebSocketApp
exit_event: threading.Event

def message_processing(self, original_message):
    global is_processing, is_logged, session_token
    try:
        is_processing = True
        message = json.loads(original_message)
        if message['type'] == 'problem_set':
            print('+ Problem Set')
            for problem_number in message['problem_set']:
                print(problem_number, end = '')
            
            print(); print('- Problem Set')
            is_processing = False

        elif message['type'] == 'problem_statement':
            print('+ Problem Statement')
            print('Name: {} - {}'.format(message['problem_number'], message['problem_name']))
            print('Difficulty: {}'.format(message['difficulty']))
            for line in message['problem_statement']:
                print(line)
            
            print('- Problem Statement')
            is_processing = False

        elif message['type'] == 'submission_result':
            print('+ Submission Result')
            print('Result: {}'.format(message['result']))
            if format(message['result']) == 'WA':
                for reason in message['reasons']:
                    print('Reason: {}'.format(reason))
            
            print('- Submission Result')
            is_processing = False

        elif message['type'] == 'session_token':
            session_token = message['content']
            print('Session Token: {}'.format(session_token))
            is_logged = True
            is_processing = False

        elif message['type'] == 'online_user':
            print('Online Users: ', end = '')
            for online_user in message['content']:
                if online_user == message['content'][-1]:
                    print('{}'.format(online_user), end = '')
                else:
                    print('{}, '.format(online_user), end = '')
            
            print()
            is_processing = False

        elif message['type'] == 'chat_echo':
            is_processing = False

        elif message['type'] == 'chat_message':
            print('+ Chat Message')
            print('From: {}'.format(message['from']))
            chat_messages: list[str] = message['content']
            for chat_message in chat_messages:
                print('chat> {}'.format(chat_message))
            
            print('- Chat Message')
            is_processing = False

        elif message['type'] == 'quit':
            if message['content'] == 'authentication_failure':
                print('Authentication Failure')
            if message['content'] == 'registration_failure':
                print('Registration Failure')
            if message['content'] == 'registration_success':
                print('Registration Success')
            
            message = {'type': 'close_connection'}
            self.send(json.dumps(message)); message.clear()
            is_processing = False
            sys.exit(0)

        
    except Exception as e:
        logging.exception(e)

def input_processing(exit_event, self):
    global login_username, is_processing
    while is_processing == True:
        pass
    
    while not exit_event.is_set():
        try:
            while (is_processing == True) and (not exit_event.is_set()):
                pass
            
            if exit_event.is_set():
                exit_event.set()
                break
            
            command = input('> ').strip().split()
            if command == []:
                continue

            if command[0] == '%help':
                print('使用 %problem_set 来获取题目列表')
                print('使用 %problem_statement[题目编号] 来获取指定题目信息')
                print('使用 %submit [题目编号] [源文件名] [代码语言] 来递交指定语言的代码测评指定题目')
                print('使用 %chat [短讯聊天对象] 来短讯聊天，此命令会使你进入短讯聊天环境，键入 %send 来确认发送，键入 %cancel 来取消发送')
                print('使用 %online_user 来查询在线用户')
                print('使用 %debug [on / off] 来开启或关闭调试模式')
                print('使用 %quit 或 %exit 退出')

            elif command[0] == '%problem_set': # Get problem list
                is_processing = True
                message = {'type': 'problem_set', 'content': {}}
                self.send(json.dumps(message)); message.clear()

            elif command[0] == '%problem_statement': # Get statement of a specific problem
                is_processing = True
                message = {
                    'type': 'problem_statement',
                    'content': {
                        'problem_number': command[1]
                    }
                }
                self.send(json.dumps(message)); message.clear()

            elif command[0] == '%submit': # Submit source code for judgment
                is_processing = True
                problem_number = command[1]; file_name = command[2]; language = command[3]
                message = {'type': 'submission', 'content': {'username': login_username, 'session_token': session_token, 'problem_number': problem_number, 'language': language, 'code': []}}
                try:
                    with open(file_name, 'r') as file:
                        lines = file.readlines()
                        for line in lines:
                            message['content']['code'].append(line)
                except FileNotFoundError:
                    pass
                
                self.send(json.dumps(message)); message.clear()

            elif command[0] == '%online_user': # Check online users
                is_processing = True
                message = {'type': 'online_user', 'content': {}}
                self.send(json.dumps(message)); message.clear()

            elif command[0] == '%chat': # Send short chat message
                if len(command) < 2:
                    print('Please specify whom you want to send this message to.')
                    continue
                
                chat_messages: list[str] = []; chat_message: str; confirmed_flag = True
                while chat_message := input('chat> '):
                    chat_message = chat_message.strip()
                    if chat_message == '%send':
                        break
                    if chat_message == '%cancel':
                        confirmed_flag = False
                        break
                    
                    chat_messages.append(chat_message)
                
                if not confirmed_flag:
                    continue
                
                is_processing = True
                message = {
                    'type': 'chat_short', 
                    'content': {
                        'from': login_username, 'to': command[1], 'messages': chat_messages, 'session_token': session_token
                    }
                }
                self.send(json.dumps(message)); message.clear()

            elif command[0] == '%debug': # Toggle debug mode
                if len(command) < 2:
                    print('Please specify whether you want to turn on the debug output or not.')
                    continue
                
                if command[1] == 'on':
                    websocket.enableTrace(True)
                if command[1] == 'off':
                    websocket.enableTrace(False)

            elif command[0] == '%quit' or command[0] == '%exit': # Quit the client program
                is_processing = True
                exit_event.set()
                break

        except KeyboardInterrupt:
            exit_event.set()
            break
    
    is_processing = True
    message = {'type': 'quit', 'session_token': session_token}
    self.send(json.dumps(message)); message.clear() # Send quit message
    is_processing = False
    sys.exit(0)

def login_session(self):
    is_processing_message = True
    message = {'type': 'login', 'content': {'username': login_username, 'password': login_password}}
    self.send(json.dumps(message)); message.clear()
    
def register_session(self):
    is_processing_message = True
    message = {'type': 'register', 'content': {'username': register_username, 'password': register_password}}
    self.send(json.dumps(message)); message.clear()
    
def websocket_session_on_close(self, close_status_code, close_msg):
    is_processing_message = True
    if session_token == '':
        message = {'type': 'close_connection'}
    else:
        message = {'type': 'quit', 'session_token': session_token}
        
    self.send(json.dumps(message)); message.clear()
    time.sleep(1)

def websocket_session(on_open):
    global t, ws
    exit_event = threading.Event()
    try:
        ws = websocket.WebSocketApp(SERVER_HOST, on_message = message_processing, on_open = on_open, on_close = websocket_session_on_close)
        t = threading.Thread(target = input_processing, args = (exit_event, ws, ), daemon = True); t.start()
        threading.Thread(target = ws.run_forever).start()
        exit_event.wait()
        ws.close(status = websocket.STATUS_GOING_AWAY)
        sys.exit(0)
    except KeyboardInterrupt:
        print('Quitting...')
        exit_event.set()
        ws.close(status = websocket.STATUS_GOING_AWAY)
        sys.exit(0)

if __name__ == '__main__':
    websocket.enableTrace(True)
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
                    sys.exit(0)

                login_password = input('请输入您的密码: ')
                if login_password.find('%') != -1:
                    print('非法密码！')
                    sys.exit(0)

                websocket_session(login_session)
                sys.exit(0)

            except KeyboardInterrupt:
                sys.exit(0)

        elif option == '2':
            try:
                register_username = input('请输入您的注册用户名: ')
                if register_username.find('%') != -1:
                    print('非法注册用户名！')
                    sys.exit(0)

                register_password = input('请输入您的注册密码: ')
                if register_password.find('%') != -1:
                    print('非法注册密码！')
                    sys.exit(0)

                websocket_session(register_session)
                sys.exit(0)

            except KeyboardInterrupt:
                sys.exit(0)
        else:
            sys.exit(0)

    except:
        pass
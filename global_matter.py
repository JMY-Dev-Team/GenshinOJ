import os, json, asyncio, logging, pymysql

def get_problem_testcase_config_json_path(problem_number):
    problem_number = str(problem_number)
    return '{}/problem/{}/problem_testcase_config.json'.format(os.getcwd(), problem_number)

def get_problem_statement_json_path(problem_number):
    problem_number = str(problem_number)
    return '{}/problem/{}/problem_statement.json'.format(os.getcwd(), problem_number)

def get_submission_code_path(submission_id, language):
    submission_id = str(submission_id)
    if language == 'cpp':
        return '{}/submit/submission_{}_code.cpp'.format(os.getcwd(), submission_id)
    
def get_problem_set_json_path():
    return os.path.dirname(__file__) + '/problem/problem_set.json'

def execute_command(command: str):
    os.system(command)
    print(command)

def DatabaseConnection(DATABASE_USER = 'root', DATABASE_PASSWORD = '123456', DATABASE_PORT = 3306): # Database Connection
    global database, database_cursor
    try: # Connect to database
        database = pymysql.connect(host = 'localhost', user = DATABASE_USER, passwd = DATABASE_PASSWORD, port = DATABASE_PORT, database = 'GenshinOJ')
        print('连接成功！')
    except Exception: # If the database is not established, create it
        database = pymysql.connect(host = 'localhost', user = DATABASE_USER, passwd = DATABASE_PASSWORD, port = DATABASE_PORT)
        database_cursor = database.cursor(); database_cursor.execute('CREATE DATABASE IF NOT EXISTS GenshinOJ;')
        database = pymysql.connect(host = 'localhost', user = DATABASE_USER, passwd = DATABASE_PASSWORD, port = DATABASE_PORT, database = 'GenshinOJ')
        print('初始化完毕！')

    # Get MySQL's version
    database_cursor = database.cursor(); database_cursor.execute('SELECT VERSION()')
    print(f'MySQL Version: {database_cursor.fetchone()[0]}')
    # Initialize the table
    database_cursor.execute(
    '''
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(256) NOT NULL,
        password VARCHAR(256) NOT NULL
    )
    '''
    )

judgment_queue = []
chat_server_message_queue = dict()
SERVER_HOST = '0.0.0.0'
SERVER_PORT = 9982

is_server_closed = False

sessions = dict()
problem_num = 0; now_submission_id = 0
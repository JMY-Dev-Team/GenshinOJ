import os
import pymysql, hashlib

def get_problem_testcase_config_json_path(problem_number):
    problem_number = str(problem_number)
    return '{}/problem/{}/problem_testcase_config.json'.format(os.getcwd(), problem_number)

def get_problem_statement_json_path(problem_number):
    problem_number = str(problem_number)
    return '{}/problem/{}/problem_statement.json'.format(os.getcwd(), problem_number)

def get_submission_code_path(submission_id, submission_language):
    submission_id = str(submission_id)
    if submission_language == 'c':
        return '{}/submit/submission_{}_code.c'.format(os.getcwd(), submission_id)
    if submission_language == 'cpp':
        return '{}/submit/submission_{}_code.cpp'.format(os.getcwd(), submission_id)
    if submission_language == 'java':
        return '{}/submit/submission_{}_code.java'.format(os.getcwd(), submission_id)
    if submission_language == 'py':
        return '{}/submit/submission_{}_code.py'.format(os.getcwd(), submission_id)

def get_problem_set_json_path():
    return os.path.dirname(__file__) + '/problem/problem_set.json'

def get_executable_path(submission_id, submission_language):
    if submission_language == 'c' or submission_language == 'cpp':
        return '{}/submit/submission_{}_executable.o'.format(os.getcwd(), submission_id)
    if submission_language == 'java':
        return '' # TODO(JMY): Add Java support
    if submission_language == 'py':
        return '{}/submit/submission_{}_executable.pyc'.format(os.getcwd(), submission_id)
    
def get_executable_run_command(submission_id, submission_language):
    if submission_language == 'c' or submission_language == 'cpp':
        return '{}/submit/submission_{}_executable.o'.format(os.getcwd(), submission_id)
    if submission_language == 'java':
        return '' # TODO(JMY): Add Java support
    if submission_language == 'py':
        return 'python3 {}/submit/submission_{}_executable.pyc'.format(os.getcwd(), submission_id)

def get_compile_command(submission_code_path, submission_executable_path, submission_language):
    if submission_language == 'c':
        return 'gcc {} -o {}'.format(submission_code_path, submission_executable_path)
    if submission_language == 'cpp':
        return 'g++ {} -o {}'.format(submission_code_path, submission_executable_path)
    if submission_language == 'java':
        return '' # TODO(JMY): Add Java support
    if submission_language == 'py':
        return 'python3 py_compiler.py {} {}'.format(submission_code_path, submission_executable_path)

def execute_command(command: str):
    os.system(command)
    print(command)

def get_md5(data):
    hash = hashlib.md5('add-some-salt'.encode('utf-8'))
    hash.update(data.encode('utf-8'))
    return hash.hexdigest()

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
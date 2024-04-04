import os
import pymysql, hashlib

def get_problem_testcase_config_json_path(problem_number):
    problem_number = str(problem_number)
    return '{}/problem/{}/problem_testcase_config.json'.format(os.getcwd(), problem_number)

def get_problem_statement_json_path(problem_number):
    problem_number = str(problem_number)
    return '{}/problem/{}/problem_statement.json'.format(os.getcwd(), problem_number)

def get_problem_set_json_path():
    return os.path.dirname(__file__) + '/problem/problem_set.json'

def get_compiler_root_path():
    return '{}/compiler'.format(os.getcwd())

def get_submission_code_path(submission_id, submission_language):
    pass

def execute_command(command: str):
    os.system(command)
    print(command)

def get_md5(data):
    hash = hashlib.md5('add-some-salt'.encode('utf-8'))
    hash.update(data.encode('utf-8'))
    return hash.hexdigest()

module_list = []

judgment_queue = []
chat_server_message_queue = dict()

is_server_closed = False

sessions = dict()
problem_num = 0; now_submission_id = 0
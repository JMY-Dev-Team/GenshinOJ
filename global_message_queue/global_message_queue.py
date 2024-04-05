import os
import pymysql, hashlib, asyncio

class global_message_queue:
    def __init__(self, server_instance):
        self.message_queue = dict()
        
    def on_unload(self):
        pass
        
    def get_message_of(self, module_id: str) -> list:
        return self.message_queue[module_id]
    
    def push_message(self, to_module_id: str, message: dict) -> bool:
        self.message_queue[to_module_id].append(message)

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

module_list = []

is_server_closed = False
problem_num = 0; now_submission_id = 0
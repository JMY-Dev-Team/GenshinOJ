import os, gc
import server

gc.disable()
class global_message_queue:
    def __init__(self, server_instance) -> None:
        self.server_instance = server_instance
        self.message_queue = dict()
        
    def get_message_of(self, module_id: str) -> list:
        return self.message_queue[module_id]
    
    def push_message(self, to_module_id: str, message: dict) -> bool:
        self.message_queue[to_module_id].append(message)
    
    def get_problem_testcase_config_json_path(self, problem_number):
        problem_number = str(problem_number)
        return '{}/problem/{}/problem_testcase_config.json'.format(os.getcwd(), problem_number)

    def get_problem_statement_json_path(self, problem_number):
        problem_number = str(problem_number)
        return '{}/problem/{}/problem_statement.json'.format(os.getcwd(), problem_number)

    def get_problem_set_json_path(self):
        return os.getcwd() + '/problem/problem_set.json'

    def get_compiler_root_path(self):
        return '{}/compiler'.format(os.getcwd())

    def execute_command(self, command: str):
        os.system(command)
        print(command)
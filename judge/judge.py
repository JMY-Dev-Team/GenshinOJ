import os, gc, sys, json, platform

import asyncio, logging

import server

# gc.disable()

class judge:
    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads['judge']['instance'] = self
        
        self.judgment_queue = []
        self.now_submission_id = 0
        
        self.server_instance.tasks.append(asyncio.create_task(self.judge_loop())) # Add looped task

    def __del__(self) -> None:
        print('Judge unloaded.')
    
    async def judge_loop(self):
        await asyncio.sleep(0)
        while True:
            await asyncio.sleep(0)
            for judgment in self.judgment_queue:
                # submission_username = judgment['username']
                submission_id = judgment['submission_id']
                submission_language = judgment['language']
                submission_problem_number = judgment['problem_number'] # Problem number
                
                # Compile Part
                
                self.server_instance.get_module_instance('global_message_queue').execute_command(
                    self.server_instance.get_module_instance('compilers_manager').get_compile_file_command_by_filename_and_language(
                        'submission_' + str(submission_id),
                        submission_language
                    )
                )
                
                # Judging Part
                try:
                    try:
                        with open(self.server_instance.get_module_instance('global_message_queue').get_problem_testcase_config_json_path(submission_problem_number), 'r') as problem_testcase_config_json_file: # Get the configuration of the problem
                            problem_testcase_config = json.load(problem_testcase_config_json_file)
                            testcases = problem_testcase_config['testcases'] # Testcases
                    except:
                        judgment_result = {'submission_id': judgment['submission_id'], 'result': 'CE'}
                        response = judgment_result; response['type'] = 'submission_result'
                        await judgment['websocket_protocol'].send(json.dumps(response)); response.clear(); 
                        del judgment_result
                        print('Judged one.')
                        break
                    
                    general_score = 0 # General score
                    general_AC_flag = True # General AC flag
                    reasons = [] # Reasons
                    for testcase in testcases: # For each testcase
                        testcase_number = testcase['number']
                        testcase_input_path = '{}/problem/{}/input/{}'.format(os.getcwd(), submission_problem_number, testcase['input']) # Input file path 
                        testcase_answer_path = '{}/problem/{}/answer/{}'.format(os.getcwd(), submission_problem_number, testcase['answer']) # Answer file path
                        testcase_output_path = '{}/problem/{}/output/{}'.format(os.getcwd(), submission_problem_number, 'output{}.txt'.format(testcase_number)) # Output file path
                        self.server_instance.get_module_instance('global_message_queue').execute_command(
                            '{} < \"{}\" > \"{}\"'.format(
                                self.server_instance.get_module_instance('compilers_manager').get_binary_execute_command_by_filename_and_language(
                                    'submission_' + str(submission_id),
                                    submission_language
                                ), 
                                testcase_input_path, 
                                testcase_output_path
                            )
                        )
                        
                        testcase_AC_flag = True
                        with open(testcase_output_path, 'r') as testcase_output:
                            with open(testcase_answer_path, 'r') as testcase_answer:
                                testcase_output_lines = testcase_output.readlines()
                                testcase_answer_lines = testcase_answer.readlines()
                                if len(testcase_answer_lines) != len(testcase_output_lines):
                                    reasons.append('Your output was too short.')
                                    testcase_AC_flag = False
                                else:
                                    for i in range(0, len(testcase_answer_lines)):
                                        if testcase_answer_lines[i] != testcase_output_lines[i]:
                                            reasons.append('Your output was wrong.')
                                            testcase_AC_flag = False
                                            break
                        
                        if testcase_AC_flag == True:
                            general_score = general_score + testcase['score']
                        else:
                            general_AC_flag = False
                        
                        if platform.system() == 'Linux':
                            self.server_instance.get_module_instance('global_message_queue').execute_command('rm -rf \"{}\"'.format(testcase_output_path))
                        if platform.system() == 'Windows':
                            self.server_instance.get_module_instance('global_message_queue').execute_command('del \"{}\"'.format(testcase_output_path))
                    
                    judgment_result = dict()
                    if general_AC_flag == True:
                        judgment_result = {'submission_id': judgment['submission_id'], 'result': 'AC'}
                    else:
                        judgment_result = {'submission_id': judgment['submission_id'], 'result': 'WA', 'reasons': reasons}
                    
                    response = judgment_result; response['type'] = 'submission_result'
                    await judgment['websocket_protocol'].send(json.dumps(response)); response.clear(); 
                    del judgment_result
                    print('Judged one.')
                except Exception as e:
                    logging.exception(e)
                    print('Problem {} is not configured correctly. Please configure it.'.format(submission_problem_number))
                
                if platform.system() == 'Windows':
                    self.server_instance.get_module_instance('global_message_queue').execute_command('del \"{}\"'.format(
                        self.server_instance.get_module_instance('compilers_manager').get_file_path_by_filename_and_language(
                            'submission_' + str(submission_id),
                            submission_language
                        )
                    ))
                if platform.system() == 'Linux':
                    self.server_instance.get_module_instance('global_message_queue').execute_command('rm -rf \"{}\"'.format(
                        self.server_instance.get_module_instance('compilers_manager').get_file_path_by_filename_and_language(
                            'submission_' + str(submission_id),
                            submission_language
                        )
                    ))
                
                if platform.system() == 'Windows':
                    self.server_instance.get_module_instance('global_message_queue').execute_command('del \"{}\"'.format(
                        self.server_instance.get_module_instance('compilers_manager').get_binary_path_by_filename_and_language(
                            'submission_' + str(submission_id),
                            submission_language
                        )
                    ))
                if platform.system() == 'Linux':
                    self.server_instance.get_module_instance('global_message_queue').execute_command('rm -rf \"{}\"'.format(
                        self.server_instance.get_module_instance('compilers_manager').get_binary_path_by_filename_and_language(
                            'submission_' + str(submission_id),
                            submission_language
                        )
                    ))
                await asyncio.sleep(0)
                
            self.judgment_queue.clear()
            await asyncio.sleep(0)
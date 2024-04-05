import os, gc, sys, json

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

    async def judge_loop(self):
        while True:
            await asyncio.sleep(0)
            for judgment in self.judgment_queue:
                # submission_username = judgment['username']
                submission_id = judgment['submission_id']
                submission_language = judgment['language']
                submission_problem_number = judgment['problem_number'] # Problem number

                # Judging Part
                try:
                    with open(self.server_instance.get_problem_testcase_config_json_path(submission_problem_number), 'r') as problem_testcase_config_json_file: # Get the configuration of the problem
                        problem_testcase_config = json.load(problem_testcase_config_json_file)
                        testcases = problem_testcase_config['testcases'] # Testcases

                    general_score = 0 # General score
                    general_AC_flag = True # General AC flag
                    reasons = [] # Reasons
                    for testcase in testcases: # For each testcase
                        testcase_number = testcase['number']
                        testcase_input_path = '{}/problem/{}/input/{}'.format(os.getcwd(), submission_problem_number, testcase['input']) # Input file path 
                        testcase_answer_path = '{}/problem/{}/answer/{}'.format(os.getcwd(), submission_problem_number, testcase['answer']) # Answer file path
                        testcase_output_path = '{}/problem/{}/output/{}'.format(os.getcwd(), submission_problem_number, 'output{}.txt'.format(testcase_number)) # Output file path
                        #global_matter.execute_command('{} < \"{}\" > \"{}\"'.format(submission_executable_run_command, testcase_input_path, testcase_output_path))
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

                        self.server_instance.get_module_instance('global_message_queue').execute_command('rm -f \"{}\"'.format(testcase_output_path))
                    
                    judgment_result = dict()
                    if general_AC_flag == True:
                        judgment_result = {'submission_id': judgment['submission_id'], 'result': 'AC'}
                    else:
                        judgment_result = {'submission_id': judgment['submission_id'], 'result': 'WA', 'reasons': reasons}

                    response = judgment_result; response['type'] = 'submission_result'
                    await judgment['websocket-protocol'].send(json.dumps(response)); response.clear(); 
                    del judgment_result
                    print('Judged one.')
                except Exception as e:
                    logging.exception(e)
                    print('Problem {} is not configured correctly. Please configure it.'.format(submission_problem_number))
                    
                await asyncio.sleep(0)
                
            self.server_instance.get_module_instance('global_message_queue').judgment_queue.clear()
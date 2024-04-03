import os, json
import asyncio, logging
import global_matter

async def judge():
    while True:
        await asyncio.sleep(0)
        for judgment in global_matter.judgment_queue:
            # submission_username = judgment['username']
            submission_code_path = global_matter.get_submission_code_path(judgment['submission_id'], judgment['language']) # Source code path
            submission_executable_path = '{}/submit/submission_{}_executable'.format(os.getcwd(), judgment['submission_id']) # Generated executable path
            submission_problem_number = judgment['problem_number'] # Problem number
            # Compile Part
            global_matter.execute_command('g++ {} -o {}'.format(submission_code_path, submission_executable_path))

            # Judging Part
            try:
                with open(global_matter.get_problem_testcase_config_json_path(submission_problem_number), 'r') as problem_testcase_config_json_file: # Get the configuration of the problem
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
                    global_matter.execute_command('{} < \"{}\" > \"{}\"'.format(submission_executable_path, testcase_input_path, testcase_output_path))
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

                    global_matter.execute_command('rm -f \"{}\"'.format(testcase_output_path))
                
                judgment_result = dict()
                if general_AC_flag == True:
                    judgment_result = {'submission_id': judgment['submission_id'], 'result': 'AC'}
                else:
                    judgment_result = {'submission_id': judgment['submission_id'], 'result': 'WA', 'reasons': reasons}

                response = judgment_result; response['type'] = 'submission_result'
                await judgment['websocket'].send(json.dumps(response)); response.clear(); 
                del judgment_result
                global_matter.execute_command('rm -f \"{}\"'.format(submission_code_path))
                global_matter.execute_command('rm -f \"{}\"'.format(submission_executable_path))
                print('Judged one.')
                await asyncio.sleep(0)
            except Exception as e:
                logging.exception(e)
                print('Problem {} is not configured correctly. Please configure it.'.format(submission_problem_number))
                
            await asyncio.sleep(0)
                
        global_matter.judgment_queue.clear()
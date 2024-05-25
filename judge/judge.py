import os, sys, json, enum, platform

import asyncio, logging, pymysql

import server


class judge_log_level(enum.Enum):
    LEVEL_INFO = 0
    LEVEL_DEBUG = 1
    LEVEL_WARNING = 2
    LEVEL_ERROR = 3


class judge:

    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads["judge"]["instance"] = self

        self.judgment_queue = []
        try:
            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database_cursor.execute(
                """
            CREATE TABLE IF NOT EXISTS judge_user_submission (
                id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
                username VARCHAR(256) NOT NULL,
                accepted INT NOT NULL,
                test_accepted INT NOT NULL,
                general INT NOT NULL
            )
            """
            )
            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database.commit()

            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database_cursor.execute(
                """
            CREATE TABLE IF NOT EXISTS judge (
                id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
                submission_id INT NOT NULL
            )
            """
            )
            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database.commit()

            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database_cursor.execute(
                """
            CREATE TABLE IF NOT EXISTS judge_submission_result (
                submission_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
                result JSON NOT NULL
            )
            """
            )
            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database.commit()

            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database_cursor.execute("SELECT submission_id FROM judge WHERE id = 1;")
            fetch_result = self.server_instance.working_loads["db_connector"][
                "instance"
            ].database_cursor.fetchone()
            if fetch_result == None:
                self.server_instance.working_loads["db_connector"][
                    "instance"
                ].database_cursor.execute(
                    "INSERT INTO judge (submission_id) VALUES (0);"
                )
                self.server_instance.working_loads["db_connector"][
                    "instance"
                ].database.commit()

                self.server_instance.working_loads["db_connector"][
                    "instance"
                ].database_cursor.execute(
                    "SELECT submission_id FROM judge WHERE id = 1;"
                )
                self.now_submission_id = self.server_instance.working_loads[
                    "db_connector"
                ]["instance"].database_cursor.fetchone()[0]
            else:
                self.now_submission_id = fetch_result[0]
        except pymysql.OperationalError:
            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database_cursor.execute("INSERT INTO judge (submission_id) VALUES (0);")
            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database.commit()
            self.server_instance.working_loads["db_connector"][
                "instance"
            ].database_cursor.execute("SELECT submission_id FROM judge WHERE id = 1;")
            self.now_submission_id = self.server_instance.working_loads["db_connector"][
                "instance"
            ].database_cursor.fetchone()[0]

        if self.now_submission_id == None:
            self.now_submission_id = 0

        self.log("Now Submission Id: {}".format(self.now_submission_id))

        self.server_instance.tasks.append(
            asyncio.create_task(self.judge_loop())
        )  # Add looped task

    def on_unload(self) -> None:
        self.server_instance.get_module_instance(
            "db_connector"
        ).database_cursor.execute(
            "UPDATE judge SET submission_id={} WHERE id = 1;".format(
                self.now_submission_id
            )
        )
        self.server_instance.get_module_instance("db_connector").database.commit()
        self.log("Judge unloaded.")

    def log(
        self,
        log: str,
        log_level: judge_log_level = judge_log_level.LEVEL_INFO,
    ):
        call_frame = sys._getframe(1)
        if log_level is judge_log_level.LEVEL_INFO:
            print(
                "\033[1;2m[JUDGE] [INFO] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is judge_log_level.LEVEL_DEBUG:
            print(
                "\033[1;34m[JUDGE] [DEBUG] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is judge_log_level.LEVEL_WARNING:
            print(
                "\033[1;33m[JUDGE] [WARNING] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is judge_log_level.LEVEL_ERROR:
            print(
                "\033[1;31m[JUDGE] [ERROR] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )

    def get_problem_testcase_config_json_path(self, problem_number):
        problem_number = str(problem_number)
        return "{}/problem/{}/problem_testcase_config.json".format(
            os.getcwd(), problem_number
        )

    def get_problem_statement_json_path(self, problem_number):
        problem_number = str(problem_number)
        return "{}/problem/{}/problem_statement.json".format(
            os.getcwd(), problem_number
        )

    def get_problem_set_json_path(self):
        if platform.system() == "Windows":
            return os.getcwd() + "\\problem\\problem_set.json"
        if platform.system() == "Linux":
            return os.getcwd() + "/problem/problem_set.json"

    def get_submission_file_name_with_absolute_path_by_submission_id(
        self, submission_id
    ):
        if platform.system() == "Windows":
            return os.getcwd() + "\\submit\\submission_" + str(submission_id)
        if platform.system() == "Linux":
            return os.getcwd() + "/submit/submission_" + str(submission_id)

    async def judge_loop(self) -> None:
        await asyncio.sleep(0)
        while True:
            await asyncio.sleep(0)
            try:
                for judgment in self.judgment_queue:
                    self.server_instance.working_loads["db_connector"][
                        "instance"
                    ].database_cursor.execute(
                        "UPDATE judge_user_submission SET general=general+1 WHERE username = {};".format(
                            judgment["username"]
                        )
                    )
                    submission_id = judgment["submission_id"]
                    submission_language = judgment["language"]
                    submission_problem_number = judgment[
                        "problem_number"
                    ]  # Problem number
                    submission_file_name = self.get_submission_file_name_with_absolute_path_by_submission_id(
                        submission_id
                    )
                    self.log(
                        "Judging Submission {} (language: {}, problem number: {}).".format(
                            submission_id,
                            submission_language,
                            submission_problem_number,
                        )
                    )

                    # Compile Part
                    exit_code = await self.server_instance.get_module_instance(
                        "compilers_manager"
                    ).compile_file_by_language_and_compile_file_path(
                        submission_language,
                        submission_file_name,
                    )
                    if exit_code == False:
                        # Delete source code
                        await self.server_instance.get_module_instance(
                            "compilers_manager"
                        ).cleanup_file_by_language_and_compile_file_path(
                            submission_language,
                            submission_file_name,
                        )

                        judgment_result = {
                            "submission_id": submission_id,
                            "result": "CE",
                            "general_score": 0,
                            "statuses": ["CE"],
                            "scores": [0],
                            "problem_number": submission_problem_number,
                        }

                        response = dict()
                        response["type"] = "submission_result"
                        response["content"] = judgment_result
                        await judgment["websocket_protocol"].send(json.dumps(response))

                        self.server_instance.working_loads["db_connector"][
                            "instance"
                        ].database_cursor.execute(
                            "INSERT INTO judge_submission_result (submission_id, result) VALUES ({}, '{}');".format(
                                submission_id, json.dumps(judgment_result)
                            )
                        )
                        self.server_instance.working_loads["db_connector"][
                            "instance"
                        ].database.commit()

                        response.clear()
                        del judgment_result
                        break

                    # Judging Part
                    try:
                        try:
                            with open(
                                self.get_problem_testcase_config_json_path(
                                    submission_problem_number
                                ),
                                "r",
                            ) as problem_testcase_config_json_file:  # Get the configuration of the problem
                                problem_testcase_config = json.load(
                                    problem_testcase_config_json_file
                                )
                                testcases = problem_testcase_config[
                                    "testcases"
                                ]  # Testcases
                        except:
                            judgment_result = {
                                "submission_id": submission_id,
                                "result": "UKE",
                                "general_score": 0,
                                "statuses": ["UKE"],
                                "scores": [0],
                                "problem_number": submission_problem_number,
                            }

                            response = dict()
                            response["content"] = judgment_result
                            response["type"] = "submission_result"
                            await judgment["websocket_protocol"].send(
                                json.dumps(response)
                            )

                            self.server_instance.working_loads["db_connector"][
                                "instance"
                            ].database_cursor.execute(
                                "INSERT INTO judge_submission_result (submission_id, result) VALUES ({}, '{}');".format(
                                    submission_id,
                                    json.dumps(judgment_result),
                                )
                            )
                            self.server_instance.working_loads["db_connector"][
                                "instance"
                            ].database.commit()

                            response.clear()
                            del judgment_result
                            break

                        general_score = 0  # General score
                        general_AC_flag = True  # General AC flag
                        statuses = []  # Statuses
                        scores = []  # Scores
                        for testcase in testcases:  # For each testcase
                            testcase_number = testcase["number"]
                            if platform.system() == "Windows":
                                testcase_input_path = (
                                    "{}\\problem\\{}\\input\\{}".format(
                                        os.getcwd(),
                                        submission_problem_number,
                                        testcase["input"],
                                    )
                                )  # Input file path
                                testcase_answer_path = (
                                    "{}\\problem\\{}\\answer\\{}".format(
                                        os.getcwd(),
                                        submission_problem_number,
                                        testcase["answer"],
                                    )
                                )  # Answer file path
                                testcase_output_path = (
                                    "{}\\problem\\{}\\output\\{}".format(
                                        os.getcwd(),
                                        submission_problem_number,
                                        "output{}.txt".format(testcase_number),
                                    )
                                )  # Output file path
                            if platform.system() == "Linux":
                                testcase_input_path = "{}/problem/{}/input/{}".format(
                                    os.getcwd(),
                                    submission_problem_number,
                                    testcase["input"],
                                )  # Input file path
                                testcase_answer_path = "{}/problem/{}/answer/{}".format(
                                    os.getcwd(),
                                    submission_problem_number,
                                    testcase["answer"],
                                )  # Answer file path
                                testcase_output_path = "{}/problem/{}/output/{}".format(
                                    os.getcwd(),
                                    submission_problem_number,
                                    "output{}.txt".format(testcase_number),
                                )  # Output file path

                            testcase_AC_flag = True
                            try:
                                await self.server_instance.get_module_instance(
                                    "global_message_queue"
                                ).execute_command(
                                    '{} < "{}" > "{}"'.format(
                                        self.server_instance.get_module_instance(
                                            "compilers_manager"
                                        ).get_execute_binary_command_by_language_and_compile_file_path(
                                            submission_language,
                                            submission_file_name,
                                        ),
                                        testcase_input_path,
                                        testcase_output_path,
                                    ),
                                    testcase["time_limit"],
                                )
                                with open(testcase_output_path, "r") as testcase_output:
                                    with open(
                                        testcase_answer_path, "r"
                                    ) as testcase_answer:
                                        testcase_output_lines = (
                                            testcase_output.readlines()
                                        )
                                        testcase_answer_lines = (
                                            testcase_answer.readlines()
                                        )
                                        if len(testcase_answer_lines) != len(
                                            testcase_output_lines
                                        ):
                                            statuses.append("WA")
                                            testcase_AC_flag = False
                                        else:
                                            for i in range(
                                                0, len(testcase_answer_lines)
                                            ):
                                                if (
                                                    testcase_answer_lines[i]
                                                    != testcase_output_lines[i]
                                                ):
                                                    statuses.append("WA")
                                                    testcase_AC_flag = False
                                                    break
                            except TimeoutError:
                                statuses.append("TLE")
                                scores.append(0)
                                testcase_AC_flag = False
                            except Exception as e:
                                logging.exception(e)

                            if testcase_AC_flag == True:
                                general_score = general_score + testcase["score"]
                                statuses.append("AC")
                                scores.append(testcase["score"])
                            else:
                                general_AC_flag = False
                                scores.append(0)

                            if platform.system() == "Linux":
                                await self.server_instance.get_module_instance(
                                    "global_message_queue"
                                ).execute_command(
                                    'rm -rf "{}"'.format(testcase_output_path)
                                )
                            if platform.system() == "Windows":
                                await self.server_instance.get_module_instance(
                                    "global_message_queue"
                                ).execute_command(
                                    'del "{}"'.format(testcase_output_path)
                                )

                        judgment_result = dict()
                        if general_AC_flag == True:
                            judgment_result = {
                                "submission_id": submission_id,
                                "result": "AC",
                                "general_score": general_score,
                                "statuses": statuses,
                                "scores": scores,
                                "problem_number": submission_problem_number,
                            }
                            self.server_instance.working_loads["db_connector"][
                                "instance"
                            ].database_cursor.execute(
                                "UPDATE judge_user_submission SET accepted=accepted+1 WHERE username = {};".format(
                                    judgment["username"]
                                )
                            )
                        else:
                            judgment_result = {
                                "submission_id": submission_id,
                                "result": "WA",
                                "general_score": general_score,
                                "statuses": statuses,
                                "scores": scores,
                                "problem_number": submission_problem_number,
                            }

                        response = dict()
                        response["type"] = "submission_result"
                        response["content"] = judgment_result
                        await judgment["websocket_protocol"].send(json.dumps(response))
                        self.server_instance.working_loads["db_connector"][
                            "instance"
                        ].database_cursor.execute(
                            "INSERT INTO judge_submission_result (submission_id, result) VALUES ({}, '{}');".format(
                                submission_id, json.dumps(judgment_result)
                            )
                        )
                        self.server_instance.working_loads["db_connector"][
                            "instance"
                        ].database.commit()
                        response.clear()
                        del judgment_result
                    except Exception as e:
                        logging.exception(e)
                        self.log(
                            "Problem {} is not configured correctly. Please configure it.".format(
                                submission_problem_number
                            ),
                            judge_log_level.LEVEL_ERROR,
                        )

                    # Clean-up Part
                    await self.server_instance.get_module_instance(
                        "compilers_manager"
                    ).cleanup_file_by_language_and_compile_file_path(
                        submission_language,
                        submission_file_name,
                    )
                    await asyncio.sleep(0)
            except Exception as e:
                logging.exception(e)

            self.judgment_queue.clear()
            await asyncio.sleep(0)

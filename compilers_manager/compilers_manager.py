import os, sys, json, enum, platform

import server


class compilers_manager_log_level(enum.Enum):
    LEVEL_INFO = 0
    LEVEL_DEBUG = 1
    LEVEL_WARNING = 2
    LEVEL_ERROR = 3


if platform.system() == "Windows":
    COMPILERS_CONFIG_JSON_PATH = (
        os.getcwd() + "\\compilers_manager\\compilers_config.json"
    )
if platform.system() == "Linux":
    COMPILERS_CONFIG_JSON_PATH = (
        os.getcwd() + "/compilers_manager/compilers_config.json"
    )


class compilers_manager:

    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads["compilers_manager"]["instance"] = self

        with open(COMPILERS_CONFIG_JSON_PATH, "r") as self.compilers_config_json_file:
            self.compilers_config = json.load(self.compilers_config_json_file)

        self.compilers_info = dict()
        for compiler_config in self.compilers_config["compilers"].values():
            self.compilers_info[compiler_config["name"]] = compiler_config

    def on_unload(self) -> None:
        self.log("Compilers Manger unloaded.")

    def log(
        self,
        log: str,
        log_level: compilers_manager_log_level = compilers_manager_log_level.LEVEL_INFO,
    ):
        call_frame = sys._getframe(1)
        if log_level is compilers_manager_log_level.LEVEL_INFO:
            print(
                "\033[1;2m[COMPILERS_MANAGER] [INFO] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is compilers_manager_log_level.LEVEL_DEBUG:
            print(
                "\033[1;34m[COMPILERS_MANAGER] [DEBUG] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is compilers_manager_log_level.LEVEL_WARNING:
            print(
                "\033[1;33m[COMPILERS_MANAGER] [WARNING] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is compilers_manager_log_level.LEVEL_ERROR:
            print(
                "\033[1;31m[COMPILERS_MANAGER] [ERROR] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )

    def get_compiler_info(self, language: str) -> list:
        if language in self.compilers_info:
            return self.compilers_info[language]
        else:
            raise NotImplementedError("Unsupported language {}.".format(language))

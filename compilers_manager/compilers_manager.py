import os, sys, json, enum, importlib, platform

import server

import compilers_manager.compilers.base_compiler


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

        self.compilers_instance = []
        for compiler_config in self.compilers_config["compilers"]:
            if compiler_config["enabled"]:
                tmp_compiler: (
                    compilers_manager.compilers.base_compiler.base_compiler
                ) = getattr(
                    getattr(
                        getattr(
                            importlib.__import__(compiler_config["path"]), "compilers"
                        ),
                        compiler_config["id"],
                    ),
                    compiler_config["id"],
                )(
                    unload_timeout=compiler_config["unload_timeout"]
                )
                setattr(tmp_compiler, "language_bind", compiler_config["language_bind"])
                self.compilers_instance.append(tmp_compiler)

    def on_unload(self) -> None:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            compiler_instance.on_unload()

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

    def get_file_path_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> str:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            if language in compiler_instance.language_bind:
                return compile_file_path + compiler_instance.get_file_extension(
                    language
                )

        raise NotImplementedError("Unsupported language {}.".format(language))

    def get_binary_path_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> str:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            if language in compiler_instance.language_bind:
                return compile_file_path + compiler_instance.get_binary_extension(
                    language
                )

        raise NotImplementedError("Unsupported language {}.".format(language))

    def get_execute_binary_command_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> str:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            if language in compiler_instance.language_bind:
                return compiler_instance.get_execute_binary_command_by_language_and_compile_file_path(
                    language, compile_file_path
                )

        raise NotImplementedError("Unsupported language {}.".format(language))

    async def compile_file_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> bool:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            if language in compiler_instance.language_bind:
                return_code = await compiler_instance.on_compile(
                    language,
                    self.get_file_path_by_language_and_compile_file_path(
                        language, compile_file_path
                    ),
                    self.get_binary_path_by_language_and_compile_file_path(
                        language, compile_file_path
                    ),
                )
                return return_code

        raise NotImplementedError("Unsupported language {}.".format(language))

    async def cleanup_file_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> bool:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            if language in compiler_instance.language_bind:
                return_code = await compiler_instance.on_cleanup(
                    language,
                    self.get_file_path_by_language_and_compile_file_path(
                        language, compile_file_path
                    ),
                    self.get_binary_path_by_language_and_compile_file_path(
                        language, compile_file_path
                    ),
                )
                return return_code

        raise NotImplementedError("Unsupported language {}.".format(language))

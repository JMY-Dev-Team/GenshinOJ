import compilers_manager.compilers.base_compiler


class LanguageNotSupportedException(Exception):
    pass


class python_compiler(compilers_manager.compilers.base_compiler.base_compiler):

    def __init__(self, unload_timeout) -> None:
        print("\033[1;2m[COMPILERS_MANAGER] [INFO] Python Compiler loaded.\033[0m")
        self.unload_timeout = unload_timeout

    def on_unload(self) -> None:
        print("\033[1;2m[COMPILERS_MANAGER] [INFO] Python Compiler unloaded.\033[0m")

    def get_file_extension(self, language: str) -> str:
        if language == "py":
            return ".py"
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_binary_extension(self, language: str) -> str:
        if language == "py":
            return ".pyc"
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_compile_command_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> list:
        if language == "py":
            return [
                "python3",
                "-c",
                r'import py_compile; py_compile.compile("'
                + compile_file_path
                + r'.py", "'
                + compile_file_path
                + r'.pyc")',
            ]
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_execute_binary_command_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> list:
        if language == "py":
            return ["python3", "{}.pyc".format(compile_file_path)]
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

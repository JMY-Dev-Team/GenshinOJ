import os

import compilers_manager.compilers.base_compiler


class LanguageNotSupportedException(Exception):
    pass


class java_compiler(compilers_manager.compilers.base_compiler.base_compiler):

    def __init__(self, unload_timeout) -> None:
        print("Java Compiler loaded.")
        __slots__ = (
            "__init__",
            "__del__",
            "on_compile",
            "on_cleanup",
            "get_file_extension",
            "get_binary_extension",
            "language_bind",
        )
        self.unload_timeout = unload_timeout

    def __del__(self) -> None:
        print("Java Compiler unloaded.")

    async def on_compile(
        self, language, compile_file_path, compile_binary_path
    ) -> bool:
        if language == "java":
            try:
                os.system("javac {}".format(compile_file_path, compile_binary_path))
            except OSError:
                pass
            except:
                return False

            if not os.path.exists(compile_binary_path):
                return False

            return True
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    async def on_cleanup(
        self, language, compile_file_path, compile_binary_path
    ) -> bool:
        if language == "java":
            try:
                os.remove(compile_file_path)
                os.remove(compile_binary_path)
            except OSError:
                pass
            except:
                return False

            if os.path.exists(compile_file_path) or os.path.exists(compile_binary_path):
                return False

            return True
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_file_extension(self, language: str) -> str:
        if language == "java":
            return ".java"
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_binary_extension(self, language: str) -> str:
        if language == "java":
            return ".javaw"
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_execute_binary_command_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> str:
        if language == "java":
            return "java {}.javaw".format(compile_file_path)
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

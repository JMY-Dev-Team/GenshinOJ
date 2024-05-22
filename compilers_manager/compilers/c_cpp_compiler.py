import os

import compilers_manager.compilers.base_compiler


class LanguageNotSupportedException(Exception):
    pass


class c_cpp_compiler(compilers_manager.compilers.base_compiler.base_compiler):

    def __init__(self, unload_timeout) -> None:
        print("C / C++ Compiler loaded.")
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
        print("C / C++ Compiler unloaded.")

    def on_compile(self, language, compile_file_path, compile_binary_path) -> bool:
        if language == "c":
            os.system("gcc {} -o {}".format(compile_file_path, compile_binary_path))
        elif language == "cpp":
            os.system("g++ {} -o {}".format(compile_file_path, compile_binary_path))
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def on_cleanup(self, language, compile_file_path, compile_binary_path) -> bool:
        if language == "c" or language == "cpp":
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
        if language == "c" or language == "cpp":
            return "." + language
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_binary_extension(self, language: str) -> str:
        if language == "c" or language == "cpp":
            return ".o"
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

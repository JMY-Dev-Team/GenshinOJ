import os

import asyncio

import compilers_manager.compilers.base_compiler


class LanguageNotSupportedException(Exception):
    pass


async def execute_command(command: str, timeout: int | float | None = None):
    proc = await asyncio.create_subprocess_shell(
        command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    try:
        async with asyncio.timeout(timeout):
            stdout, stderr = await proc.communicate()
            print(f"{command!r} exited with {proc.returncode}, pid={proc.pid}")
            return proc.returncode
    except TimeoutError:
        proc.terminate()
        raise TimeoutError
    except Exception as e:
        proc.terminate()
        raise e


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

    async def on_compile(
        self, language, compile_file_path, compile_binary_path
    ) -> bool:
        if language == "c":
            try:
                await execute_command(
                    "gcc {} -o {}".format(compile_file_path, compile_binary_path), 30
                )
            except:
                return False
        elif language == "cpp":
            try:
                await execute_command(
                    "g++ {} -o {}".format(compile_file_path, compile_binary_path), 30
                )
            except:
                return False
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

        return True

    async def on_cleanup(
        self, language, compile_file_path, compile_binary_path
    ) -> bool:
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

    def get_execute_binary_command_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> str:
        if language == "c" or language == "cpp":
            return "{}.o".format(compile_file_path)
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

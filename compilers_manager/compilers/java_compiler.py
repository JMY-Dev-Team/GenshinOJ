import os, asyncio

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


class java_compiler(compilers_manager.compilers.base_compiler.base_compiler):

    def __init__(self, unload_timeout: int) -> None:
        print("\033[1;2m[COMPILERS_MANAGER] [INFO] Java Compiler loaded.\033[0m")
        self.unload_timeout = unload_timeout

    def on_unload(self) -> None:
        print("\033[1;2m[COMPILERS_MANAGER] [INFO] Java Compiler unloaded.\033[0m")

    def get_file_extension(self, language: str) -> str:
        if language == "java":
            return ".java"
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_binary_extension(self, language: str) -> str:
        if language == "java":
            return ".class"
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_compile_command_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> list:
        if language == "java":
            return ["javac", "{}.java".format(compile_file_path)]
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_execute_binary_command_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> list:
        if language == "java":
            compile_file_name_without_extension, _ = os.path.splitext(compile_file_path)
            compile_file_name_without_extension = (
                compile_file_name_without_extension.split("/")[-1]
            )
            if compile_file_path.find("/") == -1:
                return ["java", "{}".format(compile_file_name_without_extension)]
            else:
                return [
                    "java",
                    "-classpath {}".format(os.path.dirname(compile_file_path)),
                    "{}".format(compile_file_name_without_extension),
                ]
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

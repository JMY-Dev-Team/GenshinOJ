import os, json, asyncio

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
        __slots__ = (
            "__init__",
            "on_unload",
            "on_compile",
            "on_cleanup",
            "get_file_extension",
            "get_binary_extension",
            "language_bind",
        )
        self.unload_timeout = unload_timeout

    def on_unload(self) -> None:
        print("\033[1;2m[COMPILERS_MANAGER] [INFO] Java Compiler unloaded.\033[0m")

    async def on_compile(
        self, language: str, compile_file_path: str, compile_binary_path: str
    ) -> bool:
        if language == "java":
            try:
                compile_file_name_without_extension, _ = os.path.splitext(
                    compile_file_path
                )
                compile_file_name_without_extension = (
                    compile_file_name_without_extension.split("/")[-1]
                )
                print(compile_file_path, compile_file_name_without_extension)
                with open(compile_file_path, "a+") as compile_file:
                    compile_file.writelines(
                        [
                            "\n",
                            "public class "
                            + compile_file_name_without_extension
                            + "{\n",
                            "    public static void main(String[] args) {\n",
                            "        new MyJavaSourceCode();\n",
                            "    }\n",
                            "}\n",
                        ]
                    )
                    compile_file.flush()

                exit_code = await execute_command("javac {}".format(compile_file_path))
                return exit_code == 0 and os.path.exists(compile_binary_path)
            except:
                return False
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    async def on_cleanup(
        self, language: str, compile_file_path: str, compile_binary_path: str
    ) -> bool:
        if language == "java":
            try:
                os.remove(compile_file_path)
                os.remove(compile_binary_path)
                os.remove(
                    os.path.dirname(compile_file_path) + "/MyJavaSourceCode.class"
                )
                pass
            except:
                return False

            return not (
                os.path.exists(compile_file_path)
                or os.path.exists(compile_binary_path)
                or os.path.exists(
                    os.path.dirname(compile_file_path) + "/MyJavaSourceCode.class"
                )
            )
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
            return ".class"
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

    def get_execute_binary_command_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> str:
        if language == "java":
            compile_file_name_without_extension, _ = os.path.splitext(compile_file_path)
            compile_file_name_without_extension = (
                compile_file_name_without_extension.split("/")[-1]
            )
            return "java -classpath {} {}".format(
                os.path.dirname(compile_file_path),
                compile_file_name_without_extension,
            )
        else:
            raise LanguageNotSupportedException(
                "The language {} is not supported.".format(language)
            )

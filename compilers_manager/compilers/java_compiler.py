import os

import compilers_manager.compilers.base_compiler

#TODO(JMY): Add Java support


class LanguageNotSupportedException(Exception):
    pass


class java_compiler(compilers_manager.compilers.base_compiler.base_compiler):

    def __init__(self, unload_timeout) -> None:
        print('Java Compiler loaded.')
        self.unload_timeout = unload_timeout

    def __del__(self) -> None:
        print('Java Compiler unloaded.')

    def on_compile(self, language, compile_file_path,
                   compile_binary_path) -> bool:
        if language == 'java':
            try:
                os.system('javac {}'.format(compile_file_path,
                                            compile_binary_path))
            except OSError:
                pass
            except:
                return False

            if not os.path.exists(compile_binary_path):
                return False

            return True
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

    def on_cleanup(self, language, compile_file_path,
                   compile_binary_path) -> bool:
        if language == 'c' or language == 'cpp':
            try:
                os.remove(compile_file_path)
                os.remove(compile_binary_path)
            except OSError:
                pass
            except:
                return False

            if os.path.exists(compile_file_path) or os.path.exists(
                    compile_binary_path):
                return False

            return True
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

    def get_file_appendix(self, language: str) -> str:
        if language == 'java':
            return language
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

    def get_binary_appendix(self, language: str) -> str:
        if language == 'java':
            return 'o'
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

    def get_compile_file_command(self, filename: str, language: str) -> str:
        if language == 'java':
            return 'gcc {}.cpp -o {}.o'.format(filename, filename)
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

    def get_binary_execute_command(self, filename: str, language: str) -> str:
        if language == 'java':
            return filename
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

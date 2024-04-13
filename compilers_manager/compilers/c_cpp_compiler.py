import os, platform

import compilers_manager.compilers.base_compiler


class LanguageNotSupportedException(Exception):
    pass


class c_cpp_compiler(compilers_manager.compilers.base_compiler.base_compiler):

    def __init__(self, unload_timeout) -> None:
        print('C / C++ Compiler loaded.')
        __slots__ = ('__init__', '__del__', 'on_compile', 'on_cleanup',
                     'get_file_appendix', 'get_binary_appendix',
                     'language_bind')
        self.unload_timeout = unload_timeout

    def __del__(self) -> None:
        print('C / C++ Compiler unloaded.')

    def on_compile(self, language, compile_file_path,
                   compile_binary_path) -> bool:
        if language == 'c' or language == 'cpp':
            try:
                os.system('gcc {} -o {}'.format(compile_file_path,
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
        if language == 'c' or language == 'cpp':
            return '.' + language
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

    def get_binary_appendix(self, language: str) -> str:
        if language == 'c' or language == 'cpp':
            return '.o'
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

    def get_compile_file_command(self, filename: str, language: str) -> str:
        if language == 'c':
            if platform.system() == 'Windows':
                return 'gcc {}\\submit\\{}.cpp -o {}\\submit\\{}.o'.format(
                    os.getcwd(), filename, os.getcwd(), filename)
            if platform.system() == 'Linux':
                return 'gcc {}/submit/{}.cpp -o {}/submit/{}.o'.format(
                    os.getcwd(), filename, os.getcwd(), filename)
        if language == 'cpp':
            if platform.system() == 'Windows':
                return 'g++ {}\\submit\\{}.cpp -o {}\\submit\\{}.o'.format(
                    os.getcwd(), filename, os.getcwd(), filename)
            if platform.system() == 'Linux':
                return 'g++ {}/submit/{}.cpp -o {}/submit/{}.o'.format(
                    os.getcwd(), filename, os.getcwd(), filename)
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

    def get_binary_execute_command(self, filename: str, language: str) -> str:
        if language == 'c' or language == 'cpp':
            if platform.system() == 'Windows':
                return os.getcwd() + '\\submit\\' + filename + '.o'
            if platform.system() == 'Linux':
                return os.getcwd() + '/submit/' + filename + '.o'
        else:
            raise LanguageNotSupportedException(
                'The language {} is not supported.'.format(language))

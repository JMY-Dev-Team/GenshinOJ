import os, gc, sys, json, importlib, platform

import server

import compilers_manager.compilers.base_compiler

# gc.disable()

if platform.system() == 'Windows':
    COMPILERS_CONFIG_JSON_PATH = os.getcwd(
    ) + '\\compilers_manager\\compilers_config.json'
if platform.system() == 'Linux':
    COMPILERS_CONFIG_JSON_PATH = os.getcwd(
    ) + '/compilers_manager/compilers_config.json'


class compilers_manager:

    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads['compilers_manager'][
            'instance'] = self

        with open(COMPILERS_CONFIG_JSON_PATH,
                  'r') as self.compilers_config_json_file:
            self.compilers_config = json.load(self.compilers_config_json_file)

        self.compilers_instance = []
        for compiler_config in self.compilers_config['compilers']:
            if compiler_config['enabled']:
                tmp_compiler: compilers_manager.compilers.base_compiler.base_compiler = getattr(
                    getattr(
                        getattr(importlib.__import__(compiler_config['path']),
                                'compilers'), compiler_config['id']),
                    compiler_config['id'])(
                        unload_timeout=compiler_config['unload_timeout'])
                setattr(tmp_compiler, 'language_bind',
                        compiler_config['language_bind'])
                self.compilers_instance.append(tmp_compiler)

    def __del__(self) -> None:
        print('Compilers Manger unloaded.')

    def get_file_path_by_filename_and_language(self, filename: str,
                                               language: str) -> str:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            if language in compiler_instance.language_bind:
                if platform.system() == 'Windows':
                    return os.getcwd(
                    ) + '\\submit\\' + filename + compiler_instance.get_file_appendix(
                        language)
                if platform.system() == 'Linux':
                    return os.getcwd(
                    ) + '/submit/' + filename + compiler_instance.get_file_appendix(
                        language)

        raise NotImplementedError('Unsupported language.')

    def get_binary_path_by_filename_and_language(self, filename: str,
                                                 language: str) -> str:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            if language in compiler_instance.language_bind:
                if platform.system() == 'Windows':
                    return os.getcwd() + '\\submit\\' + filename + '.o'
                if platform.system() == 'Linux':
                    return os.getcwd() + '/submit/' + filename + '.o'

        raise NotImplementedError('Unsupported language.')

    def get_compile_file_command_by_filename_and_language(
            self, filename: str, language: str) -> str:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            if language in compiler_instance.language_bind:
                return compiler_instance.get_compile_file_command(
                    filename, language)

        raise NotImplementedError('Unsupported language.')

    def get_binary_execute_command_by_filename_and_language(
            self, filename: str, language: str) -> str:
        compiler_instance: compilers_manager.compilers.base_compiler.base_compiler
        for compiler_instance in self.compilers_instance:
            if language in compiler_instance.language_bind:
                return compiler_instance.get_binary_execute_command(
                    filename, language)

        raise NotImplementedError('Unsupported language.')
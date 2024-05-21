import abc


class base_compiler:

    @abc.abstractmethod
    def __init__(self, unload_timeout) -> None:
        self.unload_timeout = unload_timeout

    @abc.abstractmethod
    def __del__(self) -> None:
        pass

    @abc.abstractmethod
    def on_compile(self, language, compile_file_path, compile_binary_path) -> bool:
        pass

    @abc.abstractmethod
    def on_cleanup(self, language, compile_file_path, compile_binary_path) -> bool:
        pass

    @abc.abstractmethod
    def get_file_appendix(self, language: str) -> str:
        pass

    @abc.abstractmethod
    def get_binary_appendix(self, language: str) -> str:
        pass

    @abc.abstractmethod
    def get_compile_file_command(self, filename: str, language: str) -> str:
        pass

    @abc.abstractmethod
    def get_binary_execute_command(self, filename: str, language: str) -> str:
        pass

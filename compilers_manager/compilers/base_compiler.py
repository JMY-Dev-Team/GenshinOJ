import abc


class base_compiler:

    @abc.abstractmethod
    def __init__(self, unload_timeout) -> None:
        self.unload_timeout = unload_timeout

    @abc.abstractmethod
    def on_unload(self) -> None:
        pass

    @abc.abstractmethod
    async def on_compile(
        self, language, compile_file_path, compile_binary_path
    ) -> bool:
        pass

    @abc.abstractmethod
    async def on_cleanup(
        self, language, compile_file_path, compile_binary_path
    ) -> bool:
        pass

    @abc.abstractmethod
    def get_file_extension(self, language: str) -> str:
        pass

    @abc.abstractmethod
    def get_binary_extension(self, language: str) -> str:
        pass

    @abc.abstractmethod
    def get_compile_file_command(self, filename: str, language: str) -> str:
        pass

    @abc.abstractmethod
    def get_execute_binary_command_by_language_and_compile_file_path(
        self, language: str, compile_file_path: str
    ) -> str:
        pass

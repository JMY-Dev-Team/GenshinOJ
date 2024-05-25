import os, sys, enum

try:
    import asyncio
except:
    print("Installing dependencies...")
    os.system("pip install asyncio")
    try:
        import asyncio
    except:
        print("Dependencies installation failed.")
        sys.exit(-1)

import server


class global_message_queue_log_level(enum.Enum):
    LEVEL_INFO = 0
    LEVEL_DEBUG = 1
    LEVEL_WARNING = 2
    LEVEL_ERROR = 3


class global_message_queue:
    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads["global_message_queue"]["instance"] = self

        self.message_queue = dict()

    def on_unload(self) -> None:
        self.log("Global Message Queue unloaded.")

    def log(
        self,
        log: str,
        log_level: global_message_queue_log_level = global_message_queue_log_level.LEVEL_INFO,
    ):
        call_frame = sys._getframe(1)
        if log_level is global_message_queue_log_level.LEVEL_INFO:
            print(
                "\033[1;2m[GLOBAL_MSG_QUEUE] [INFO] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is global_message_queue_log_level.LEVEL_DEBUG:
            print(
                "\033[1;34m[GLOBAL_MSG_QUEUE] [DEBUG] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is global_message_queue_log_level.LEVEL_WARNING:
            print(
                "\033[1;33m[GLOBAL_MSG_QUEUE] [WARNING] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is global_message_queue_log_level.LEVEL_ERROR:
            print(
                "\033[1;31m[GLOBAL_MSG_QUEUE] [ERROR] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )

    def get_message_of(self, module_id: str) -> list:
        return self.message_queue[module_id]

    def push_message(self, to_module_id: str, message: dict) -> bool:
        self.message_queue[to_module_id].append(message)

    async def execute_command(self, command: str, timeout: float | None = None):
        proc = await asyncio.create_subprocess_shell(
            command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        try:
            async with asyncio.timeout(timeout):
                stdout, stderr = await proc.communicate()
                self.log(
                    f"{command!r} exited with {proc.returncode}, pid={proc.pid}",
                    global_message_queue_log_level.LEVEL_DEBUG,
                )
                return proc.returncode
        except TimeoutError:
            proc.terminate()
            raise TimeoutError
        except Exception as e:
            proc.terminate()
            raise e

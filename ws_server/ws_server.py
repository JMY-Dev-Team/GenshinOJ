import os, sys, abc, json, enum, importlib

try:
    import asyncio, websockets.server
except:
    print("Installing dependencies...")
    os.system("pip install asyncio nest-asyncio websockets")
    try:
        import asyncio, websockets.server
    except ImportError:
        print("Dependencies installation failed.")
        sys.exit(-1)

import server


WS_SERVER_CONFIG_JSON_PATH = os.getcwd() + "/ws_server/ws_server_config.json"


class ws_server_log_level(enum.Enum):
    LEVEL_INFO = 0
    LEVEL_DEBUG = 1
    LEVEL_WARNING = 2
    LEVEL_ERROR = 3


class ws_server:

    def __init__(
        self, server_instance: server.server, server_host="0.0.0.0", server_port=9982
    ) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads["ws_server"]["instance"] = self

        self.sessions = dict()
        with open(WS_SERVER_CONFIG_JSON_PATH, "r") as ws_server_config_json_file:
            self.ws_server_config = json.load(ws_server_config_json_file)

        self.ws_server_applications_config = self.ws_server_config[
            "ws_server_applications"
        ]
        self.ws_server_applications: list[ws_server_application_protocol] = []
        for ws_server_application_config in self.ws_server_applications_config:
            if ws_server_application_config["enabled"]:
                self.ws_server_applications.append(
                    getattr(
                        getattr(
                            getattr(
                                importlib.__import__(
                                    ws_server_application_config["path"]
                                ),
                                "ws_server_applications",
                            ),
                            ws_server_application_config["id"],
                        ),
                        ws_server_application_config["id"],
                    )(self)
                )

        self.ws_server = websockets.server.serve(
            self.receive, server_host, server_port, max_size=None
        )
        self.server_instance.tasks.append(self.ws_server)

    def on_unload(self) -> None:
        self.log("Websocket Server unloaded.")

    def log(
        self,
        log: str,
        log_level: ws_server_log_level = ws_server_log_level.LEVEL_INFO,
    ):
        """
        Logging method
        Args:
            log (str): Log information
            log_level (ws_server_application_protocol_log_level): Logging level
        Info:
            It is suggested that you should override this method to distinguish between the official application and yours.
        """
        call_frame = sys._getframe(1)
        if log_level is ws_server_log_level.LEVEL_INFO:
            print(
                "\033[1;2m[WS_SERVER] [INFO] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is ws_server_log_level.LEVEL_DEBUG:
            print(
                "\033[1;34m[WS_SERVER] [DEBUG] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is ws_server_log_level.LEVEL_WARNING:
            print(
                "\033[1;33m[WS_SERVER] [WARNING] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is ws_server_log_level.LEVEL_ERROR:
            print(
                "\033[1;31m[WS_SERVER] [ERROR] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )

    async def receive(
        self, websocket_protocol: websockets.server.WebSocketServerProtocol
    ):
        try:
            async for original_message in websocket_protocol:
                message = json.loads(original_message)
                if len(original_message) <= 500:
                    self.log(message, ws_server_log_level.LEVEL_DEBUG)
                else:
                    self.log("TL; DR", ws_server_log_level.LEVEL_DEBUG)

                try:
                    for ws_server_application in self.ws_server_applications:
                        try:
                            await getattr(
                                ws_server_application, format("on_" + message["type"])
                            )(websocket_protocol, message["content"])
                            await asyncio.sleep(0)
                        except AttributeError as e:
                            pass
                        except Exception as e:
                            raise e
                except Exception as e:
                    raise e

            await asyncio.sleep(0)
        except Exception as e:
            if (
                type(e) is not websockets.exceptions.ConnectionClosedOK
                and type(e) is not websockets.exceptions.ConnectionClosedError
            ):
                raise e

            for ws_server_application in self.ws_server_applications:
                try:
                    await ws_server_application.on_close_connection(websocket_protocol)
                    await asyncio.sleep(0)
                except AttributeError as e:
                    self.log(
                        "`on_close_connection` callback not found. Maybe you haven't implemented it yet?",
                        ws_server_log_level.LEVEL_ERROR,
                    )
                    raise e
                except Exception as e:
                    raise e

            await websocket_protocol.close()
            return

        try:
            while True:
                await websocket_protocol.recv()
                await asyncio.sleep(0)

        except websockets.exceptions.ConnectionClosed:
            try:
                for ws_server_application in self.ws_server_applications:
                    try:
                        await ws_server_application.on_close_connection(
                            websocket_protocol
                        )
                        await asyncio.sleep(0)
                    except AttributeError as e:
                        self.log(
                            "`on_close_connection` callback not found. Maybe you haven't implemented it yet?",
                            ws_server_log_level.LEVEL_ERROR,
                        )
                        raise e
                    except Exception as e:
                        raise e
            except Exception as e:
                raise e

            await websocket_protocol.close()
        except Exception as e:
            raise e


class ws_server_application_protocol_log_level(enum.Enum):
    LEVEL_INFO = 0
    LEVEL_DEBUG = 1
    LEVEL_WARNING = 2
    LEVEL_ERROR = 3


class ws_server_application_protocol:
    """
    Base class for any implementations of additional websocket server applications
    """

    @abc.abstractmethod
    def __init__(self, ws_server_instance: ws_server) -> None:
        self.ws_server_instance: ws_server = ws_server_instance

    @abc.abstractmethod
    def log(
        self,
        log: str,
        log_level: ws_server_application_protocol_log_level = ws_server_application_protocol_log_level.LEVEL_INFO,
    ):
        """
        Logging method
        Args:
            log (str): Log information
            log_level (ws_server_application_protocol_log_level): Logging level
        Info:
            It is suggested that you should override this method to distinguish between the official application and yours.
        """
        call_frame = sys._getframe(1)
        if log_level is ws_server_application_protocol_log_level.LEVEL_INFO:
            print(
                "\033[1;2m[WS_SERVER] [UNKNOWN_WS_SERVER_APP] [INFO] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is ws_server_application_protocol_log_level.LEVEL_DEBUG:
            print(
                "\033[1;34m[WS_SERVER] [UNKNOWN_WS_SERVER_APP] [DEBUG] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is ws_server_application_protocol_log_level.LEVEL_WARNING:
            print(
                "\033[1;33m[WS_SERVER] [UNKNOWN_WS_SERVER_APP] [WARNING] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is ws_server_application_protocol_log_level.LEVEL_ERROR:
            print(
                "\033[1;31m[WS_SERVER] [UNKNOWN_WS_SERVER_APP] [ERROR] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )

    @abc.abstractmethod
    async def on_close_connection(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol,
    ):
        """
        Callback method `on_close_connection`
        Info:
            You need to implement this method to do the specific actions you want whenever a connection is being closed.
        """
        self.log(
            "Closed connection from {}:{}".format(
                websocket_protocol.remote_address[0],
                websocket_protocol.remote_address[1],
            )
        )
        await websocket_protocol.close()

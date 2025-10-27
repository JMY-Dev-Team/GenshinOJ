import sys, enum, json, logging

import asyncio, websockets

import server


class chat_server_log_level(enum.Enum):
    LEVEL_INFO = 0
    LEVEL_DEBUG = 1
    LEVEL_WARNING = 2
    LEVEL_ERROR = 3


class chat_server:
    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads["chat_server"]["instance"] = self

        self.message_box = dict()

        self.server_instance.tasks.append(asyncio.create_task(self.chat_server_main()))

    def on_unload(self) -> None:
        self.log("Chat Server unloaded.")

    def log(
        self,
        log: str,
        log_level: chat_server_log_level = chat_server_log_level.LEVEL_INFO,
    ):
        call_frame = sys._getframe(1)
        if log_level is chat_server_log_level.LEVEL_INFO:
            print(
                "\033[1;2m[GLOBAL_MSG_QUEUE] [INFO] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is chat_server_log_level.LEVEL_DEBUG:
            print(
                "\033[1;34m[GLOBAL_MSG_QUEUE] [DEBUG] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is chat_server_log_level.LEVEL_WARNING:
            print(
                "\033[1;33m[GLOBAL_MSG_QUEUE] [WARNING] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is chat_server_log_level.LEVEL_ERROR:
            print(
                "\033[1;31m[GLOBAL_MSG_QUEUE] [ERROR] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )

    async def chat_server_main(self):
        while True:
            for chat_server_user_to in list(self.message_box.keys()):
                try:
                    if len(self.message_box[chat_server_user_to]["message_queue"]) > 0:
                        print(
                            "Processing user {}'s message.".format(chat_server_user_to)
                        )

                    for chat_messages in self.message_box[chat_server_user_to][
                        "message_queue"
                    ]:
                        try:
                            response = {
                                "type": "chat_message",
                                "from": chat_messages["from"],
                                "content": chat_messages["messages"],
                            }
                            await self.message_box[chat_server_user_to][
                                "websocket_protocol"
                            ].send(json.dumps(response))
                        except websockets.exceptions.ConnectionClosed:
                            logging.warning(
                                "[ConnectionClosed] The user {} have been offline already.".format(
                                    chat_server_user_to
                                )
                            )
                            del self.message_box[chat_server_user_to]
                        except KeyError:
                            logging.warning(
                                "[KeyError] The user {} have been offline already.".format(
                                    chat_server_user_to
                                )
                            )
                        except Exception as e:
                            raise e

                    try:
                        self.message_box[chat_server_user_to]["message_queue"].clear()
                    except KeyError:
                        logging.warning(
                            "[KeyError] The user {} have been offline already.".format(
                                chat_server_user_to
                            )
                        )
                except KeyError:
                    logging.warning(
                        "[KeyError] The user {} have been offline already.".format(
                            chat_server_user_to
                        )
                    )
                except websockets.exceptions.ConnectionClosed:
                    logging.warning(
                        "[ConnectionClosed] The user {} have been offline already.".format(
                            chat_server_user_to
                        )
                    )
                    del self.message_box[chat_server_user_to]

            await asyncio.sleep(0)

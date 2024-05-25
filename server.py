import os, sys, json, enum, typing, importlib, logging

try:
    import asyncio
except:
    print("Installing dependencies...")
    os.system("pip install asyncio nest-asyncio")
    try:
        import asyncio
    except ImportError:
        print("Dependencies installation failed.")
        sys.exit(-1)


class server_log_level(enum.Enum):
    LEVEL_INFO = 0
    LEVEL_DEBUG = 1
    LEVEL_WARNING = 2
    LEVEL_ERROR = 3


class server:

    def __init__(self) -> None:
        self.working_loads: dict = dict()
        self.working_loads_status: dict = dict()
        self.working_loads_supported_working_loads: dict = dict()
        self.MODULE_CONFIG_JSON_PATH: str = os.getcwd() + "/module_config.json"
        self.tasks: list = []
        # asyncio.get_event_loop_policy().get_event_loop().set_debug(True)
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            asyncio.get_event_loop().run_until_complete(self.async_main())
        except KeyboardInterrupt:
            for working_load_config in list(self.working_loads_config.values()):
                working_load_id = working_load_config["id"]
                try:
                    if working_load_id in self.working_loads:
                        self.log(
                            "Unloading working load `{}`...".format(working_load_id),
                            server_log_level.LEVEL_DEBUG,
                        )
                        asyncio.get_event_loop().run_until_complete(
                            self.working_load_unloader(working_load_config)
                        )
                        if working_load_id in self.working_loads:
                            del self.working_loads[working_load_id]
                except Exception as e:
                    self.log(
                        "Failed to unload working load `{}`".format(working_load_id),
                        server_log_level.LEVEL_ERROR,
                    )
                    logging.exception(e)

            self.on_unload()

    def on_unload(self) -> None:
        self.log("Server stopped.", server_log_level.LEVEL_WARNING)

    def log(self, log: str, log_level: server_log_level = server_log_level.LEVEL_INFO):
        call_frame = sys._getframe(1)
        if log_level is server_log_level.LEVEL_INFO:
            print(
                "\033[1;2m[SERVER] [INFO] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is server_log_level.LEVEL_DEBUG:
            print(
                "\033[1;34m[SERVER] [DEBUG] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is server_log_level.LEVEL_WARNING:
            print(
                "\033[1;33m[SERVER] [WARNING] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )
        if log_level is server_log_level.LEVEL_ERROR:
            print(
                "\033[1;31m[SERVER] [ERROR] {} (file `{}`, function `{}` on line {})\033[0m".format(
                    log,
                    call_frame.f_code.co_filename,
                    call_frame.f_code.co_name,
                    call_frame.f_lineno,
                )
            )

    async def working_load_loader(self, working_load_config):
        if working_load_config["enabled"]:
            self.log(
                "Loading {} (id: {})...".format(
                    working_load_config["name"], working_load_config["id"]
                )
            )
            dependencies_satisfied_flag = True
            dependency: str
            for dependency in working_load_config["dependencies"]:
                self.log("Checking dependency: {}".format(dependency))
                if not dependency in self.working_loads:
                    if self.working_loads_status[dependency]:
                        dependencies_satisfied_flag = False
                        break
                    else:
                        await self.working_load_loader(
                            self.working_loads_config[dependency]
                        )
                        if self.working_loads_status[dependency]:
                            dependencies_satisfied_flag = False
                            break

                self.working_loads_supported_working_loads[dependency].append(
                    working_load_config["id"]
                )

            if not dependencies_satisfied_flag:
                self.working_loads_status[working_load_config["id"]] = True
                self.log(
                    "Module {} (id: {}) do not have all its dependencies, so it will be ignored.".format(
                        working_load_config["name"], working_load_config["id"]
                    ),
                    server_log_level.LEVEL_WARNING,
                )
            else:
                self.working_loads_status[working_load_config["id"]] = True
                self.log(
                    "Loaded {} (id: {}).".format(
                        working_load_config["name"], working_load_config["id"]
                    )
                )
                self.working_loads[working_load_config["id"]] = working_load_config
                getattr(
                    getattr(
                        importlib.__import__(working_load_config["path"]),
                        working_load_config["id"],
                    ),
                    working_load_config["id"],
                )(self)

    async def working_load_unloader(self, working_load_config):
        working_load_to_unload: str
        if working_load_config["id"] in self.working_loads:
            for working_load_to_unload in self.working_loads_supported_working_loads[
                working_load_config["id"]
            ]:
                if working_load_to_unload in self.working_loads:
                    self.log(
                        "Unloading working load `{}`...".format(working_load_to_unload),
                        server_log_level.LEVEL_DEBUG,
                    )
                    await self.working_load_unloader(
                        self.working_loads_config[working_load_to_unload]
                    )

                    del self.working_loads[working_load_to_unload]

            self.working_loads[working_load_config["id"]]["instance"].on_unload()

    async def async_main(self):
        self.log("Server started.")
        with open(self.MODULE_CONFIG_JSON_PATH, "r") as self.module_config_json_file:
            self.module_config = json.load(self.module_config_json_file)

        self.working_loads_config = self.module_config["working_load"]
        self.working_loads_config: dict
        for working_load_config in list(self.working_loads_config.values()):
            self.working_loads_status[working_load_config["id"]] = False

        for working_load_config in list(self.working_loads_config.values()):
            self.working_loads_supported_working_loads[working_load_config["id"]] = []

        for working_load_config in list(self.working_loads_config.values()):
            await self.working_load_loader(working_load_config)

        await asyncio.gather(*tuple(self.tasks))
        asyncio.get_event_loop().run_forever()

    def get_module_instance(self, module_id: str) -> typing.Any:
        return self.working_loads[module_id]["instance"]


if __name__ == "__main__":  # Main
    server()

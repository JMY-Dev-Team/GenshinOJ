import gc, os, sys, json, importlib

gc.disable()

try:
    import pymysql, asyncio, nest_asyncio, websockets
except:
    os.system('pip3 install pymysql asyncio nest_asyncio websockets')
    import pymysql, asyncio, websockets

nest_asyncio.apply()

class server:
    def __init__(self):
        asyncio.get_event_loop_policy().get_event_loop().set_debug(True)
        self.working_loads = dict()
        self.module_config_json_path = os.getcwd() + '/module_config.json'
        asyncio.run(self.async_main())

    async def async_main(self):
        print('Server started.')
        with open(self.module_config_json_path, 'r') as self.module_config_json_file:
            self.module_config = json.load(self.module_config_json_file)
        
        self.working_load_config = self.module_config['working_load']
        for working_load_item in self.working_load_config:
            if working_load_item['enabled']:
                print('Loading {} (id: {})...'.format(working_load_item['name'], working_load_item['id']))
                dependencies_satisfied_flag = True
                for dependency in working_load_item['dependencies']:
                    print('Checking dependency: {}'.format(dependency))
                    # print(self.working_loads[dependency])
                    if not dependency in self.working_loads:
                        dependencies_satisfied_flag = False
                        break
                
                if not dependencies_satisfied_flag:
                    print('Module {} (id: {}) do not have all its dependencies, so it will be ignored.'.format(working_load_item['name'], working_load_item['id']))
                    continue
                
                # self.get_module_instance('global_message_queue')
                print('Loaded {} (id: {}).'.format(working_load_item['name'], working_load_item['id']))
                self.working_loads[working_load_item['id']] = working_load_item
                self.working_loads[working_load_item['id']]['instance'] = getattr(getattr(importlib.__import__(working_load_item['path']), working_load_item['id']), working_load_item['id'])(self)
        
        print('Now working loads: {}'.format(self.working_loads))
        asyncio.get_event_loop().run_forever()

    async def awaitable_to_coroutine(self, awaitable):
        await awaitable

    async def add_task_to_event_loop(self, task: asyncio.Task):
        main_loop = asyncio.get_event_loop()
        main_loop.run_until_complete(self.async_main())
        
    def get_module_instance(self, module_id: str):
        return self.working_loads[module_id]['instance']

if __name__ == '__main__': # Main
    __server_instance = server()
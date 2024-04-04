import os, sys, json, importlib

try:
    import pymysql, asyncio, websockets
except:
    os.system('pip3 install pymysql asyncio websockets')
    import pymysql, asyncio, websockets

module_config_json_path = os.getcwd() + '/module_config.json'
working_loads = dict()

def get_module_instance(module_id):
    return working_loads[module_id]['instance']

if __name__ == '__main__': # Main
    policy = asyncio.get_event_loop_policy()
    policy.get_event_loop().set_debug(True)
    print('Server started.')
    with open(module_config_json_path, 'r') as module_config_json_file:
        module_config = json.load(module_config_json_file)
    
    working_load_config = module_config['working_load']
    for working_load_item in working_load_config:
        if working_load_item['enabled']:
            print('Loading {} (id: {}) from path: {}...'.format(working_load_item['name'], working_load_item['id'], working_load_item['path']))
            working_loads[working_load_item['id']] = working_load_item
            working_loads[working_load_item['id']]['instance'] = getattr(getattr(importlib.__import__(working_load_item['path']), working_load_item['id']), working_load_item['id'])()
    
    # asyncio.get_event_loop().run_until_complete(asyncio.wait([]))
    # asyncio.get_event_loop().run_forever()
import os, sys, json, platform, threading

try:
    import numpy, asyncio, logging, soundfile, websockets
except ImportError:
    print('Installing dependencies...')
    if platform.system() == 'Windows':
        os.system('pip install numpy asyncio logging soundfile websockets')
    if platform.system() == 'Linux':
        os.system('sudo pip3 numpy install asyncio logging soundfile websockets')

import server

CHUNK = 1024

event = threading.Event()

PLAYLIST_JSON_PATH: str = ''

if platform.system() == 'Windows':
    PLAYLIST_JSON_PATH = os.getcwd() + '\\music_player_server\\playlist.json'
if platform.system() == 'Linux':
    PLAYLIST_JSON_PATH = os.getcwd() + '/music_player_server/playlist.json'

class music_player_server:
    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads['music_player_server']['instance'] = self

        # logic
        self.playing_users: dict[dict] = dict()
        with open(PLAYLIST_JSON_PATH, 'r') as self.playlist_json_file:
            self.playlist_json = json.load(self.playlist_json_file)
            self.playlist = self.playlist_json['playlist']
        
        self.server_instance.tasks.append(
            asyncio.create_task(self.music_player_server_loop()))  # Add looped task

    def __del__(self) -> None:
        print('Music Player Server unloaded.')

    async def music_player_server_loop(self) -> None:
        response = dict()
        while True:
            await asyncio.sleep(0)
            for playing_music in self.playlist:
                if platform.system() == 'Windows':
                    playing_music_filepath = os.getcwd() + '\\music_player_server\\music\\' + playing_music['filename']
                if platform.system() == 'Linux':
                    playing_music_filepath = os.getcwd() + '/music_player_server/music/' + playing_music['filename']
                
                playing_music_file_numpy_array, playing_music_file_samplerate = soundfile.read(playing_music_filepath)
                print('Now playing: {}'.format(playing_music['name']))
                for playing_user in self.playing_users.values():
                    if not playing_user['already_playing']:
                        response = {
                            'type': 'music_stream_head',
                            'content': {
                                'name': playing_music['name'],
                                'authors': playing_music['authors'],
                                'samplerate': playing_music_file_samplerate,
                            }
                        }
                    else:
                        response = {
                            'type': 'music_stream',
                            'content': {
                                'name': playing_music['name'],
                                'authors': playing_music['authors'],
                                'streamed_data': playing_music_file_numpy_array.tolist()
                            }
                        }
                    
                    try:
                        await playing_user['websocket_protocol'].send(json.dumps(response))
                        playing_user['already_playing'] = True
                    except websockets.exceptions.ConnectionClosedOK:
                        pass
                    except:
                        raise
                    
                    response.clear()
                    await asyncio.sleep(0)
                    
                await asyncio.sleep(0)
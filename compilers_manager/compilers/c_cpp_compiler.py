import os

class c_cpp_compiler:
    def __init__(self, unload_timeout) -> None:
        print('C / C++ Compiler loaded.')
        self.unload_timeout = unload_timeout

    def __del__(self) -> None:
        print('C / C++ Compiler unloaded.')

    def on_compile(self, compile_file_path, compile_binary_path) -> bool:
        try:
            os.system('gcc {} -o {}'.format(compile_file_path, compile_binary_path))
        except OSError:
            pass
        except:
            return False
        
        if not os.path.exists(compile_binary_path):
            return False
        
        return True
    
    def on_cleanup(self, compile_file_path, compile_binary_path) -> bool:
        try:
            os.remove(compile_file_path)
            os.remove(compile_binary_path)
        except OSError:
            pass
        except:
            return False
        
        if os.path.exists(compile_file_path) or os.path.exists(compile_binary_path):
            return False
        
        return True
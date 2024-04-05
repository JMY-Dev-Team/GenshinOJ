import gc

import server

# gc.disable()

class compilers_manager:
    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads['compilers_manager']['instance'] = self
    
    def get_submission_code_path(self, submission_id, submission_language):
        pass
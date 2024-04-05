class compilers_manager:
    def __init__(self, server_instance) -> None:
        self.server_instance = server_instance
    
    def get_submission_code_path(self, submission_id, submission_language):
        
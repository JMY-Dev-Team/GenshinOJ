SERVER_HOST = '0.0.0.0'
SERVER_PORT = 9982

class db_connector:
    def __init__(self, connection):
        
    
    def DatabaseConnection(DATABASE_USER = 'root', DATABASE_PASSWORD = '123456', DATABASE_PORT = 3306): # Database Connection
        global database, database_cursor
        try: # Connect to database
            database = pymysql.connect(host = 'localhost', user = DATABASE_USER, passwd = DATABASE_PASSWORD, port = DATABASE_PORT, database = 'GenshinOJ')
            print('连接成功！')
        except Exception: # If the database is not established, create it
            database = pymysql.connect(host = 'localhost', user = DATABASE_USER, passwd = DATABASE_PASSWORD, port = DATABASE_PORT)
            database_cursor = database.cursor(); database_cursor.execute('CREATE DATABASE IF NOT EXISTS GenshinOJ;')
            database = pymysql.connect(host = 'localhost', user = DATABASE_USER, passwd = DATABASE_PASSWORD, port = DATABASE_PORT, database = 'GenshinOJ')
            print('初始化完毕！')

        # Get MySQL's version
        database_cursor = database.cursor(); database_cursor.execute('SELECT VERSION()')
        print(f'MySQL Version: {database_cursor.fetchone()[0]}')
        # Initialize the table
        database_cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(256) NOT NULL,
            password VARCHAR(256) NOT NULL
        )
        '''
        )
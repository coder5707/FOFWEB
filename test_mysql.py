
import os
import pymysql

try:
    connection = pymysql.connect(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "retail_app"),
        password=os.getenv("MYSQL_PASSWORD", "sanjay@2005"),
        database=os.getenv("MYSQL_DATABASE", "retail_shop"),
        charset="utf8mb4"
    )

    print("SUCCESS: MySQL connected!")

    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION()")
        print("MySQL Version:", cursor.fetchone())

        cursor.execute("SELECT DATABASE()")
        print("Database:", cursor.fetchone())

    connection.close()

except Exception as error:
    print("MYSQL CONNECTION FAILED:", error)

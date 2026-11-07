"""One-time local migration: copy existing SQLite tables into configured MySQL.

Run from backend folder after setting MYSQL_* environment variables:
    python migrate_sqlite_to_mysql.py
This copies data; it does not delete or modify the SQLite source.
"""
import os
import sqlite3
from database import get_direct_db_conn
from init_db import init_db
from config import Config

TABLES = ['users', 'customers', 'products', 'sales', 'sale_items',
          'expense_categories', 'expenses']

def migrate(sqlite_path=None):
    sqlite_path = sqlite_path or os.path.join(Config.BASE_DIR, 'retail_shop.db')
    if not os.path.exists(sqlite_path):
        raise FileNotFoundError(f'SQLite database not found: {sqlite_path}')
    init_db()
    source = sqlite3.connect(sqlite_path)
    source.row_factory = sqlite3.Row
    target = get_direct_db_conn()
    try:
        # Insert parents before dependent tables; preserve primary keys.
        for table in TABLES:
            rows = source.execute(f'SELECT * FROM {table}').fetchall()
            if not rows:
                continue
            columns = rows[0].keys()
            col_sql = ', '.join(f'`{c}`' for c in columns)
            marks = ', '.join(['%s'] * len(columns))
            sql = f'INSERT INTO `{table}` ({col_sql}) VALUES ({marks}) ON DUPLICATE KEY UPDATE id=VALUES(id)'
            for row in rows:
                target.execute(sql, tuple(row[c] for c in columns)).close()
            print(f'{table}: copied {len(rows)} rows')
        target.commit()
        print('Migration completed. SQLite source was left unchanged.')
    except Exception:
        target.rollback()
        raise
    finally:
        source.close()
        target.close()

if __name__ == '__main__':
    migrate(os.environ.get('SQLITE_SOURCE') or None)

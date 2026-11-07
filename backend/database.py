"""MySQL database adapter with a small sqlite-compatible API for existing routes."""
import re
from urllib.parse import urlparse, unquote
import pymysql
from pymysql.cursors import DictCursor
from flask import g
from config import Config

class CursorAdapter:
    def __init__(self, cursor): self._cursor = cursor
    def execute(self, *args, **kwargs): return self._cursor.execute(*args, **kwargs)
    def fetchone(self): return self._cursor.fetchone()
    def fetchall(self): return self._cursor.fetchall()
    @property
    def lastrowid(self): return self._cursor.lastrowid
    @property
    def rowcount(self): return self._cursor.rowcount
    def close(self): return self._cursor.close()

class ConnectionAdapter:
    def __init__(self, conn): self._conn = conn
    def execute(self, sql, args=()):
        # Existing application SQL uses SQLite's '?' placeholders.
        sql = sql.replace('?', '%s')
        cur = self._conn.cursor()
        cur.execute(sql, args)
        return CursorAdapter(cur)
    def cursor(self): return CursorAdapter(self._conn.cursor())
    def commit(self): return self._conn.commit()
    def rollback(self): return self._conn.rollback()
    def close(self): return self._conn.close()

def _mysql_settings():
    url = Config.MYSQL_URL
    if url:
        parsed = urlparse(url.replace('mysql+pymysql://', 'mysql://', 1))
        return dict(host=parsed.hostname, port=parsed.port or 3306,
                    user=unquote(parsed.username or ''), password=unquote(parsed.password or ''),
                    database=parsed.path.lstrip('/').split('?')[0])
    return dict(host=Config.MYSQL_HOST, port=Config.MYSQL_PORT,
                user=Config.MYSQL_USER, password=Config.MYSQL_PASSWORD,
                database=Config.MYSQL_DATABASE)

def get_direct_db_conn():
    settings = _mysql_settings()
    if not settings.get('database'):
        raise RuntimeError('MySQL database is not configured. Set MYSQL_URL or MYSQL_DATABASE.')
    conn = pymysql.connect(**settings, charset='utf8mb4', cursorclass=DictCursor,
                           autocommit=False, connect_timeout=10)
    return ConnectionAdapter(conn)

def get_db():
    if 'db' not in g:
        g.db = get_direct_db_conn()
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None: db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rows = cur.fetchall()
    cur.close()
    if rows: return rows[0] if one else rows
    return None if one else []

def execute_db(query, args=(), commit=True):
    db = get_db()
    cur = db.execute(query, args)
    result = {'lastrowid': cur.lastrowid, 'rowcount': cur.rowcount}
    cur.close()
    if commit: db.commit()
    return result

# Retail Shop Management System — MySQL deployment

## Database change
The Flask backend now uses MySQL via PyMySQL. Existing route SQL placeholders (`?`) are adapted by the database layer. The database schema is initialized at application startup.

## Required environment variables
Configure these on your hosting provider (Render Web Service → Environment):

- `MYSQL_HOST` — MySQL server hostname
- `MYSQL_PORT` — usually `3306`
- `MYSQL_USER` — database username
- `MYSQL_PASSWORD` — database password
- `MYSQL_DATABASE` — database/schema name
- `SECRET_KEY` — long random secret

Alternatively, set `MYSQL_URL` to a MySQL connection URL if your provider supplies one. Do not commit database credentials to Git.

## Initial setup
1. Create a managed MySQL database with a provider that allows external connections from Render.
2. Create/select a database/schema and database user.
3. Add the environment variables above to the Render web service.
4. Deploy. `/api/health` reports MySQL as the database.
5. Change the seeded initial credentials immediately: `admin` / `admin123` and `staff` / `staff123`.

## Copy existing local SQLite data (one time)
Before deploying, install backend requirements locally and set the same MySQL environment variables. From the `backend` directory run:

```bash
pip install -r requirements.txt
python migrate_sqlite_to_mysql.py
```

By default this reads `backend/retail_shop.db`. To use another source file:

```powershell
$env:SQLITE_SOURCE="D:\path\to\your\retail_shop.db"
python migrate_sqlite_to_mysql.py
```

The migration copies the seven application tables and preserves IDs. It does not delete or alter the SQLite source. Run it only once against a fresh/empty MySQL database to avoid mixing old and new records.

## Important deployment notes
- Uploaded product images are still stored in the web service filesystem. They also need persistent object storage or a persistent disk if they must survive redeploys.
- Keep `MYSQL_PASSWORD` and `SECRET_KEY` private.
- Do not delete your SQLite backup until you have verified row counts and records in MySQL.

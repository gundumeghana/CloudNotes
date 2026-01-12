# database.py
import sqlite3
from pathlib import Path

DATABASE = Path(__file__).parent / 'notes.db'


def get_db():
    conn = sqlite3.connect(str(DATABASE))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Create tables if missing and migrate existing notes table to include
    a created_at column (if it doesn't already exist).
    This function is idempotent and safe to run multiple times.
    """
    conn = get_db()
    cur = conn.cursor()

    # create users table if missing
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            lock_pin TEXT
        )
    """)

    # create notes table if missing
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_archived INTEGER NOT NULL DEFAULT 0,
            is_locked INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    conn.commit()

    # Check whether 'created_at' column exists on notes table
    cur.execute("PRAGMA table_info(notes)")
    existing_cols = [row['name'] for row in cur.fetchall()]

    if 'created_at' not in existing_cols:
        try:
            cur.execute(
                "ALTER TABLE notes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            )
            conn.commit()
            print("Migration: added notes.created_at column")
        except sqlite3.DatabaseError as e:
            print("Could not add created_at column:", e)

    conn.close()


if __name__ == '__main__':
    init_db()
    print("Database initialized/migrated at", DATABASE)

# app.py
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from database import get_db, init_db
import hashlib, os, sqlite3
from functools import wraps

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.urandom(24)
init_db()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)

    return decorated


def get_user_notes_counts(user_id):
    conn = get_db()
    counts = conn.execute(
        """
        SELECT
            (SELECT COUNT(*) FROM notes WHERE user_id = ? AND is_archived = 0) AS all_count,
            (SELECT COUNT(*) FROM notes WHERE user_id = ? AND is_archived = 1) AS archived_count,
            (SELECT COUNT(*) FROM notes WHERE user_id = ? AND is_locked = 1) AS locked_count
    """,
        (user_id, user_id, user_id),
    ).fetchone()
    conn.close()
    return counts


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if "user_id" in session:
        return redirect(url_for("notes_dashboard"))
    error = None
    if request.method == "POST":
        fullname = request.form.get("fullname", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        if not fullname or not email or not password:
            error = "All fields are required."
            return render_template("signup.html", error=error)
        hashed = hash_password(password)
        conn = get_db()
        try:
            conn.execute(
                "INSERT INTO users (fullname,email,password) VALUES (?,?,?)",
                (fullname, email, hashed),
            )
            conn.commit()
            conn.close()
            return redirect(url_for("login"))
        except sqlite3.IntegrityError:
            conn.close()
            error = "Email already registered."
            return render_template("signup.html", error=error)
    return render_template("signup.html", error=error)


@app.route("/", methods=["GET", "POST"])
@app.route("/login", methods=["GET", "POST"])
def login():
    if "user_id" in session:
        return redirect(url_for("notes_dashboard"))
    error = None
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        if not email or not password:
            error = "Email and password required."
            return render_template("login.html", error=error)
        hashed = hash_password(password)
        conn = get_db()
        user = conn.execute(
            "SELECT * FROM users WHERE email = ? AND password = ?",
            (email, hashed),
        ).fetchone()
        conn.close()
        if user:
            session["user_id"] = user["id"]
            session["fullname"] = user["fullname"]
            session["email"] = user["email"]
            return redirect(url_for("notes_dashboard"))
        error = "Invalid email or password."
    return render_template("login.html", error=error)


@app.route("/signout")
def signout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/notes")
@login_required
def notes_dashboard():
    user_id = session["user_id"]
    view = request.args.get("view", "all")
    search_query = request.args.get("search", "")

    conn = get_db()

    # Fetch user data to pass to the profile modal
    user_info = conn.execute(
        "SELECT fullname, email, phone, lock_pin FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()

    query = "SELECT * FROM notes WHERE user_id = ?"
    params = [user_id]

    if view == "archived":
        query += " AND is_archived = 1"
    elif view == "locked":
        query += " AND is_locked = 1"
    else:
        # default "All Notes" → non-archived
        query += " AND is_archived = 0"

    if search_query:
        query += " AND (title LIKE ? OR content LIKE ?)"
        like = f"%{search_query}%"
        params.extend([like, like])

    query += " ORDER BY created_at DESC"
    notes = conn.execute(query, params).fetchall()
    counts = get_user_notes_counts(user_id)
    conn.close()

    return render_template(
        "notes.html",
        user=session,
        notes=notes,
        view=view,
        counts=counts,
        search_query=search_query,
        user_info=user_info,
    )


# simple checkpoints page to match UI
@app.route("/checkpoints")
@login_required
def checkpoints():
    user_id = session["user_id"]
    counts = get_user_notes_counts(user_id)
    # all other stats (completed / upcoming / overdue) shown as 0 in UI for now
    return render_template(
        "checkpoints.html",
        user=session,
        counts=counts,
    )


# API: counts for realtime updates
@app.route("/notes/counts")
@login_required
def notes_counts_api():
    user_id = session["user_id"]
    counts = get_user_notes_counts(user_id)
    return jsonify(
        {
            "all_count": counts["all_count"],
            "archived_count": counts["archived_count"],
            "locked_count": counts["locked_count"],
        }
    )


@app.route("/note/fetch/<int:note_id>")
@login_required
def fetch_note_for_edit(note_id):
    user_id = session["user_id"]
    conn = get_db()
    note = conn.execute(
        "SELECT id, title, content, is_archived, is_locked FROM notes WHERE id = ? AND user_id = ?",
        (note_id, user_id),
    ).fetchone()
    conn.close()
    if not note:
        return jsonify({"success": False}), 404
    return jsonify({"success": True, "note": dict(note)})


@app.route("/note/save", methods=["POST"])
@login_required
def save_note():
    user_id = session["user_id"]
    data = request.json
    note_id = data.get("id", 0)
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    if not title or not content:
        return (
            jsonify({"success": False, "message": "Title and content required."}),
            400,
        )
    conn = get_db()
    if note_id and note_id != 0:
        conn.execute(
            "UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?",
            (title, content, note_id, user_id),
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "note_id": note_id})
    else:
        cur = conn.execute(
            "INSERT INTO notes (user_id,title,content) VALUES (?,?,?)",
            (user_id, title, content),
        )
        conn.commit()
        nid = cur.lastrowid
        conn.close()
        return jsonify({"success": True, "note_id": nid})


@app.route("/note/delete/<int:note_id>", methods=["POST"])
@login_required
def delete_note(note_id):
    user_id = session["user_id"]
    conn = get_db()
    res = conn.execute(
        "DELETE FROM notes WHERE id = ? AND user_id = ?",
        (note_id, user_id),
    )
    conn.commit()
    affected = res.rowcount
    conn.close()
    return jsonify({"success": bool(affected)})


@app.route("/note/toggle_archive/<int:note_id>", methods=["POST"])
@login_required
def toggle_archive(note_id):
    user_id = session["user_id"]
    conn = get_db()
    note = conn.execute(
        "SELECT is_archived FROM notes WHERE id = ? AND user_id = ?",
        (note_id, user_id),
    ).fetchone()
    if not note:
        conn.close()
        return jsonify({"success": False, "message": "Not found"}), 404
    new_status = 0 if note["is_archived"] else 1
    conn.execute(
        "UPDATE notes SET is_archived = ?, is_locked = 0 WHERE id = ? AND user_id = ?",
        (new_status, note_id, user_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "is_archived": new_status})


@app.route("/note/toggle_lock/<int:note_id>", methods=["POST"])
@login_required
def toggle_lock(note_id):
    user_id = session["user_id"]
    data = request.json or {}
    pin = data.get("pin", "")
    conn = get_db()
    user = conn.execute(
        "SELECT lock_pin FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    if not user:
        conn.close()
        return jsonify({"success": False, "message": "User not found"}), 404
    if not user["lock_pin"]:
        conn.close()
        return jsonify({"success": False, "message": "No lock pin set"}), 403
    if hash_password(pin) != user["lock_pin"]:
        conn.close()
        return jsonify({"success": False, "message": "Invalid PIN"}), 401
    note = conn.execute(
        "SELECT is_locked FROM notes WHERE id = ? AND user_id = ?",
        (note_id, user_id),
    ).fetchone()
    if not note:
        conn.close()
        return jsonify({"success": False, "message": "Note not found"}), 404
    new_status = 0 if note["is_locked"] else 1
    if new_status == 1:
        conn.execute(
            "UPDATE notes SET is_locked = 1, is_archived = 0 WHERE id = ? AND user_id = ?",
            (note_id, user_id),
        )
    else:
        conn.execute(
            "UPDATE notes SET is_locked = 0 WHERE id = ? AND user_id = ?",
            (note_id, user_id),
        )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "is_locked": new_status})


@app.route("/note/get_content/<int:note_id>", methods=["POST"])
@login_required
def get_note_content(note_id):
    user_id = session["user_id"]
    data = request.json or {}
    pin = data.get("pin", "")
    conn = get_db()
    note = conn.execute(
        "SELECT * FROM notes WHERE id = ? AND user_id = ?",
        (note_id, user_id),
    ).fetchone()
    user = conn.execute(
        "SELECT lock_pin FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    conn.close()
    if not note:
        return jsonify({"success": False, "message": "Note not found"}), 404
    if note["is_locked"]:
        if not user["lock_pin"] or hash_password(pin) != user["lock_pin"]:
            return jsonify({"success": False, "message": "Invalid PIN"}), 401
    return jsonify(
        {"success": True, "title": note["title"], "content": note["content"]}
    )


@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile_settings():
    user_id = session["user_id"]
    if request.method == "POST":
        fullname = request.form.get("fullname", "").strip()
        phone = request.form.get("phone", "").strip()
        conn = get_db()
        conn.execute(
            "UPDATE users SET fullname = ?, phone = ? WHERE id = ?",
            (fullname, phone, user_id),
        )
        conn.commit()
        conn.close()
        session["fullname"] = fullname
        return redirect(url_for("notes_dashboard"))
    # GET → always go back to dashboard (modal opens from there)
    return redirect(url_for("notes_dashboard"))


@app.route("/set_lock_pin", methods=["POST"])
@login_required
def set_lock_pin():
    user_id = session["user_id"]
    pin = request.form.get("lock_pin", "").strip()
    if not pin or len(pin) < 4:
        return redirect(url_for("notes_dashboard"))
    hashed = hash_password(pin)
    conn = get_db()
    conn.execute(
        "UPDATE users SET lock_pin = ? WHERE id = ?",
        (hashed, user_id),
    )
    conn.commit()
    conn.close()
    return redirect(url_for("notes_dashboard"))


if __name__ == "__main__":
    app.run(debug=True, port=5000)

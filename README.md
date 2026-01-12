# CloudNote — Notes Management Web App
## Project Structure
```
/source_code
│
└── app.py                # Main Flask backend application
└── static/               # CSS, JS, and image files
└── templates/            # HTML templates for frontend
└── database.db           # Local SQLite database
└── requirements.txt      # Python dependencies
```
---

## ⚙️ How to Run the Project

### 0️⃣ Check Python Version
Ensure you have Python 3.9 or higher installed:
```bash
python --version
```

### 1️⃣ Create and Activate a Virtual Environment
It's recommended to use a virtual environment to manage dependencies. From the project root, run:
```bash
python -m venv venv
```
Activate the virtual environment:

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
.\venv\Scripts\activate
```

### 2️⃣ Install Requirements
Open the terminal in VS Code inside your project folder and run:
```bash
pip install -r requirements.txt
```

### 3️⃣ Run the Application
Start the Flask server:
```bash
python app.py
```

### 4️⃣ Access the Web App
Once the server starts, open the browser and visit:
```
http://127.0.0.1:5000/
```

---

## 🧩 Features in Code
- **Login & Register:** User authentication system using Flask routes and session handling.  
- **Dashboard:** Displays all saved notes from the database.  
- **Add Notes:** Allows users to create new notes in real-time.  
- **Edit & Delete Notes:** Update or remove existing notes.  
- **Archive & Locked Notes:** Separate sections to manage secured or hidden notes.  
- **Profile Page:** Displays user info and edit options.  
- **AI Assistant (Optional):** AI-assisted suggestions for note titles or summaries.

---

## 🧰 Developer Notes
- Make sure `app.py` runs without errors before testing routes.  
- If any issue occurs with `database.db`, delete it and re-run the app to auto-create a new one.  
- Keep all HTML templates and static files in their respective folders.
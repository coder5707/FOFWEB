#!/usr/bin/env python3
"""
Retail Shop Management System - Launch Script
Runs the Flask backend on port 5000 and serves both the REST API and the React SPA.
"""
import os
import sys
import webbrowser

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_dir)

from app import create_app
from init_db import init_db

def main():
    print("=" * 65)
    print("      🛍️  RETAIL SHOP MANAGEMENT SYSTEM (PYTHON + REACT)")
    print("=" * 65)
    print("Stack: Python Flask + SQLite3 + React (Vite) + Openpyxl")
    print()
    print("Default Login Credentials:")
    print("  Administrator: username: admin  | password: admin123")
    print("  Staff Member:  username: staff  | password: staff123")
    print("  Customer:      Choose 'Customer' on login screen (No password)")
    print("-" * 65)

    # Initialize database
    print("Checking and initializing SQLite database...")
    init_db()

    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    url = f"http://127.0.0.1:{port}"

    print(f"\n🚀 System running at: {url}")
    print("Press Ctrl+C to stop the server.\n")

    # Try opening browser automatically
    try:
        webbrowser.open(url)
    except Exception:
        pass

    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == '__main__':
    main()

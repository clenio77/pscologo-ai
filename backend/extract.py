import re

with open('app.py', 'r') as f:
    content = f.read()

# This script will replace all @app.route with @bp.route, etc.
# But actually, I'll just do it manually with sed since it's faster.

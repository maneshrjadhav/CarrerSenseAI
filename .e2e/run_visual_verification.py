import json
import os
import sys
import subprocess

# Setup python path to import app & flask_jwt_extended
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app import app
from flask_jwt_extended import create_access_token

USER_ID = 28
with app.app_context():
    token = create_access_token(identity=str(USER_ID))

token_data = {
    "token": token,
    "user": {
        "id": USER_ID,
        "email": "manesh21@gmail.com",
        "full_name": "manesh raju jadhav",
        "role": "candidate"
    }
}

token_file = os.path.join(os.path.dirname(__file__), 'token.json')
with open(token_file, 'w', encoding='utf-8') as f:
    json.dump(token_data, f, indent=2)

print(f"[OK] Wrote {token_file}")

# Run node verify_unrestricted_access.js inside .e2e
cmd = ["node", "verify_unrestricted_access.js"]
p = subprocess.run(cmd, cwd=os.path.dirname(__file__), capture_output=True, text=True)
print("STDOUT:\n", p.stdout)
print("STDERR:\n", p.stderr)
if p.returncode != 0:
    sys.exit(p.returncode)
print("[OK] Puppeteer verification completed successfully!")


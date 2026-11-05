from app import app
client = app.test_client()

resp = client.post('/api/auth/forgot-password', json={'email': 'test@example.com'})
print("Status:", resp.status_code)
print("Response:", resp.get_json())


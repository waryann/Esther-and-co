from backend.app import create_app
app = create_app('development')
with app.test_client() as client:
    res = client.get('/admin/services')
    print("Status:", res.status_code)
    print("Data:", res.data)

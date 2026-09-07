from backend.app import create_app
app = create_app('development')
with app.test_client() as client:
    print(client.get('/').status_code)
    print(client.get('/admin/services').status_code)

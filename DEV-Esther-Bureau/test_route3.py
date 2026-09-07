import logging
import sys
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

from backend.app import create_app
app = create_app('development')
with app.test_client() as client:
    res = client.get('/admin/services')
    print("Status:", res.status_code)

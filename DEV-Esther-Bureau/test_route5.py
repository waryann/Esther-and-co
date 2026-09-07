from backend.app import create_app
from flask import request
app = create_app('development')
with app.test_request_context('/'):
    print("Match / :", request.url_rule)
with app.test_request_context('/admin/services'):
    print("Match /admin/services :", request.url_rule)

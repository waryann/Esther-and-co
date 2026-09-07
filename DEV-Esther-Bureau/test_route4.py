from backend.app import create_app
app = create_app('development')
adapter = app.create_url_adapter(None)
print("Match / :", adapter.match("/"))
try:
    print("Match /admin/services :", adapter.match("/admin/services"))
except Exception as e:
    print("Match /admin/services EXCEPTION :", e)

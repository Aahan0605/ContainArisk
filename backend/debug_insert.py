import sys, traceback
sys.path.insert(0,'.')
from database.database import supabase
print('Connected:', supabase is not None)

try:
    r = supabase.table('containers').insert({'container_id': 'T123'}).execute()
    print('SUCCESS:', r)
except Exception as e:
    print('FULL ERROR:')
    traceback.print_exc()
    print('repr:', repr(e))
    print('str:', str(e))
    if hasattr(e, 'message'):
        print('message:', e.message)
    if hasattr(e, 'details'):
        print('details:', e.details)
    if hasattr(e, 'code'):
        print('code:', e.code)
    if hasattr(e, 'hint'):
        print('hint:', e.hint)

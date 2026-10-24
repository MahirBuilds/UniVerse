import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_homepage_loads(client):
    res = client.get('/')
    assert res.status_code == 200
    assert b'Good Morning, Mahir!' in res.data
    assert b'UniVerse' in res.data
    assert b'Business Mathematics' in res.data

def test_all_primary_routes(client):
    routes = [
        '/ai-assistant',
        '/classrooms',
        '/academics',
        '/attendance',
        '/examinations',
        '/progress',
        '/timetable',
        '/fees',
        '/enrollment',
        '/brain-gym',
        '/brain-gym/pinball',
        '/brain-gym/math-sprint',
        '/brain-gym/memory-snap',
        '/leaderboard',
        '/notices',
        '/settings'
    ]
    for r in routes:
        res = client.get(r)
        assert res.status_code == 200, f"Route {r} returned status {res.status_code}"

def test_unknown_route_returns_404(client):
    res = client.get('/this-route-does-not-exist')
    assert res.status_code == 404

def test_api_search(client):
    res = client.get('/api/search?q=Mathematics')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] > 0
    assert any('Business Mathematics' in r['title'] for r in data['results'])

def test_api_academic_subject(client):
    res = client.get('/api/academic/subject/bm301')
    assert res.status_code == 200
    data = res.get_json()
    assert data['subject_id'] == 'bm301'
    assert 'chart' in data
    assert 'labels' in data['chart']

def test_api_attendance_calculate(client):
    res = client.post('/api/attendance/calculate', json={
        'attended': 13,
        'conducted': 20,
        'target': 75.0
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['achievable'] is True
    assert data['needed_consecutive'] == 8

def test_api_ai_chat(client):
    res = client.post('/api/ai/chat', json={
        'message': 'Tell me about Business Mathematics',
        'mode': 'Flash'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert len(data['response']) > 0

def test_api_pinball_puzzle(client):
    # Test with default 4x4
    res = client.get('/api/pinball/new-puzzle?difficulty=Medium')
    assert res.status_code == 200
    data = res.get_json()
    assert data['rows'] == 4
    assert data['cols'] == 4
    assert 'start_entry' in data
    assert 'exit_point' in data
    assert 'correct_label' in data
    assert len(data['choices']) == 4

    # Test trace API
    trace_res = client.post('/api/pinball/trace', json={
        "rows": 4, "cols": 4,
        "reflectors": {"1,1": "/"},
        "start_entry": {"side": "LEFT", "index": 1, "label": "L1"}
    })
    assert trace_res.status_code == 200
    trace_data = trace_res.get_json()
    assert trace_data['exit_point']['label'] == "T1"

    # Test score submit API
    score_res = client.post('/api/game/submit-score', json={
        "points": 150, "game_id": "pinball"
    })
    assert score_res.status_code == 200
    assert score_res.get_json()['success'] is True


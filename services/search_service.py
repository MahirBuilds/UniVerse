import json
import os

class SearchService:
    def __init__(self, data_path=None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, 'data')
        self.data_path = data_path

    def search_all(self, query: str):
        if not query or len(query.strip()) < 2:
            return {"query": query, "total": 0, "results": []}

        q = query.strip().lower()
        results = []

        # 1. Search Subjects
        subjects_file = os.path.join(self.data_path, 'subjects.json')
        if os.path.exists(subjects_file):
            with open(subjects_file, 'r', encoding='utf-8') as f:
                subjects = json.load(f).get('subjects', [])
                for s in subjects:
                    if q in s.get('name', '').lower() or q in s.get('code', '').lower() or q in s.get('faculty', '').lower():
                        results.append({
                            "category": "Subject",
                            "title": f"{s.get('name')} ({s.get('code')})",
                            "subtitle": f"{s.get('faculty')} • Attendance: {s.get('attendance_pct')}%",
                            "url": f"/classrooms#{s.get('id')}",
                            "icon": "book"
                        })

        # 2. Search Notices
        notices_file = os.path.join(self.data_path, 'notices.json')
        if os.path.exists(notices_file):
            with open(notices_file, 'r', encoding='utf-8') as f:
                notices = json.load(f).get('notices', [])
                for n in notices:
                    if q in n.get('title', '').lower() or q in n.get('content', '').lower() or q in n.get('category', '').lower():
                        results.append({
                            "category": "Notice",
                            "title": n.get('title'),
                            "subtitle": f"{n.get('category')} • {n.get('time_ago')}",
                            "url": f"/notices#{n.get('id')}",
                            "icon": "bell"
                        })

        # 3. Search Timetable
        tt_file = os.path.join(self.data_path, 'timetable.json')
        if os.path.exists(tt_file):
            with open(tt_file, 'r', encoding='utf-8') as f:
                tt = json.load(f).get('weekly_timetable', {})
                for day, lectures in tt.items():
                    for lec in lectures:
                        if q in lec.get('subject_name', '').lower() or q in lec.get('faculty', '').lower() or q in lec.get('room', '').lower():
                            results.append({
                                "category": "Timetable",
                                "title": f"{lec.get('subject_name')} ({day})",
                                "subtitle": f"{lec.get('time_display')} in {lec.get('room')}",
                                "url": f"/timetable?day={day}",
                                "icon": "clock"
                            })

        # 4. Search Games
        games_file = os.path.join(self.data_path, 'games.json')
        if os.path.exists(games_file):
            with open(games_file, 'r', encoding='utf-8') as f:
                games = json.load(f).get('games', [])
                for g in games:
                    if q in g.get('title', '').lower() or q in g.get('category', '').lower() or q in g.get('description', '').lower():
                        results.append({
                            "category": "Brain Gym",
                            "title": g.get('title'),
                            "subtitle": f"{g.get('category')} • {g.get('difficulty')}",
                            "url": g.get('route', '/brain-gym'),
                            "icon": "zap"
                        })

        return {
            "query": query,
            "total": len(results),
            "results": results[:12]
        }

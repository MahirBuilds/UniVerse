import json
import os

class LeaderboardService:
    def __init__(self, data_path=None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, 'data')
        self.data_path = data_path

    def load_leaderboard(self):
        file_path = os.path.join(self.data_path, 'leaderboard.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f).get('leaderboard', [])

    def get_leaderboard(self, filter_time: str = "This Week", game: str = "All"):
        entries = self.load_leaderboard()
        # Filter by game if specified
        if game != "All":
            entries = [e for e in entries if e.get('best_game', '').lower() == game.lower()]

        # Sort stably by points descending, then by games_played ascending
        sorted_entries = sorted(entries, key=lambda x: (-x.get('points', 0), x.get('games_played', 0)))
        
        # Re-assign ranks 1..N
        for idx, item in enumerate(sorted_entries):
            item['rank'] = idx + 1

        return sorted_entries

    def get_top_preview(self, count: int = 3):
        entries = self.get_leaderboard()
        return entries[:count]

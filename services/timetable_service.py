import json
import os
from datetime import datetime

class TimetableService:
    def __init__(self, data_path=None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, 'data')
        self.data_path = data_path

    def load_timetable(self):
        file_path = os.path.join(self.data_path, 'timetable.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f).get('weekly_timetable', {})

    def get_schedule(self, day: str = "Wednesday"):
        """Returns schedule for a specific day or default Wednesday (demonstration day)."""
        table = self.load_timetable()
        day_normalized = day.capitalize()
        # Fallback to Wednesday if day not found
        return table.get(day_normalized, table.get("Wednesday", []))

    def get_full_week(self):
        return self.load_timetable()

    def get_upcoming_lecture(self, current_time_str: str = "10:00", day: str = "Wednesday"):
        """
        Finds the current or next upcoming lecture based on time string (HH:MM).
        """
        schedule = self.get_schedule(day)
        lectures_only = [item for item in schedule if item.get('type') == 'lecture']
        
        for lec in lectures_only:
            start = lec.get('time_start', '00:00')
            end = lec.get('time_end', '23:59')
            if current_time_str < end:
                return {
                    "is_now": (start <= current_time_str < end),
                    "lecture": lec
                }
        
        return {
            "is_now": False,
            "lecture": lectures_only[0] if lectures_only else None
        }

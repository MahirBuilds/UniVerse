import math
import json
import os

class AttendanceService:
    def __init__(self, data_path=None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, 'data')
        self.data_path = data_path

    def load_subjects(self):
        file_path = os.path.join(self.data_path, 'subjects.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('subjects', [])

    @staticmethod
    def calculate_percentage(attended: int, conducted: int) -> float:
        if conducted <= 0:
            return 0.0
        return round((attended / conducted) * 100.0, 1)

    @staticmethod
    def get_status_label(percentage: float) -> dict:
        if percentage >= 90.0:
            return {"label": "Excellent", "color": "#10B981", "class": "badge-dark-green"}
        elif percentage >= 80.0:
            return {"label": "Good", "color": "#34D399", "class": "badge-light-green"}
        elif percentage >= 70.0:
            return {"label": "Warning", "color": "#FBBF24", "class": "badge-yellow"}
        elif percentage >= 60.0:
            return {"label": "Critical", "color": "#F97316", "class": "badge-orange"}
        else:
            return {"label": "Severe", "color": "#EF4444", "class": "badge-red"}

    @staticmethod
    def calculate_required_classes(attended: int, conducted: int, target_percentage: float = 75.0) -> dict:
        """
        Calculates how many consecutive classes the student must attend to reach target_percentage.
        Also calculates how many classes they can afford to miss if currently above target.
        """
        if conducted == 0:
            return {
                "achievable": True,
                "needed_consecutive": 0,
                "can_miss": 0,
                "message": "No classes conducted yet.",
                "current_percentage": 0.0
            }

        current_pct = (attended / conducted) * 100.0
        target = target_percentage / 100.0

        if target >= 1.0:
            if attended < conducted:
                return {
                    "achievable": False,
                    "needed_consecutive": -1,
                    "can_miss": 0,
                    "message": "100% attendance is impossible because classes have already been missed.",
                    "current_percentage": round(current_pct, 1)
                }
            else:
                return {
                    "achievable": True,
                    "needed_consecutive": 0,
                    "can_miss": 0,
                    "message": "You currently have 100% attendance.",
                    "current_percentage": 100.0
                }

        if target <= 0.0:
            return {
                "achievable": True,
                "needed_consecutive": 0,
                "can_miss": conducted,
                "message": "Target is 0%.",
                "current_percentage": round(current_pct, 1)
            }

        # If current percentage is below target
        if current_pct < target_percentage:
            # (A + X) / (C + X) >= T  =>  X >= (T*C - A) / (1 - T)
            numerator = (target * conducted) - attended
            denominator = 1.0 - target
            needed = math.ceil(numerator / denominator)
            needed = max(0, needed)
            return {
                "achievable": True,
                "needed_consecutive": needed,
                "can_miss": 0,
                "message": f"Attend next {needed} consecutive class{'es' if needed != 1 else ''} to reach {target_percentage}%.",
                "current_percentage": round(current_pct, 1)
            }
        else:
            # (A) / (C + Y) >= T  =>  C + Y <= A / T  =>  Y <= A / T - C
            max_missable = math.floor((attended / target) - conducted)
            can_miss = max(0, max_missable)
            return {
                "achievable": True,
                "needed_consecutive": 0,
                "can_miss": can_miss,
                "message": f"You are on track. You can afford to miss {can_miss} upcoming class{'es' if can_miss != 1 else ''}.",
                "current_percentage": round(current_pct, 1)
            }

    def get_summary(self):
        subjects = self.load_subjects()
        total_conducted = sum(s.get('conducted', 0) for s in subjects)
        total_attended = sum(s.get('attended', 0) for s in subjects)
        total_missed = total_conducted - total_attended
        overall_pct = self.calculate_percentage(total_attended, total_conducted)
        below_threshold_count = sum(1 for s in subjects if s.get('attendance_pct', 0) < 75.0)

        # Subject wise enhanced
        processed_subjects = []
        for s in subjects:
            pct = self.calculate_percentage(s.get('attended', 0), s.get('conducted', 0))
            status = self.get_status_label(pct)
            insights = self.calculate_required_classes(s.get('attended', 0), s.get('conducted', 0), target_percentage=75.0)
            insights_85 = self.calculate_required_classes(s.get('attended', 0), s.get('conducted', 0), target_percentage=85.0)
            
            s_copy = dict(s)
            s_copy['calculated_pct'] = pct
            s_copy['status_meta'] = status
            s_copy['insight_75'] = insights
            s_copy['insight_85'] = insights_85
            s_copy['missed'] = s.get('conducted', 0) - s.get('attended', 0)
            processed_subjects.append(s_copy)

        return {
            "total_conducted": total_conducted,
            "total_attended": total_attended,
            "total_missed": total_missed,
            "overall_pct": overall_pct,
            "below_threshold_count": below_threshold_count,
            "overall_status": self.get_status_label(overall_pct),
            "subjects": processed_subjects
        }

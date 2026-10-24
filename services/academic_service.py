import json
import os
import math

class AcademicService:
    def __init__(self, data_path=None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, 'data')
        self.data_path = data_path

    def load_assessments(self):
        file_path = os.path.join(self.data_path, 'assessments.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f).get('assessments', {})

    def get_subject_performance(self, subject_id: str, custom_target: float = None):
        all_assessments = self.load_assessments()
        subject_data = all_assessments.get(subject_id)
        if not subject_data:
            return None

        records = subject_data.get('records', [])
        target_marks = custom_target if custom_target is not None else subject_data.get('target_marks', 8.5)
        max_marks = subject_data.get('max_marks', 10.0)
        target_percentage = (target_marks / max_marks) * 100.0 if max_marks > 0 else 85.0

        completed_records = [r for r in records if r.get('is_completed') and r.get('obtained_marks') is not None]
        remaining_records = [r for r in records if not r.get('is_completed')]

        total_obtained = sum(r.get('obtained_marks', 0.0) for r in completed_records)
        completed_max = sum(r.get('max_marks', 0.0) for r in completed_records)
        all_max = sum(r.get('max_marks', 0.0) for r in records)
        remaining_max = sum(r.get('max_marks', 0.0) for r in remaining_records)

        # Actual percentage achieved so far
        if completed_max > 0:
            actual_percentage = (total_obtained / completed_max) * 100.0
            average_marks = round((total_obtained / len(completed_records)), 2) if completed_records else 0.0
        else:
            actual_percentage = 0.0
            average_marks = 0.0

        # Required marks calculation
        # Overall target in total marks:
        total_target_marks_needed = (target_percentage / 100.0) * all_max
        remaining_needed = total_target_marks_needed - total_obtained

        if remaining_needed <= 0:
            projection_status = "Target Already Achieved"
            required_per_assessment = 0.0
            required_pct_in_remaining = 0.0
            is_possible = True
        elif remaining_max <= 0:
            projection_status = "No remaining assessments"
            required_per_assessment = 0.0
            required_pct_in_remaining = 0.0
            is_possible = (remaining_needed <= 0)
        elif remaining_needed > remaining_max:
            projection_status = "Mathematically Impossible"
            required_per_assessment = round(remaining_needed / len(remaining_records), 2)
            required_pct_in_remaining = round((remaining_needed / remaining_max) * 100.0, 1)
            is_possible = False
        else:
            projection_status = "Achievable"
            required_per_assessment = round(remaining_needed / len(remaining_records), 2)
            required_pct_in_remaining = round((remaining_needed / remaining_max) * 100.0, 1)
            is_possible = True

        # Build chart data
        chart_labels = [r['name'] for r in records]
        chart_target = [target_marks for _ in records]
        chart_actual = []
        chart_projected = []

        for r in records:
            if r.get('is_completed') and r.get('obtained_marks') is not None:
                chart_actual.append(r['obtained_marks'])
                chart_projected.append(None)
            else:
                chart_actual.append(None)
                if is_possible and len(remaining_records) > 0:
                    chart_projected.append(min(max_marks, max(0.0, required_per_assessment)))
                else:
                    chart_projected.append(None)

        return {
            "subject_id": subject_id,
            "subject_name": subject_data.get('subject_name'),
            "target_marks": round(target_marks, 1),
            "current_marks": average_marks,
            "max_marks": max_marks,
            "target_percentage": round(target_percentage, 1),
            "actual_percentage": round(actual_percentage, 1),
            "completed_count": len(completed_records),
            "remaining_count": len(remaining_records),
            "total_assessments": len(records),
            "required_marks": required_per_assessment,
            "required_percentage": required_pct_in_remaining,
            "is_possible": is_possible,
            "projection_status": projection_status,
            "records": records,
            "chart": {
                "labels": chart_labels,
                "target_data": chart_target,
                "actual_data": chart_actual,
                "projected_data": chart_projected
            }
        }

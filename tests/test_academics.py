import pytest
from services.academic_service import AcademicService

def test_subject_performance():
    service = AcademicService()
    perf = service.get_subject_performance('bm301')
    assert perf is not None
    assert perf['subject_name'] == 'Business Mathematics'
    assert perf['completed_count'] == 2
    assert perf['remaining_count'] == 2
    assert perf['is_possible'] is True
    # CA1 = 7.5, CA2 = 8.7. Avg = 8.1
    assert perf['current_marks'] == 8.1
    # Target = 8.5 across 4 assessments => 4 * 8.5 = 34.0 needed
    # Obtained = 7.5 + 8.7 = 16.2
    # Remaining needed = 34.0 - 16.2 = 17.8 across 2 assessments
    # 17.8 / 2 = 8.9 (or ~9.0)
    assert round(perf['required_marks'], 1) in [8.9, 9.0]

def test_impossible_academic_target():
    service = AcademicService()
    # If student asks for 10.0 target when they scored 7.5 and 8.7
    # Max remaining is 10 + 10 = 20. Total needed for 10.0 is 40.
    # Total possible is 16.2 + 20 = 36.2 < 40 => Impossible!
    perf = service.get_subject_performance('bm301', custom_target=10.0)
    assert perf['is_possible'] is False
    assert perf['projection_status'] == "Mathematically Impossible"

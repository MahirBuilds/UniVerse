import pytest
from services.attendance_service import AttendanceService

def test_calculate_percentage():
    assert AttendanceService.calculate_percentage(23, 25) == 92.0
    assert AttendanceService.calculate_percentage(18, 23) == 78.3
    assert AttendanceService.calculate_percentage(0, 20) == 0.0
    assert AttendanceService.calculate_percentage(20, 20) == 100.0
    assert AttendanceService.calculate_percentage(5, 0) == 0.0

def test_status_labels():
    assert AttendanceService.get_status_label(95.0)['label'] == "Excellent"
    assert AttendanceService.get_status_label(85.0)['label'] == "Good"
    assert AttendanceService.get_status_label(75.0)['label'] == "Warning"
    assert AttendanceService.get_status_label(65.0)['label'] == "Critical"
    assert AttendanceService.get_status_label(50.0)['label'] == "Severe"

def test_needed_classes_below_target():
    # Student has 13 attended out of 20 conducted = 65%
    # Target is 75%:
    # X >= (0.75 * 20 - 13) / (1 - 0.75) = (15 - 13) / 0.25 = 2 / 0.25 = 8
    res = AttendanceService.calculate_required_classes(attended=13, conducted=20, target_percentage=75.0)
    assert res['achievable'] is True
    assert res['needed_consecutive'] == 8
    assert res['can_miss'] == 0

def test_classes_can_miss_above_target():
    # Student has 23 attended out of 25 conducted = 92%
    # Target is 75%:
    # Y <= 23 / 0.75 - 25 = 30.66 - 25 = 5.66 => floor is 5
    res = AttendanceService.calculate_required_classes(attended=23, conducted=25, target_percentage=75.0)
    assert res['achievable'] is True
    assert res['needed_consecutive'] == 0
    assert res['can_miss'] == 5

def test_impossible_100_percent():
    # Already missed a class (19/20) and target is 100%
    res = AttendanceService.calculate_required_classes(attended=19, conducted=20, target_percentage=100.0)
    assert res['achievable'] is False
    assert res['needed_consecutive'] == -1

import pytest
from services.game_service import PinballReboundsEngine

# 1. Forward-slash reflection
def test_slash_mirror_reflections():
    # '/' mirror
    # Right -> Up
    assert PinballReboundsEngine.SLASH_REFLECTIONS["RIGHT"] == "UP"
    # Up -> Right
    assert PinballReboundsEngine.SLASH_REFLECTIONS["UP"] == "RIGHT"
    # Down -> Left
    assert PinballReboundsEngine.SLASH_REFLECTIONS["DOWN"] == "LEFT"
    # Left -> Down
    assert PinballReboundsEngine.SLASH_REFLECTIONS["LEFT"] == "DOWN"

# 2. Backslash reflection
def test_backslash_mirror_reflections():
    # '\' mirror
    # Right -> Down
    assert PinballReboundsEngine.BACKSLASH_REFLECTIONS["RIGHT"] == "DOWN"
    # Down -> Right
    assert PinballReboundsEngine.BACKSLASH_REFLECTIONS["DOWN"] == "RIGHT"
    # Up -> Left
    assert PinballReboundsEngine.BACKSLASH_REFLECTIONS["UP"] == "LEFT"
    # Left -> Up
    assert PinballReboundsEngine.BACKSLASH_REFLECTIONS["LEFT"] == "UP"

# 3. Path with NO reflectors (straight pass-through)
def test_path_with_no_reflectors():
    # 4x4 grid with 0 mirrors
    reflectors = {}
    
    # Enter LEFT at row 2 -> should pass straight through and exit RIGHT at R2
    start_left = {"side": "LEFT", "index": 2, "label": "L2"}
    res = PinballReboundsEngine.trace_laser(4, 4, reflectors, start_left)
    assert res['success'] is True
    assert res['reflections_count'] == 0
    assert res['exit_point']['label'] == "R2"
    assert res['exit_point']['side'] == "RIGHT"
    assert res['exit_point']['index'] == 2

    # Enter TOP at col 3 -> should pass straight through and exit BOTTOM at B3
    start_top = {"side": "TOP", "index": 3, "label": "T3"}
    res_top = PinballReboundsEngine.trace_laser(4, 4, reflectors, start_top)
    assert res_top['success'] is True
    assert res_top['reflections_count'] == 0
    assert res_top['exit_point']['label'] == "B3"

# 4. Single reflection exit
def test_single_reflection_exit():
    # 4x4 grid, single '/' mirror at (1, 1)
    # Laser enters at L1 moving RIGHT
    reflectors = {"1,1": "/"}
    start = {"side": "LEFT", "index": 1, "label": "L1"}
    res = PinballReboundsEngine.trace_laser(4, 4, reflectors, start)
    
    assert res['success'] is True
    assert res['is_loop'] is False
    assert res['reflections_count'] == 1
    # Hits (1,1) moving RIGHT, deflects UP, moves to (0,1), then exits top at col 1 => T1
    assert res['exit_point']['side'] == "TOP"
    assert res['exit_point']['index'] == 1
    assert res['exit_point']['label'] == "T1"

# 5. Multiple consecutive reflections
def test_multi_reflection_path():
    # 4x4 grid
    # Enter L1 (RIGHT) -> hits (1,1) '/' -> UP
    # Hits (0,1) '\' -> LEFT
    # Exits LEFT at row 0 => L0
    reflectors = {
        "1,1": "/",
        "0,1": "\\"
    }
    start = {"side": "LEFT", "index": 1, "label": "L1"}
    res = PinballReboundsEngine.trace_laser(4, 4, reflectors, start)

    assert res['success'] is True
    assert res['reflections_count'] == 2
    assert res['exit_point']['label'] == "L0"

# 6. Every boundary direction (LEFT, RIGHT, TOP, BOTTOM)
def test_every_boundary_direction():
    # Simple single '/' mirror at (2, 2)
    reflectors = {"2,2": "/"}
    
    # Enter LEFT at row 2 (moving RIGHT) -> strikes (2,2) '/' -> deflects UP -> exits T2
    r_left = PinballReboundsEngine.trace_laser(4, 4, reflectors, {"side": "LEFT", "index": 2, "label": "L2"})
    assert r_left['exit_point']['label'] == "T2"

    # Enter RIGHT at row 2 (moving LEFT) -> strikes (2,2) '/' -> deflects DOWN -> exits B2
    r_right = PinballReboundsEngine.trace_laser(4, 4, reflectors, {"side": "RIGHT", "index": 2, "label": "R2"})
    assert r_right['exit_point']['label'] == "B2"

    # Enter TOP at col 2 (moving DOWN) -> strikes (2,2) '/' -> deflects LEFT -> exits L2
    r_top = PinballReboundsEngine.trace_laser(4, 4, reflectors, {"side": "TOP", "index": 2, "label": "T2"})
    assert r_top['exit_point']['label'] == "L2"

    # Enter BOTTOM at col 2 (moving UP) -> strikes (2,2) '/' -> deflects RIGHT -> exits R2
    r_bottom = PinballReboundsEngine.trace_laser(4, 4, reflectors, {"side": "BOTTOM", "index": 2, "label": "B2"})
    assert r_bottom['exit_point']['label'] == "R2"

# 7. Every valid entrance index (0, 1, 2, 3 for 4x4)
def test_every_valid_entrance_index():
    # With no reflectors, every index i on LEFT must exit at Ri
    for i in range(4):
        res = PinballReboundsEngine.trace_laser(4, 4, {}, {"side": "LEFT", "index": i, "label": f"L{i}"})
        assert res['exit_point']['label'] == f"R{i}"
        
        # Every index i on TOP must exit at Bi
        res_t = PinballReboundsEngine.trace_laser(4, 4, {}, {"side": "TOP", "index": i, "label": f"T{i}"})
        assert res_t['exit_point']['label'] == f"B{i}"

# 8. Repeated-state / infinite loop detection
def test_infinite_loop_detection():
    # 4 mirrors forming a closed clockwise rectangular loop:
    # (1,1) '/' (UP -> RIGHT) -> (1,2) '\' (RIGHT -> DOWN) -> (2,2) '/' (DOWN -> LEFT) -> (2,1) '\' (LEFT -> UP)
    reflectors = {
        "1,1": "/",
        "1,2": "\\",
        "2,2": "/",
        "2,1": "\\"
    }
    start = {"side": "INTERNAL", "row": 1, "col": 1, "direction": "UP"}
    res = PinballReboundsEngine.trace_laser(4, 4, reflectors, start)
    
    assert res['is_loop'] is True
    assert res['exit_point']['side'] == "LOOP"

# 9. 4x4 Puzzle generation validation
def test_4x4_puzzle_generation_easy():
    puzzle = PinballReboundsEngine.generate_puzzle(4, 4, "Easy")
    assert puzzle['rows'] == 4
    assert puzzle['cols'] == 4
    assert len(puzzle['reflectors']) >= 3
    assert len(puzzle['reflectors']) <= 6
    assert puzzle['correct_label'] is not None
    assert puzzle['correct_label'] in puzzle['choices']
    assert len(puzzle['choices']) == 4
    assert puzzle['reflections_count'] >= 1
    # Check that correct_label matches a simulated trace of that exact puzzle
    trace = PinballReboundsEngine.trace_laser(4, 4, puzzle['reflectors'], puzzle['start_entry'])
    assert trace['exit_point']['label'] == puzzle['correct_label']

def test_4x4_puzzle_generation_medium():
    puzzle = PinballReboundsEngine.generate_puzzle(4, 4, "Medium")
    assert puzzle['rows'] == 4
    assert puzzle['cols'] == 4
    assert puzzle['reflections_count'] >= 2
    assert puzzle['correct_label'] in puzzle['choices']

def test_4x4_puzzle_generation_hard():
    puzzle = PinballReboundsEngine.generate_puzzle(4, 4, "Hard")
    assert puzzle['rows'] == 4
    assert puzzle['cols'] == 4
    assert puzzle['reflections_count'] >= 3
    assert puzzle['correct_label'] in puzzle['choices']

def test_puzzle_generation_termination():
    # Generate 10 consecutive puzzles to ensure fast termination and no infinite loops
    for _ in range(10):
        puzzle = PinballReboundsEngine.generate_puzzle(4, 4, "Medium")
        assert puzzle['correct_label'] is not None
        assert puzzle['rows'] == 4
        assert puzzle['cols'] == 4

# 11. Deterministic manually calculated multi-mirror board 1
def test_deterministic_board_case_1():
    # Grid 4x4 with 3 mirrors
    reflectors = {
        "0,2": "/",
        "2,2": "\\",
        "2,0": "/"
    }
    # Test A: T2 (DOWN) -> hits (0,2) '/' -> deflecting LEFT -> moves through (0,1), (0,0) -> exits L0
    trace_a = PinballReboundsEngine.trace_laser(4, 4, reflectors, {"side": "TOP", "index": 2, "label": "T2"})
    assert trace_a['success'] is True
    assert trace_a['reflections_count'] == 1
    assert trace_a['exit_point']['label'] == "L0"
    assert trace_a['exit_point']['side'] == "LEFT"
    assert trace_a['exit_point']['index'] == 0

    # Test B: B2 (UP) -> moves through (3,2) -> hits (2,2) '\' -> deflecting LEFT -> moves through (2,1)
    # -> hits (2,0) '/' -> deflecting DOWN -> moves through (3,0) -> exits B0
    trace_b = PinballReboundsEngine.trace_laser(4, 4, reflectors, {"side": "BOTTOM", "index": 2, "label": "B2"})
    assert trace_b['success'] is True
    assert trace_b['reflections_count'] == 2
    assert trace_b['exit_point']['label'] == "B0"
    assert trace_b['exit_point']['side'] == "BOTTOM"
    assert trace_b['exit_point']['index'] == 0

# 12. Correct answer evaluation logic
def test_answer_prediction_evaluation():
    reflectors = {"1,1": "/"}
    start = {"side": "LEFT", "index": 1, "label": "L1"}
    res = PinballReboundsEngine.trace_laser(4, 4, reflectors, start)
    correct_exit = res['exit_point']['label']  # "T1"

    # Evaluation
    user_prediction_correct = "T1"
    user_prediction_wrong = "R1"
    assert user_prediction_correct == correct_exit
    assert user_prediction_wrong != correct_exit

# 13. Default 4x4 dimensions when omitted
def test_default_4x4_dimensions():
    puzzle = PinballReboundsEngine.generate_puzzle()
    assert puzzle['rows'] == 4
    assert puzzle['cols'] == 4
    assert len(puzzle['choices']) == 4
    for choice in puzzle['choices']:
        side = choice[0]
        idx = int(choice[1:])
        assert side in ['T', 'B', 'L', 'R']
        assert 0 <= idx < 4


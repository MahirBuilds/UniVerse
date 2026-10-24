import os
import json
import random
from flask import Flask, render_template, request, jsonify, redirect, url_for
from services.attendance_service import AttendanceService
from services.academic_service import AcademicService
from services.timetable_service import TimetableService
from services.game_service import PinballReboundsEngine
from services.leaderboard_service import LeaderboardService
from services.search_service import SearchService

app = Flask(__name__)
app.config['SECRET_KEY'] = 'universe-secret-demonstration-key-2026'

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

attendance_service = AttendanceService(DATA_DIR)
academic_service = AcademicService(DATA_DIR)
timetable_service = TimetableService(DATA_DIR)
leaderboard_service = LeaderboardService(DATA_DIR)
search_service = SearchService(DATA_DIR)

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

@app.context_processor
def inject_global_data():
    student_data = load_json('students.json').get('student', {})
    notices_data = load_json('notices.json').get('notices', [])
    unread_count = sum(1 for n in notices_data if not n.get('is_read', False))
    return {
        'student': student_data,
        'unread_notifications_count': unread_count,
        'system_date_display': "Wed, 1 Oct 2026",
        'system_time_display': "10:24 AM"
    }

# ----------------- PAGE ROUTES -----------------

@app.route('/')
def home():
    attendance_summary = attendance_service.get_summary()
    calendar_days = load_json('calendar.json').get('calendar_days', [])
    today_schedule = timetable_service.get_schedule("Wednesday")
    notices = load_json('notices.json').get('notices', [])
    top_leaderboard = leaderboard_service.get_top_preview(3)
    subjects = attendance_summary.get('subjects', [])
    
    # Default subject for academic progress chart: Business Mathematics
    initial_academic = academic_service.get_subject_performance("bm301")
    
    # Next upcoming lecture
    upcoming_info = timetable_service.get_upcoming_lecture("10:24", "Wednesday")

    return render_template(
        'index.html',
        active_page='home',
        attendance_summary=attendance_summary,
        calendar_days=calendar_days,
        today_schedule=today_schedule,
        notices=notices[:4],
        top_leaderboard=top_leaderboard,
        subjects=subjects,
        initial_academic=initial_academic,
        upcoming_info=upcoming_info
    )

@app.route('/ai-assistant')
def ai_assistant():
    subjects = load_json('subjects.json').get('subjects', [])
    return render_template('ai_assistant.html', active_page='ai_assistant', subjects=subjects)

@app.route('/classrooms')
def classrooms():
    attendance_summary = attendance_service.get_summary()
    return render_template('classrooms.html', active_page='classrooms', subjects=attendance_summary.get('subjects', []))

@app.route('/academics')
def academics():
    attendance_summary = attendance_service.get_summary()
    return render_template('academics.html', active_page='academics', subjects=attendance_summary.get('subjects', []))

@app.route('/attendance')
def attendance():
    attendance_summary = attendance_service.get_summary()
    return render_template('attendance.html', active_page='attendance', summary=attendance_summary)

@app.route('/examinations')
def examinations():
    exam_data = load_json('examinations.json')
    return render_template(
        'examinations.html',
        active_page='examinations',
        upcoming_exams=exam_data.get('upcoming_exams', []),
        past_results=exam_data.get('past_results', [])
    )

@app.route('/progress')
def progress():
    subjects = load_json('subjects.json').get('subjects', [])
    selected_subject_id = request.args.get('subject', 'bm301')
    perf = academic_service.get_subject_performance(selected_subject_id)
    return render_template(
        'progress.html',
        active_page='progress',
        subjects=subjects,
        selected_subject_id=selected_subject_id,
        perf=perf
    )

@app.route('/timetable')
def timetable():
    day = request.args.get('day', 'Wednesday')
    view_mode = request.args.get('view', 'day')
    full_week = timetable_service.get_full_week()
    schedule = timetable_service.get_schedule(day)
    return render_template(
        'timetable.html',
        active_page='timetable',
        selected_day=day,
        view_mode=view_mode,
        schedule=schedule,
        full_week=full_week
    )

@app.route('/fees')
def fees():
    fees_data = load_json('fees.json')
    return render_template('fees.html', active_page='fees', fees_data=fees_data)

@app.route('/enrollment')
def enrollment():
    catalog = load_json('enrollments.json').get('enrollment_catalog', [])
    return render_template('enrollment.html', active_page='enrollment', catalog=catalog)

@app.route('/brain-gym')
def brain_gym():
    games = load_json('games.json').get('games', [])
    return render_template('brain_gym.html', active_page='brain_gym', games=games)

@app.route('/brain-gym/pinball')
def pinball_game():
    return render_template('pinball.html', active_page='brain_gym')

@app.route('/brain-gym/math-sprint')
def math_sprint_game():
    return render_template('math_sprint.html', active_page='brain_gym')

@app.route('/brain-gym/memory-snap')
def memory_snap_game():
    return render_template('memory_snap.html', active_page='brain_gym')

@app.route('/leaderboard')
def leaderboard():
    time_filter = request.args.get('filter', 'This Week')
    game_filter = request.args.get('game', 'All')
    leaders = leaderboard_service.get_leaderboard(time_filter, game_filter)
    games = load_json('games.json').get('games', [])
    return render_template(
        'leaderboard.html',
        active_page='leaderboard',
        leaderboard=leaders,
        selected_filter=time_filter,
        selected_game=game_filter,
        games=games
    )

@app.route('/notices')
def notices():
    category = request.args.get('category', 'All')
    all_notices = load_json('notices.json').get('notices', [])
    if category != 'All':
        filtered = [n for n in all_notices if n.get('category', '').lower() == category.lower()]
    else:
        filtered = all_notices
    return render_template('notices.html', active_page='notices', notices=filtered, selected_category=category)

@app.route('/settings')
def settings():
    return render_template('settings.html', active_page='settings')

# ----------------- JSON API ENDPOINTS -----------------

@app.route('/api/search')
def api_search():
    q = request.args.get('q', '')
    results = search_service.search_all(q)
    return jsonify(results)

@app.route('/api/academic/subject/<subject_id>')
def api_academic_subject(subject_id):
    custom_target = request.args.get('target', None)
    if custom_target is not None:
        try:
            custom_target = float(custom_target)
        except ValueError:
            custom_target = None
    data = academic_service.get_subject_performance(subject_id, custom_target)
    if not data:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify(data)

@app.route('/api/attendance/calculate', methods=['POST'])
def api_attendance_calculate():
    payload = request.get_json() or {}
    try:
        attended = int(payload.get('attended', 0))
        conducted = int(payload.get('conducted', 0))
        target = float(payload.get('target', 75.0))
        res = attendance_service.calculate_required_classes(attended, conducted, target)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/pinball/new-puzzle')
def api_pinball_new():
    rows = int(request.args.get('rows', 4))
    cols = int(request.args.get('cols', 4))
    difficulty = request.args.get('difficulty', 'Medium')
    puzzle = PinballReboundsEngine.generate_puzzle(rows, cols, difficulty)
    return jsonify(puzzle)

@app.route('/api/pinball/trace', methods=['POST'])
def api_pinball_trace():
    payload = request.get_json() or {}
    rows = payload.get('rows', 4)
    cols = payload.get('cols', 4)
    reflectors = payload.get('reflectors', {})
    start_entry = payload.get('start_entry', {"side": "LEFT", "index": 0})
    result = PinballReboundsEngine.trace_laser(rows, cols, reflectors, start_entry)
    return jsonify(result)

@app.route('/api/ai/chat', methods=['POST'])
def api_ai_chat():
    payload = request.get_json() or {}
    message = payload.get('message', '').strip()
    mode = payload.get('mode', 'Flash')  # Flash, Live, Thinking, Research
    context_subject = payload.get('subject', 'General')

    if not message:
        return jsonify({"error": "Message is empty"}), 400

    msg_lower = message.lower()

    # Dynamic intelligent simulated educational response
    if "revise" in msg_lower or "math" in msg_lower or "business mathematics" in msg_lower:
        response_text = (
            "### 📐 Quick Revision: Business Mathematics (BM301)\n\n"
            "Here is a 3-minute executive summary of the core concepts from your last lecture:\n\n"
            "1. **Matrix Inversion via Gaussian Elimination**: Remember that $[A | I] \\sim [I | A^{-1}]$. Invertibility requires $\\det(A) \\neq 0$.\n"
            "2. **Lagrange Multipliers for Optimization**: Used to maximize objective function $f(x,y)$ subject to constraint $g(x,y) = c$:\n"
            "   $$\\nabla f = \\lambda \\nabla g$$\n"
            "3. **Key Exam Tip**: Check the second-order partial derivative conditions for Hessian definiteness!\n\n"
            "*(Demonstration Mode: Simulated AI Assistant)*"
        )
    elif "os" in msg_lower or "operating system" in msg_lower or "deadlock" in msg_lower:
        response_text = (
            "### 💻 Operating Systems: Deadlock Conditions\n\n"
            "For a deadlock to occur, **all four Coffman conditions** must hold simultaneously:\n\n"
            "* **Mutual Exclusion**: At least one resource held non-sharably.\n"
            "* **Hold and Wait**: Process holds resource while requesting another.\n"
            "* **No Preemption**: Resources cannot be seized forcibly.\n"
            "* **Circular Wait**: $P_0 \\rightarrow P_1 \\rightarrow \\dots \\rightarrow P_0$.\n\n"
            "**Resolution**: Break any one condition or deploy Banker's Algorithm for avoidance."
        )
    elif "attendance" in msg_lower:
        response_text = (
            "### 📊 Attendance Advisory\n\n"
            "Your current overall attendance is **78.0%**. \n\n"
            "* **Alert**: Your Data Structures attendance is currently at **65.0%** (13/20 classes attended).\n"
            "* **Action**: You must attend the next **8 consecutive classes** in Data Structures without absence to cross the required 75.0% threshold."
        )
    elif "quiz" in msg_lower:
        response_text = (
            "### ⚡ Quick Quiz Time!\n\n"
            "**Question**: In a B-Tree of order $m$, what is the maximum number of children any internal node can hold?\n\n"
            "A) $m - 1$\n"
            "B) $m$\n"
            "C) $\\lceil m / 2 \\rceil$\n"
            "D) $2m$\n\n"
            "Type your answer or select an option to check!"
        )
    else:
        mode_prefix = f"**[{mode.upper()} MODE]** "
        response_text = (
            f"{mode_prefix}I am your UniVerse Academic Co-Pilot.\n\n"
            f"Regarding **'{message}'**:\n\n"
            "UniVerse integrates your lecture notes, attendance targets, and continuous assessments into one streamlined ecosystem. "
            "You can ask me to summarize lectures, predict test scores needed for an 8.5+ CGPA, or prepare custom flashcards before class.\n\n"
            "*(Demonstration Engine: Local simulated intelligence)*"
        )

    return jsonify({
        "success": True,
        "mode": mode,
        "response": response_text,
        "timestamp": "Just now"
    })

@app.route('/api/game/submit-score', methods=['POST'])
def api_submit_score():
    payload = request.get_json() or {}
    points = int(payload.get('points', 0))
    game_id = payload.get('game_id', 'pinball')
    
    # In this demonstration prototype, update in-memory student score
    return jsonify({
        "success": True,
        "message": f"Recorded +{points} Brain Gym points!",
        "new_total": 1240 + points
    })

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)

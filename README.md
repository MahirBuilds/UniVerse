# UniVerse — Unified Student Ecosystem

> **"Your University. Your Universe."**

UniVerse is a unified, frontend-focused digital platform combining college management, student academic performance analytics, real-time timetable tracking, AI-assisted learning interfaces, and brain-training cognitive games.

---

## 🌟 Visual Theme & Design System

UniVerse is crafted around the **Midnight & Electric Blue** design system, featuring two unified themes:

### Dark Mode (Midnight Theme)
- **Background**: `#0B1020`
- **Cards**: `#141C2F`
- **Surface**: `#1C2440`
- **Primary Accent**: `#5B8CFF` (Electric Blue)
- **Secondary Accent**: `#63D6C5` (Neon Cyan)
- **Primary Text**: `#F3F6FC`
- **Secondary Text**: `#A0B2D6`
- **Borders**: `#273552`

### Light Mode (Inverse Palette)
- **Background**: `#F4F7FF`
- **Cards**: `#FFFFFF`
- **Surface**: `#E8F0FF`
- **Primary Accent**: `#2563EB`
- **Secondary Accent**: `#0D9488`
- **Primary Text**: `#172033`
- **Secondary Text**: `#64748B`
- **Borders**: `#D9E3F5`

Themes switch instantly across all components, persist in `LocalStorage`, and automatically update Chart.js datasets without page reload or FOUC (Flash of Unstyled Content).

---

## 🚀 Key Features

1. **Home Dashboard**
   - **Personalized Welcome Banner**: Dynamic greeting, daily motivational quote, and campus backdrop.
   - **Upcoming Holidays Strip**: Scrollable calendar ribbon showing Working Days, Navratri Holidays, and examination periods.
   - **5 Summary Metric Cards**: Current Semester (3), Total Subjects (6), Overall Attendance (78% with trend badge), Average Marks (8.1 / 10), and Brain Gym Points (1,240, Rank #5).
   - **Today's Timetable**: Connected node timeline with color-coded attendance badges, room allotments, and break markers.
   - **Academic Progress (Chart.js)**: Interactive chart comparing Target Marks vs Actual Marks across continuous assessments, dynamically updated via the subject dropdown.
   - **Notices & Events**: University circulars with priority tags (Important, Cultural, Exam, Holidays).
   - **Quick Revision AI Widget**: Direct contextual prompts to revise prior lectures or launch quick quizzes.
   - **Brain Gym Leaderboard Preview**: Top campus players preview.

2. **Full Conversational AI Assistant (`/ai-assistant`)**
   - **Multi-Mode Selector**: Four selectable demonstration engines:
     - ⚡ *Flash* (Rapid Q&A)
     - 🎙️ *Live* (Audio Interface Simulation)
     - 🧠 *Thinking* (Deep Algorithmic Analysis)
     - 🔬 *Research* (Citations & Reference Notes)
   - Supports markdown formatting, code snippets, copy-to-clipboard, and conversational history.

3. **Floating AI Assistant (Signature Co-Pilot)**
   - Persistent bottom-right pulsating circular trigger accessible across all pages.
   - Expands into a compact, sleek overlay panel with pre-built quick actions (*Revise Last Lecture*, *Explain a Concept*, *Quick Quiz*, *Check Attendance Target*).

4. **Attendance Management (`/attendance`)**
   - Attendance percentage formula: `(attended / conducted) * 100`.
   - Threshold categories: Dark Green (≥90%), Light Green (80-89%), Yellow (70-79%), Orange (60-69%), Red (<60%).
   - **Interactive Consecutive Classes Calculator**: Solves $X = \lceil \frac{T \cdot C - A}{1 - T} \rceil$ to tell students exactly how many upcoming lectures they must attend consecutively to reach 75% or 85%, or how many they can afford to miss.

5. **Pinball Rebounds Game (`/brain-gym/pinball`)**
   - Grid-based laser-reflection physics puzzle.
   - Diagonal mirrors (`/` and `\`) deflect the laser beam.
   - Authentic optical raycasting with infinite-loop detection and automated solvable puzzle generator.
   - Multi-choice and perimeter click-target prediction with step-by-step laser beam deflection animation!

6. **Additional Brain Gym Games**
   - **Math Sprint (`/brain-gym/math-sprint`)**: 60-second timed speed arithmetic with combo streaks.
   - **Memory Snap (`/brain-gym/memory-snap`)**: Multi-pad visual working memory recall challenge.

7. **My Classrooms & Academics (`/classrooms`, `/academics`)**
   - 6 Enrolled Subjects: *Business Mathematics*, *Operating Systems*, *Data Structures*, *Database Management Systems*, *Computer Networks*, *Environmental Studies*.
   - View lecture notes, syllabus completion progress, faculty office hours, and assessment schedules.

8. **Examinations & Hall Ticket (`/examinations`)**
   - Continuous Assessment (CA-2) timetable, seating rooms, and printable Admit Card modal for Mahir Limbani (USTU23045).
   - Past semester transcripts and SGPA records.

9. **Fees & Payments (`/fees`)**
   - Semester fee breakdown, transaction history, e-receipt downloads, and prototype payment gateway simulation.

10. **Course Enrollment (`/enrollment`)**
    - Catalog of electives with dynamic credit tracking (enforcing the 26-credit limit).

11. **Leaderboard (`/leaderboard`)**
    - Campus-wide standings with filterable views (*This Week*, *All Time*) and current user highlighting.

12. **Global Search (Ctrl + K)**
    - Unified search indexing subjects, faculty, timetable slots, notices, and games.

---

## 🛠️ Project Structure

```
universe/
├── app.py                      # Flask server, routes, and JSON API endpoints
├── requirements.txt            # Dependencies (Flask, pytest)
├── README.md                   # Complete documentation
├── data/                       # Centralized, consistent mock data
│   ├── students.json           # Mahir Limbani profile (USTU23045)
│   ├── subjects.json           # 6 Enrolled core & elective courses
│   ├── assessments.json        # Continuous assessment marks (CA1 - CA4)
│   ├── timetable.json          # Weekly and daily lecture schedule
│   ├── notices.json            # Circulars and event announcements
│   ├── calendar.json           # Holiday strip entries
│   ├── games.json              # Brain Gym game metadata
│   ├── leaderboard.json        # Top student ranks and scores
│   ├── fees.json               # Tuition breakdown and transactions
│   └── enrollments.json        # Course pre-registration catalog
├── services/                   # Modular business logic & engines
│   ├── academic_service.py     # Assessment average and required score formulas
│   ├── attendance_service.py   # Attendance percentages and target calculator
│   ├── timetable_service.py    # Daily/weekly lecture resolver
│   ├── game_service.py         # Pinball Rebounds physics raycasting engine
│   ├── leaderboard_service.py  # Stable leaderboard ranking
│   └── search_service.py       # Global instant search indexer
├── static/
│   ├── css/
│   │   ├── variables.css       # Dark/Light tokens & color palettes
│   │   ├── base.css            # Typography & resets
│   │   ├── layout.css          # Sidebar, topbar, floating assistant, drawer
│   │   ├── components.css      # Cards, badges, buttons, modals, dropdowns
│   │   ├── pages.css           # Page layouts, timeline, game boards, chat
│   │   └── responsive.css      # Viewports (1440px, 1024px, 768px, 390px, 360px)
│   ├── js/
│   │   ├── theme.js            # Theme toggle and LocalStorage synchronization
│   │   ├── app.js              # Live clock, search modal, drawer, notifications
│   │   ├── charts.js           # Chart.js academic progress integration
│   │   ├── assistant.js        # Floating bot & full chat interaction engine
│   │   ├── pinball.js          # Pinball Rebounds interactive game mechanics
│   │   └── attendance.js       # Target attendance simulator
│   └── images/
│       ├── robot_avatar.svg    # Handcrafted 3D-styled AI assistant icon
│       └── avatar.svg          # Stylized student avatar
├── templates/
│   ├── base.html               # Shared layout shell with sidebar & topbar
│   ├── index.html              # Home dashboard
│   ├── ai_assistant.html       # Full AI chat page
│   ├── classrooms.html         # Enrolled subjects & lecture notes
│   ├── academics.html          # Degree credits & GPA roadmap
│   ├── attendance.html         # Attendance tracking & calculator
│   ├── examinations.html       # Exam schedules & hall ticket modal
│   ├── progress.html           # Academic performance report & projections
│   ├── timetable.html          # Day and weekly schedule view
│   ├── fees.html               # Fee breakdown & payment simulation
│   ├── enrollment.html         # Elective enrollment & credit manager
│   ├── brain_gym.html          # Cognitive puzzle hub
│   ├── pinball.html            # Pinball Rebounds game
│   ├── math_sprint.html        # Math Sprint game
│   ├── memory_snap.html        # Memory Snap game
│   ├── leaderboard.html        # Student rankings podium & table
│   ├── notices.html            # Campus notices & bookmarks
│   └── settings.html           # Theme selector & data reset
└── tests/
    ├── test_routes.py          # All 17 routes & API status tests
    ├── test_attendance.py      # Attendance formula & boundary tests
    ├── test_academics.py       # Projection calculation & impossible targets
    ├── test_games.py           # Laser reflection physics & loop detection
    └── test_leaderboard.py     # Ranking and tie-breaker sorting
```

---

## 🚀 Setup & Execution Instructions

### 1. Requirements
- Python 3.10+ (Tested on Python 3.12)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Automated Tests
```bash
pytest -v
```
*(All 22 automated tests pass with 100% test coverage for routes, calculations, and game physics).*

### 4. Start the Application Server
```bash
python app.py
```

### 5. Open in Browser
Open your browser and navigate to:
```
http://127.0.0.1:5000/
```

---

## 🔒 Demonstration vs Live Services Notice

- **No External API Keys**: The conversational AI responses, hall ticket generation, course enrollment, and payment processing are fully functional local demonstrations built without requiring external credentials or paid SaaS integrations.
- **Data Persistence**: Theme choices, bookmarks, and demonstration scores persist locally in the user's browser `LocalStorage`.

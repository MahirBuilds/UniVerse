// Pinball Rebounds Game Engine (Memory-Based Laser Reflection Matrix)
(function () {
  'use strict';

  // Game Configuration & Dimensions
  const ROWS = 4;
  const COLS = 4;
  const GRID_START = 50;
  const CELL_SIZE = 75;
  const SVG_SIZE = 400;

  // Game State Machine
  // States: READY | MEMORIZING | PREDICTING | REVEALING | RESULT
  let gameState = 'READY';
  let currentPuzzle = null;
  let selectedExitLabel = null;
  let isSubmitting = false;

  // Stats & Progress
  let score = 520;
  let highScore = 520;
  let level = 1;
  let streak = 0;
  let memorizationDuration = 6; // Configurable 5, 6, 7 seconds

  // Timers and Animation IDs
  let memorizationTimerId = null;
  let countdownIntervalId = null;
  let laserAnimFrameId = null;
  let sparkTimeouts = [];

  // ----------------------------------------------------
  // Coordinate & Geometry Helpers
  // ----------------------------------------------------
  function getCellCenter(row, col) {
    return {
      x: GRID_START + col * CELL_SIZE + CELL_SIZE / 2,
      y: GRID_START + row * CELL_SIZE + CELL_SIZE / 2
    };
  }

  function getBoundaryNodeCoords(label) {
    const side = label[0];
    const idx = parseInt(label.slice(1), 10);
    const center = GRID_START + idx * CELL_SIZE + CELL_SIZE / 2;

    switch (side) {
      case 'T':
        return { x: center, y: 22, side: 'TOP', index: idx };
      case 'B':
        return { x: center, y: 378, side: 'BOTTOM', index: idx };
      case 'L':
        return { x: 22, y: center, side: 'LEFT', index: idx };
      case 'R':
        return { x: 378, y: center, side: 'RIGHT', index: idx };
      default:
        return { x: 200, y: 200, side: 'UNKNOWN', index: 0 };
    }
  }

  // ----------------------------------------------------
  // Initialization & LocalStorage Persistence
  // ----------------------------------------------------
  function initGame() {
    loadSavedStats();
    buildStaticGridBackdrop();
    setupEventListeners();
    loadNewPuzzle();
  }

  function loadSavedStats() {
    try {
      const savedScore = localStorage.getItem('universe_pinball_score');
      const savedBest = localStorage.getItem('universe_pinball_best_score');
      const savedDuration = localStorage.getItem('universe_pinball_memo_time');

      if (savedScore) score = parseInt(savedScore, 10) || 520;
      if (savedBest) highScore = parseInt(savedBest, 10) || 520;
      if (savedDuration) {
        memorizationDuration = parseInt(savedDuration, 10) || 6;
        const durSelect = document.getElementById('pinballDuration');
        if (durSelect) durSelect.value = String(memorizationDuration);
      }
    } catch (e) {
      console.warn("LocalStorage access restricted:", e);
    }
    updateStatsDisplay();
  }

  function updateStatsDisplay() {
    const scoreEl = document.getElementById('pinballScore');
    const bestEl = document.getElementById('pinballHighScore');
    const levelEl = document.getElementById('pinballLevel');
    const streakEl = document.getElementById('pinballStreak');

    if (scoreEl) scoreEl.textContent = score;
    if (bestEl) bestEl.textContent = highScore;
    if (levelEl) levelEl.textContent = level;
    if (streakEl) streakEl.textContent = `${streak} 🔥`;

    try {
      localStorage.setItem('universe_pinball_score', score);
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('universe_pinball_best_score', highScore);
        if (bestEl) bestEl.textContent = highScore;
      }
    } catch (e) {
      // LocalStorage disabled or quota exceeded
    }
  }

  // ----------------------------------------------------
  // Board Rendering (Cells, Grid, Perimeter Nodes)
  // ----------------------------------------------------
  function buildStaticGridBackdrop() {
    const cellsGroup = document.getElementById('pinballCellsGroup');
    const linesGroup = document.getElementById('pinballGridLinesGroup');
    const boundariesGroup = document.getElementById('pinballBoundariesGroup');

    if (!cellsGroup || !linesGroup || !boundariesGroup) return;

    cellsGroup.innerHTML = '';
    linesGroup.innerHTML = '';
    boundariesGroup.innerHTML = '';

    // Render 16 cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = GRID_START + c * CELL_SIZE;
        const y = GRID_START + r * CELL_SIZE;

        const cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cell.setAttribute('x', x);
        cell.setAttribute('y', y);
        cell.setAttribute('width', CELL_SIZE);
        cell.setAttribute('height', CELL_SIZE);
        cell.setAttribute('rx', '4');
        cell.setAttribute('class', 'pinball-svg-cell');
        cell.setAttribute('id', `svg-cell-${r}-${c}`);
        cellsGroup.appendChild(cell);
      }
    }

    // Interior grid dividing lines
    for (let i = 1; i < 4; i++) {
      // Vertical line
      const vx = GRID_START + i * CELL_SIZE;
      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', vx);
      vLine.setAttribute('y1', GRID_START);
      vLine.setAttribute('x2', vx);
      vLine.setAttribute('y2', GRID_START + COLS * CELL_SIZE);
      vLine.setAttribute('class', 'pinball-grid-line');
      linesGroup.appendChild(vLine);

      // Horizontal line
      const hy = GRID_START + i * CELL_SIZE;
      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', GRID_START);
      hLine.setAttribute('y1', hy);
      hLine.setAttribute('x2', GRID_START + ROWS * CELL_SIZE);
      hLine.setAttribute('y2', hy);
      hLine.setAttribute('class', 'pinball-grid-line');
      linesGroup.appendChild(hLine);
    }

    // Render 16 perimeter boundary nodes
    renderPerimeterBoundaryNodes(boundariesGroup);
  }

  function renderPerimeterBoundaryNodes(group) {
    const allLabels = [
      'T0', 'T1', 'T2', 'T3',
      'B0', 'B1', 'B2', 'B3',
      'L0', 'L1', 'L2', 'L3',
      'R0', 'R1', 'R2', 'R3'
    ];

    allLabels.forEach(label => {
      const coords = getBoundaryNodeCoords(label);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'boundary-node');
      g.setAttribute('id', `boundary-node-${label}`);
      g.setAttribute('data-label', label);
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', `Exit Boundary ${label}`);

      let rxX, rxY, width, height;
      if (label.startsWith('T') || label.startsWith('B')) {
        width = 46;
        height = 26;
        rxX = coords.x - width / 2;
        rxY = coords.y - height / 2;
      } else {
        width = 26;
        height = 46;
        rxX = coords.x - width / 2;
        rxY = coords.y - height / 2;
      }

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', rxX);
      rect.setAttribute('y', rxY);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      rect.setAttribute('rx', '6');
      rect.setAttribute('class', 'boundary-node-rect');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', coords.x);
      text.setAttribute('y', coords.y + 4.5);
      text.setAttribute('class', 'boundary-node-text');
      text.textContent = label;

      g.appendChild(rect);
      g.appendChild(text);

      // Click & Keyboard listeners
      g.addEventListener('click', () => onBoundaryNodeClicked(label));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onBoundaryNodeClicked(label);
        }
      });

      group.appendChild(g);
    });
  }

  // ----------------------------------------------------
  // Reflector Rendering (Unmistakable 45° Diagonal Mirrors)
  // ----------------------------------------------------
  function renderMirrors(reflectors) {
    const mirrorsGroup = document.getElementById('pinballMirrorsGroup');
    if (!mirrorsGroup) return;

    mirrorsGroup.innerHTML = '';
    const DELTA = 24; // Half-length of diagonal stroke (48px total length)

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const mirrorType = reflectors[`${r},${c}`];
        if (!mirrorType) continue;

        const center = getCellCenter(r, c);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        if (mirrorType === '/') {
          // Bottom-left (cx - 24, cy + 24) to Top-right (cx + 24, cy - 24)
          line.setAttribute('x1', center.x - DELTA);
          line.setAttribute('y1', center.y + DELTA);
          line.setAttribute('x2', center.x + DELTA);
          line.setAttribute('y2', center.y - DELTA);
          line.setAttribute('class', 'reflector-line reflector-slash');
          line.setAttribute('filter', 'url(#neonGlowCyan)');
        } else if (mirrorType === '\\') {
          // Top-left (cx - 24, cy - 24) to Bottom-right (cx + 24, cy + 24)
          line.setAttribute('x1', center.x - DELTA);
          line.setAttribute('y1', center.y - DELTA);
          line.setAttribute('x2', center.x + DELTA);
          line.setAttribute('y2', center.y + DELTA);
          line.setAttribute('class', 'reflector-line reflector-backslash');
          line.setAttribute('filter', 'url(#neonGlowBlue)');
        }

        mirrorsGroup.appendChild(line);
      }
    }
  }

  function hideMirrors() {
    const mirrorsGroup = document.getElementById('pinballMirrorsGroup');
    if (mirrorsGroup) {
      // Completely remove reflector DOM nodes to prevent inspector hints or lingering glow
      mirrorsGroup.innerHTML = '';
    }
  }

  // ----------------------------------------------------
  // Entrance Indicator Emitter Rendering
  // ----------------------------------------------------
  function renderEntranceIndicator(startEntry) {
    const emitterGroup = document.getElementById('pinballEmitterGroup');
    if (!emitterGroup) return;

    emitterGroup.innerHTML = '';
    const coords = getBoundaryNodeCoords(startEntry.label);

    // Style the starting perimeter node as start-point
    const startNode = document.getElementById(`boundary-node-${startEntry.label}`);
    if (startNode) {
      startNode.classList.add('start-point');
      const text = startNode.querySelector('.boundary-node-text');
      if (text) {
        let arrow = '▶';
        if (coords.side === 'RIGHT') arrow = '◀';
        if (coords.side === 'TOP') arrow = '▼';
        if (coords.side === 'BOTTOM') arrow = '▲';
        text.textContent = `${startEntry.label} ${arrow}`;
      }
    }

    // Outer nozzle / laser diode indicator
    const nozzle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    nozzle.setAttribute('cx', coords.x);
    nozzle.setAttribute('cy', coords.y);
    nozzle.setAttribute('r', '8');
    nozzle.setAttribute('class', 'laser-emitter-nozzle');
    nozzle.setAttribute('filter', 'url(#laserBeamGlow)');
    emitterGroup.appendChild(nozzle);

    // Update entrance banner text
    const bannerLabel = document.getElementById('pinballEntryLabel');
    const bannerArrow = document.getElementById('pinballEntryArrow');
    if (bannerLabel) bannerLabel.textContent = startEntry.label;
    if (bannerArrow) {
      let arrowChar = '▶ (moving RIGHT)';
      if (coords.side === 'RIGHT') arrowChar = '◀ (moving LEFT)';
      if (coords.side === 'TOP') arrowChar = '▼ (moving DOWN)';
      if (coords.side === 'BOTTOM') arrowChar = '▲ (moving UP)';
      bannerArrow.textContent = arrowChar;
    }
  }

  // ----------------------------------------------------
  // Puzzle Generation & Loading
  // ----------------------------------------------------
  async function loadNewPuzzle() {
    cleanupTimersAndAnimations();
    setGameState('READY');

    const diffSelect = document.getElementById('pinballDifficulty');
    const difficulty = diffSelect ? diffSelect.value : 'Medium';

    const durSelect = document.getElementById('pinballDuration');
    if (durSelect) memorizationDuration = parseInt(durSelect.value, 10) || 6;

    selectedExitLabel = null;
    isSubmitting = false;

    // Reset UI feedback
    const submitBtn = document.getElementById('pinballSubmitBtn');
    const submitText = document.getElementById('pinballSubmitText');
    const nextBtn = document.getElementById('pinballNextBtn');
    const resultCard = document.getElementById('pinballResultCard');

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Memorize the Mirrors...';
    if (nextBtn) nextBtn.style.display = 'none';
    if (resultCard) resultCard.style.display = 'none';

    // Clear previous laser path
    const laserGroup = document.getElementById('pinballLaserGroup');
    if (laserGroup) laserGroup.innerHTML = '';

    // Reset boundary node styles
    document.querySelectorAll('.boundary-node').forEach(node => {
      node.classList.remove('start-point', 'selected-node', 'correct-node', 'wrong-node');
      const text = node.querySelector('.boundary-node-text');
      const label = node.getAttribute('data-label');
      if (text && label) text.textContent = label;
    });

    // Update Phase Banner
    updatePhaseBanner('MEMORIZING', `Memorize the mirror matrix! Disappearing in ${memorizationDuration}s...`);

    try {
      const res = await fetch(`/api/pinball/new-puzzle?rows=${ROWS}&cols=${COLS}&difficulty=${difficulty}`);
      if (!res.ok) throw new Error("Failed to fetch puzzle");
      currentPuzzle = await res.json();

      // Render mirrors & entrance
      renderMirrors(currentPuzzle.reflectors);
      renderEntranceIndicator(currentPuzzle.start_entry);
      renderChoices(currentPuzzle.choices);

      // Start the Memorization Countdown Phase
      startMemorizationPhase(memorizationDuration);
    } catch (err) {
      console.error("Error loading pinball puzzle:", err);
      updatePhaseBanner('READY', "Error loading puzzle. Please click 'New Round' to retry.");
    }
  }

  // ----------------------------------------------------
  // Phase 1: Memorization Countdown
  // ----------------------------------------------------
  function startMemorizationPhase(seconds) {
    setGameState('MEMORIZING');

    const timerDisplay = document.getElementById('pinballTimerDisplay');
    const timerFill = document.getElementById('pinballTimerFill');
    const startTime = performance.now();
    const durationMs = seconds * 1000;

    if (timerFill) {
      timerFill.style.transition = 'none';
      timerFill.style.width = '100%';
    }

    countdownIntervalId = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      const remainingSec = (remaining / 1000).toFixed(1);

      if (timerDisplay) {
        timerDisplay.textContent = `${remainingSec}s`;
      }
      if (timerFill) {
        const pct = Math.max(0, (remaining / durationMs) * 100);
        timerFill.style.width = `${pct}%`;
      }

      if (remaining <= 0) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
        transitionToPredictionPhase();
      }
    }, 50);
  }

  // ----------------------------------------------------
  // Phase 2 & 3: Prediction Phase (Mirrors Hidden!)
  // ----------------------------------------------------
  function transitionToPredictionPhase() {
    setGameState('PREDICTING');

    // Remove all mirrors from visible DOM!
    hideMirrors();

    // Update banner & UI
    updatePhaseBanner('PREDICTING', 'Mirrors hidden! Where will the beam exit? Select a boundary.');

    const timerDisplay = document.getElementById('pinballTimerDisplay');
    const timerFill = document.getElementById('pinballTimerFill');
    if (timerDisplay) timerDisplay.textContent = 'Choose Exit';
    if (timerFill) timerFill.style.width = '0%';

    const submitBtn = document.getElementById('pinballSubmitBtn');
    const submitText = document.getElementById('pinballSubmitText');
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Select an Exit Point';

    // Enable choices buttons
    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.disabled = false;
    });
  }

  function renderChoices(choices) {
    const container = document.getElementById('pinballChoices');
    if (!container) return;

    container.innerHTML = choices.map(choice => `
      <button class="btn btn-secondary choice-btn" data-choice="${choice}">
        Exit at <strong>${choice}</strong>
      </button>
    `).join('');

    container.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.getAttribute('data-choice');
        onExitSelected(choice);
      });
    });
  }

  function onBoundaryNodeClicked(label) {
    if (gameState !== 'PREDICTING' || isSubmitting) return;
    if (currentPuzzle && label === currentPuzzle.start_entry.label) {
      // Cannot choose start point as exit
      return;
    }
    onExitSelected(label);
  }

  function onExitSelected(label) {
    if (gameState !== 'PREDICTING' || isSubmitting) return;
    selectedExitLabel = label;

    // Highlight selected SVG boundary node
    document.querySelectorAll('.boundary-node').forEach(node => {
      const nodeLabel = node.getAttribute('data-label');
      if (nodeLabel !== currentPuzzle.start_entry.label) {
        node.classList.toggle('selected-node', nodeLabel === label);
      }
    });

    // Synchronize multiple-choice buttons
    document.querySelectorAll('.choice-btn').forEach(btn => {
      const match = btn.getAttribute('data-choice') === label;
      btn.classList.toggle('btn-primary', match);
      btn.classList.toggle('btn-secondary', !match);
    });

    // Enable submit button
    const submitBtn = document.getElementById('pinballSubmitBtn');
    const submitText = document.getElementById('pinballSubmitText');
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.textContent = `Fire Laser ➔ Test Exit ${label}`;

    const hint = document.getElementById('pinballPredictionHint');
    if (hint) hint.innerHTML = `Selected: <strong style="color: #F59E0B;">${label}</strong>. Hit Submit to verify!`;
  }

  // ----------------------------------------------------
  // Phase 4: Submit & Animate Laser Beam
  // ----------------------------------------------------
  async function onSubmitPrediction() {
    if (gameState !== 'PREDICTING' || !selectedExitLabel || isSubmitting) return;

    isSubmitting = true;
    setGameState('REVEALING');

    // Lock prediction controls
    const submitBtn = document.getElementById('pinballSubmitBtn');
    if (submitBtn) submitBtn.disabled = true;
    document.querySelectorAll('.choice-btn').forEach(b => (b.disabled = true));

    updatePhaseBanner('REVEALING', 'Tracing laser beam through optical reflection matrix...');

    // Restore the mirrors so player sees the geometry alongside the beam
    renderMirrors(currentPuzzle.reflectors);

    // Build the exact waypoints from outside entrance -> grid cells -> outside exit
    const waypoints = buildLaserWaypoints(currentPuzzle);

    // Animate laser beam through waypoints
    await animateLaserBeam(waypoints);

    // Reveal result
    handleRoundResult();
  }

  function buildLaserWaypoints(puzzle) {
    const waypoints = [];
    const startCoords = getBoundaryNodeCoords(puzzle.start_entry.label);

    // 1. Outside Start Node
    waypoints.push({ x: startCoords.x, y: startCoords.y, isReflector: false });

    // 2. Board edge entry point
    let entryEdgeX = startCoords.x;
    let entryEdgeY = startCoords.y;
    if (startCoords.side === 'LEFT') entryEdgeX = GRID_START;
    else if (startCoords.side === 'RIGHT') entryEdgeX = GRID_START + COLS * CELL_SIZE;
    else if (startCoords.side === 'TOP') entryEdgeY = GRID_START;
    else if (startCoords.side === 'BOTTOM') entryEdgeY = GRID_START + ROWS * CELL_SIZE;
    waypoints.push({ x: entryEdgeX, y: entryEdgeY, isReflector: false });

    // 3. Grid steps through cells
    puzzle.path.forEach(step => {
      const center = getCellCenter(step.row, step.col);
      waypoints.push({
        x: center.x,
        y: center.y,
        isReflector: !!step.mirror,
        mirror: step.mirror
      });
    });

    // 4. Board edge exit point
    const lastStep = puzzle.path[puzzle.path.length - 1];
    const lastCenter = getCellCenter(lastStep.row, lastStep.col);
    const exitDir = lastStep.exit_dir;
    let exitEdgeX = lastCenter.x;
    let exitEdgeY = lastCenter.y;

    if (exitDir === 'UP') exitEdgeY = GRID_START;
    else if (exitDir === 'DOWN') exitEdgeY = GRID_START + ROWS * CELL_SIZE;
    else if (exitDir === 'LEFT') exitEdgeX = GRID_START;
    else if (exitDir === 'RIGHT') exitEdgeX = GRID_START + COLS * CELL_SIZE;
    waypoints.push({ x: exitEdgeX, y: exitEdgeY, isReflector: false });

    // 5. Outside Exit Node
    const exitCoords = getBoundaryNodeCoords(puzzle.correct_label);
    waypoints.push({ x: exitCoords.x, y: exitCoords.y, isReflector: false });

    return waypoints;
  }

  // ----------------------------------------------------
  // SVG Laser Beam Animation & Reflection Sparks
  // ----------------------------------------------------
  function animateLaserBeam(waypoints) {
    return new Promise(resolve => {
      const laserGroup = document.getElementById('pinballLaserGroup');
      if (!laserGroup) {
        resolve();
        return;
      }
      laserGroup.innerHTML = '';

      // Check reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Polyline for the path
      const laserPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      laserPolyline.setAttribute('class', 'laser-beam-line');
      laserPolyline.setAttribute('filter', 'url(#laserBeamGlow)');
      laserPolyline.setAttribute('points', `${waypoints[0].x},${waypoints[0].y}`);
      laserGroup.appendChild(laserPolyline);

      // Glowing head spark circle
      const headCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      headCircle.setAttribute('cx', waypoints[0].x);
      headCircle.setAttribute('cy', waypoints[0].y);
      headCircle.setAttribute('r', '6');
      headCircle.setAttribute('class', 'laser-head-spark');
      laserGroup.appendChild(headCircle);

      if (prefersReducedMotion) {
        // Fast draw
        const pts = waypoints.map(p => `${p.x},${p.y}`).join(' ');
        laserPolyline.setAttribute('points', pts);
        const last = waypoints[waypoints.length - 1];
        headCircle.setAttribute('cx', last.x);
        headCircle.setAttribute('cy', last.y);
        resolve();
        return;
      }

      let currentSegment = 0;
      let progress = 0;
      const speed = 0.055; // segment speed
      let pointsStr = `${waypoints[0].x},${waypoints[0].y}`;

      function step() {
        if (currentSegment >= waypoints.length - 1) {
          resolve();
          return;
        }

        const pA = waypoints[currentSegment];
        const pB = waypoints[currentSegment + 1];

        progress += speed;
        if (progress >= 1) {
          progress = 1;
        }

        const curX = pA.x + (pB.x - pA.x) * progress;
        const curY = pA.y + (pB.y - pA.y) * progress;

        headCircle.setAttribute('cx', curX);
        headCircle.setAttribute('cy', curY);
        laserPolyline.setAttribute('points', `${pointsStr} ${curX},${curY}`);

        if (progress >= 1) {
          pointsStr += ` ${pB.x},${pB.y}`;
          currentSegment++;
          progress = 0;

          // Trigger spark burst if this point was a mirror reflection
          if (pB.isReflector) {
            triggerSparkBurst(pB.x, pB.y);
            // Brief pause at mirror to accentuate deflection
            setTimeout(() => {
              laserAnimFrameId = requestAnimationFrame(step);
            }, 90);
            return;
          }
        }

        laserAnimFrameId = requestAnimationFrame(step);
      }

      laserAnimFrameId = requestAnimationFrame(step);
    });
  }

  function triggerSparkBurst(x, y) {
    const laserGroup = document.getElementById('pinballLaserGroup');
    if (!laserGroup) return;

    for (let i = 0; i < 6; i++) {
      const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      spark.setAttribute('cx', x);
      spark.setAttribute('cy', y);
      spark.setAttribute('r', '2.5');
      spark.setAttribute('class', 'laser-reflection-spark');

      const angle = (Math.PI * 2 * i) / 6;
      const dist = 14 + Math.random() * 8;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      spark.style.setProperty('--tx', `${tx}px`);
      spark.style.setProperty('--ty', `${ty}px`);

      laserGroup.appendChild(spark);
      const tid = setTimeout(() => spark.remove(), 400);
      sparkTimeouts.push(tid);
    }
  }

  // ----------------------------------------------------
  // Phase 5: Result & Scoring
  // ----------------------------------------------------
  function handleRoundResult() {
    setGameState('RESULT');
    isSubmitting = false;

    const isCorrect = selectedExitLabel === currentPuzzle.correct_label;
    const correctNode = document.getElementById(`boundary-node-${currentPuzzle.correct_label}`);
    const selectedNode = document.getElementById(`boundary-node-${selectedExitLabel}`);

    if (correctNode) correctNode.classList.add('correct-node');
    if (!isCorrect && selectedNode) {
      selectedNode.classList.add('wrong-node');
    }

    const resultCard = document.getElementById('pinballResultCard');
    const resultHeader = document.getElementById('pinballResultHeader');
    const resultDetail = document.getElementById('pinballResultDetail');
    const nextBtn = document.getElementById('pinballNextBtn');
    const submitBtn = document.getElementById('pinballSubmitBtn');

    if (submitBtn) submitBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'inline-flex';
    if (resultCard) resultCard.style.display = 'block';

    if (isCorrect) {
      streak += 1;
      const earnedPts = 100 + (currentPuzzle.reflections_count * 25) + (streak > 1 ? streak * 10 : 0);
      score += earnedPts;
      level += 1;

      updatePhaseBanner('RESULT', `🎯 Correct! Laser deflected ${currentPuzzle.reflections_count} times to ${currentPuzzle.correct_label}! (+${earnedPts} pts)`);

      if (resultHeader) {
        resultHeader.innerHTML = `
          <div class="result-badge-success">
            <span style="font-size: 18px;">🎯</span>
            <strong>Spot-On Prediction! (+${earnedPts} pts)</strong>
          </div>
        `;
      }
      if (resultDetail) {
        resultDetail.innerHTML = `
          The laser entered at <strong>${currentPuzzle.start_entry.label}</strong>, deflected through 
          <strong>${currentPuzzle.reflections_count} diagonal mirrors</strong>, and successfully exited at 
          <strong>${currentPuzzle.correct_label}</strong> just as you predicted! Streak: <strong>${streak} 🔥</strong>.
        `;
      }

      // Submit score to backend
      fetch('/api/game/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: earnedPts, game_id: 'pinball' })
      }).catch(err => console.warn("Score submit fallback:", err));

    } else {
      streak = 0;
      updatePhaseBanner('RESULT', `❌ Close! Laser exited at ${currentPuzzle.correct_label}, but you predicted ${selectedExitLabel}.`);

      if (resultHeader) {
        resultHeader.innerHTML = `
          <div class="result-badge-wrong">
            <span style="font-size: 18px;">❌</span>
            <strong>Trajectory Missed!</strong>
          </div>
        `;
      }
      if (resultDetail) {
        resultDetail.innerHTML = `
          The beam exited at <strong style="color: #10B981;">${currentPuzzle.correct_label}</strong> 
          after <strong>${currentPuzzle.reflections_count} reflections</strong>, while you predicted 
          <strong style="color: #EF4444;">${selectedExitLabel}</strong>. Review the path above and try the next round!
        `;
      }
    }

    updateStatsDisplay();
  }

  // ----------------------------------------------------
  // Game State Helpers
  // ----------------------------------------------------
  function setGameState(state) {
    gameState = state;
    const boardWrapper = document.getElementById('pinballBoardWrapper');
    if (boardWrapper) {
      boardWrapper.setAttribute('data-state', state);
    }
  }

  function updatePhaseBanner(stateName, message) {
    const badge = document.getElementById('pinballPhaseBadge');
    const subtext = document.getElementById('pinballPhaseSubtext');

    if (badge) {
      badge.className = `phase-badge phase-${stateName.toLowerCase()}`;
      if (stateName === 'MEMORIZING') {
        badge.textContent = '👁️ MEMORIZE THE MIRRORS';
      } else if (stateName === 'PREDICTING') {
        badge.textContent = '🎯 PREDICT THE LASER EXIT';
      } else if (stateName === 'REVEALING') {
        badge.textContent = '⚡ TRACING LASER BEAM...';
      } else if (stateName === 'RESULT') {
        badge.textContent = '🏁 ROUND COMPLETE';
      } else {
        badge.textContent = 'READY';
      }
    }

    if (subtext) {
      subtext.textContent = message;
    }
  }

  function cleanupTimersAndAnimations() {
    if (countdownIntervalId) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }
    if (memorizationTimerId) {
      clearTimeout(memorizationTimerId);
      memorizationTimerId = null;
    }
    if (laserAnimFrameId) {
      cancelAnimationFrame(laserAnimFrameId);
      laserAnimFrameId = null;
    }
    sparkTimeouts.forEach(tid => clearTimeout(tid));
    sparkTimeouts = [];
  }

  // ----------------------------------------------------
  // Event Listeners Setup
  // ----------------------------------------------------
  function setupEventListeners() {
    const submitBtn = document.getElementById('pinballSubmitBtn');
    const nextBtn = document.getElementById('pinballNextBtn');
    const newBtn = document.getElementById('pinballNewBtn');
    const diffSelect = document.getElementById('pinballDifficulty');
    const durSelect = document.getElementById('pinballDuration');
    const rulesBtn = document.getElementById('pinballRulesBtn');
    const closeRulesBtn = document.getElementById('pinballCloseRulesBtn');
    const dismissRulesBtn = document.getElementById('pinballDismissRulesBtn');
    const rulesModal = document.getElementById('pinballRulesModal');

    if (submitBtn) {
      submitBtn.addEventListener('click', onSubmitPrediction);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        submitBtn.style.display = 'inline-flex';
        nextBtn.style.display = 'none';
        loadNewPuzzle();
      });
    }

    if (newBtn) {
      newBtn.addEventListener('click', () => {
        if (submitBtn) submitBtn.style.display = 'inline-flex';
        if (nextBtn) nextBtn.style.display = 'none';
        loadNewPuzzle();
      });
    }

    if (diffSelect) {
      diffSelect.addEventListener('change', () => {
        if (submitBtn) submitBtn.style.display = 'inline-flex';
        if (nextBtn) nextBtn.style.display = 'none';
        loadNewPuzzle();
      });
    }

    if (durSelect) {
      durSelect.addEventListener('change', () => {
        memorizationDuration = parseInt(durSelect.value, 10) || 6;
        try {
          localStorage.setItem('universe_pinball_memo_time', memorizationDuration);
        } catch (e) {}
      });
    }

    // Modal controls
    if (rulesBtn && rulesModal) {
      rulesBtn.addEventListener('click', () => rulesModal.classList.add('active'));
    }
    if (closeRulesBtn && rulesModal) {
      closeRulesBtn.addEventListener('click', () => rulesModal.classList.remove('active'));
    }
    if (dismissRulesBtn && rulesModal) {
      dismissRulesBtn.addEventListener('click', () => rulesModal.classList.remove('active'));
    }
    if (rulesModal) {
      rulesModal.addEventListener('click', (e) => {
        if (e.target === rulesModal) rulesModal.classList.remove('active');
      });
    }

    // Window cleanups
    window.addEventListener('beforeunload', cleanupTimersAndAnimations);
  }

  // Auto-start on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();

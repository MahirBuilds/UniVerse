// Attendance Management & Interactive Calculator
document.addEventListener('DOMContentLoaded', () => {
  const calcForm = document.getElementById('attendanceCalcForm');
  const subjectSelect = document.getElementById('calcSubjectSelect');
  const targetInput = document.getElementById('calcTargetInput');
  const resultBox = document.getElementById('calcResultBox');

  if (calcForm) {
    calcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      runCalculation();
    });
  }

  if (subjectSelect) {
    subjectSelect.addEventListener('change', runCalculation);
  }
  if (targetInput) {
    targetInput.addEventListener('input', runCalculation);
  }

  async function runCalculation() {
    if (!subjectSelect || !targetInput || !resultBox) return;

    const opt = subjectSelect.selectedOptions[0];
    if (!opt) return;

    const attended = parseInt(opt.getAttribute('data-attended') || 0);
    const conducted = parseInt(opt.getAttribute('data-conducted') || 0);
    const target = parseFloat(targetInput.value || 75.0);

    try {
      const res = await fetch('/api/attendance/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended, conducted, target })
      });
      const data = await res.json();

      let alertClass = 'badge-dark-green';
      if (!data.achievable) {
        alertClass = 'badge-red';
      } else if (data.needed_consecutive > 0) {
        alertClass = 'badge-yellow';
      }

      resultBox.innerHTML = `
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-top: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${escapeHtml(opt.text)}</span>
            <span class="badge ${alertClass}">${data.current_percentage}%</span>
          </div>
          <p style="font-size: 13.5px; color: var(--text-primary); margin-top: 4px;">
            ${escapeHtml(data.message)}
          </p>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">
            Attended: <strong>${attended}</strong> / Conducted: <strong>${conducted}</strong> • Target: <strong>${target}%</strong>
          </div>
        </div>
      `;
    } catch (err) {
      console.error("Calculation error:", err);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Run initial calculation if present
  if (calcForm) runCalculation();
});

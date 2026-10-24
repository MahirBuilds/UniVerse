// Interactive Academic Performance Chart (Chart.js)
let academicChartInstance = null;

function getChartColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    gridColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
    textColor: isLight ? '#64748B' : '#94A3B8',
    actualLine: isLight ? '#2563EB' : '#38BDF8',
    actualFill: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(56, 189, 248, 0.12)',
    targetLine: isLight ? '#0D9488' : '#14B8A6',
    projectedLine: '#F59E0B',
    tooltipBg: isLight ? '#FFFFFF' : '#101628',
    tooltipBorder: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    tooltipTitle: isLight ? '#111318' : '#F9FAFB',
    tooltipBody: isLight ? '#575A66' : '#94A3B8'
  };
}

function initAcademicChart(initialData) {
  const canvas = document.getElementById('academicProgressChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const colors = getChartColors();
  const ctx = canvas.getContext('2d');

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const fillGrad = ctx.createLinearGradient(0, 0, 0, 220);
  if (isLight) {
    fillGrad.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
    fillGrad.addColorStop(1, 'rgba(37, 99, 235, 0.00)');
  } else {
    fillGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
    fillGrad.addColorStop(1, 'rgba(56, 189, 248, 0.00)');
  }

  if (academicChartInstance) {
    academicChartInstance.destroy();
  }

  academicChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: initialData.chart.labels,
      datasets: [
        {
          label: 'Target Marks',
          data: initialData.chart.target_data,
          borderColor: colors.targetLine,
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 4,
          pointBackgroundColor: colors.targetLine,
          fill: false,
          tension: 0.3
        },
        {
          label: 'Actual Marks',
          data: initialData.chart.actual_data,
          borderColor: colors.actualLine,
          borderWidth: 2.5,
          backgroundColor: fillGrad,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: colors.actualLine,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 1.5,
          fill: true,
          tension: 0.35
        },
        {
          label: 'Projected Marks',
          data: initialData.chart.projected_data,
          borderColor: colors.projectedLine,
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 4,
          pointBackgroundColor: colors.projectedLine,
          fill: false,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: colors.textColor,
            font: { size: 11, weight: '600', family: "'Outfit', sans-serif" },
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipTitle,
          bodyColor: colors.tooltipBody,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          boxPadding: 5,
          cornerRadius: 10,
          callbacks: {
            label: function (context) {
              const val = context.parsed.y;
              return `${context.dataset.label}: ${val !== null ? val.toFixed(1) : 'N/A'} / 10`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: { color: colors.textColor, font: { size: 11 } }
        },
        y: {
          min: 0,
          max: 10,
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.textColor,
            font: { size: 11 },
            stepSize: 2
          }
        }
      }
    }
  });
}

async function loadSubjectAcademicData(subjectId) {
  try {
    const res = await fetch(`/api/academic/subject/${subjectId}`);
    if (!res.ok) throw new Error("Failed to load subject");
    const data = await res.json();

    // Update summary metrics in DOM
    const targetValEl = document.getElementById('academicTargetVal');
    const currentValEl = document.getElementById('academicCurrentVal');
    const requiredValEl = document.getElementById('academicRequiredVal');
    const requiredSubEl = document.getElementById('academicRequiredSub');

    if (targetValEl) targetValEl.textContent = `${data.target_marks.toFixed(1)} / 10`;
    if (currentValEl) currentValEl.textContent = `${data.current_marks.toFixed(1)} / 10`;
    if (requiredValEl) {
      if (data.is_possible) {
        requiredValEl.textContent = `${data.required_marks.toFixed(1)} / 10`;
        requiredValEl.style.color = '#FF6B6B';
        if (requiredSubEl) requiredSubEl.textContent = 'to reach target';
      } else {
        requiredValEl.textContent = 'N/A';
        requiredValEl.style.color = '#EF4444';
        if (requiredSubEl) requiredSubEl.textContent = 'Target impossible';
      }
    }

    initAcademicChart(data);
  } catch (err) {
    console.error("Error updating academic chart:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const subjectSelector = document.getElementById('academicSubjectSelect');
  if (subjectSelector) {
    subjectSelector.addEventListener('change', (e) => {
      loadSubjectAcademicData(e.target.value);
    });

    // Load initial subject
    loadSubjectAcademicData(subjectSelector.value);
  }

  // Update theme dynamically without reload
  window.addEventListener('universeThemeChanged', () => {
    if (subjectSelector) {
      loadSubjectAcademicData(subjectSelector.value);
    }
  });
});

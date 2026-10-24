// Theme Switcher Module
(function () {
  const THEME_KEY = 'universe_theme';

  function getPreferredTheme() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = urlParams.get('theme');
      if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme;
    } catch (e) {}
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update toggles in UI
    const toggles = document.querySelectorAll('.theme-switch-btn');
    toggles.forEach(toggle => {
      const darkIcon = toggle.querySelector('.icon-dark');
      const lightIcon = toggle.querySelector('.icon-light');
      if (darkIcon && lightIcon) {
        if (theme === 'dark') {
          darkIcon.classList.add('active');
          lightIcon.classList.remove('active');
        } else {
          lightIcon.classList.add('active');
          darkIcon.classList.remove('active');
        }
      }
    });

    // Notify any listening charts or canvas elements
    window.dispatchEvent(new CustomEvent('universeThemeChanged', { detail: { theme } }));
  }

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };

  // Immediate execution to prevent flash
  const initialTheme = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', initialTheme);

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(initialTheme);
    const btns = document.querySelectorAll('.theme-toggle-trigger');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.toggleTheme();
      });
    });
  });
})();

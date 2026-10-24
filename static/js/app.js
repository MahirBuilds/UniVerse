// Global App Logic: Clock, Search Modal, Notifications, Mobile Drawer
document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Live Clock
  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');

  function updateClock() {
    const now = new Date();
    // Use realistic simulated or actual time
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (dateEl) {
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-GB', options);
    }
  }
  updateClock();
  setInterval(updateClock, 30000);

  // 2. Mobile Drawer Navigation
  const mobileMenuBtn = document.getElementById('mobileMenuTrigger');
  const sidebar = document.getElementById('appSidebar');
  const mobileBackdrop = document.getElementById('mobileBackdrop');

  function toggleMobileMenu() {
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
      if (mobileBackdrop) {
        mobileBackdrop.classList.toggle('active', sidebar.classList.contains('mobile-open'));
      }
    }
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  }
  if (mobileBackdrop) {
    mobileBackdrop.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('mobile-open');
      mobileBackdrop.classList.remove('active');
    });
  }

  // 3. Notifications Dropdown
  const notifBtn = document.getElementById('notificationsBtn');
  const notifDropdown = document.getElementById('notificationsDropdown');
  const markAllReadBtn = document.getElementById('markAllRead');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove('active');
      }
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      const unreadItems = document.querySelectorAll('.notification-item.unread');
      unreadItems.forEach(item => item.classList.remove('unread'));
      const badge = document.querySelector('.notification-count');
      if (badge) badge.style.display = 'none';
    });
  }

  // 4. Global Search Modal (Ctrl + K)
  const searchModal = document.getElementById('searchModal');
  const searchTriggers = document.querySelectorAll('.search-trigger');
  const searchInput = document.getElementById('globalSearchInput');
  const searchResults = document.getElementById('searchResultsList');
  const closeSearchBtn = document.getElementById('closeSearchModal');

  function openSearch() {
    if (searchModal) {
      searchModal.classList.add('active');
      if (searchInput) {
        searchInput.value = '';
        setTimeout(() => searchInput.focus(), 100);
      }
      renderInitialSearch();
    }
  }

  function closeSearch() {
    if (searchModal) {
      searchModal.classList.remove('active');
    }
  }

  searchTriggers.forEach(trig => trig.addEventListener('click', openSearch));
  if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);

  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });
  }

  // Keyboard shortcut Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchModal && searchModal.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch();
      }
    } else if (e.key === 'Escape' && searchModal && searchModal.classList.contains('active')) {
      closeSearch();
    }
  });

  // Debounced search query
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 200);
    });
  }

  function renderInitialSearch() {
    if (!searchResults) return;
    searchResults.innerHTML = `
      <div style="padding: 18px; text-align: center; color: var(--text-secondary); font-size: 13px;">
        Type to search across <strong>Subjects</strong>, <strong>Faculty</strong>, <strong>Notices</strong>, <strong>Timetable</strong>, and <strong>Brain Gym</strong>...
      </div>
    `;
  }

  async function performSearch(query) {
    if (!searchResults) return;
    if (query.length < 2) {
      renderInitialSearch();
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        searchResults.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">
            No matching results found for "<strong>${escapeHtml(query)}</strong>"
          </div>
        `;
        return;
      }

      searchResults.innerHTML = data.results.map(item => `
        <a href="${item.url}" class="search-result-item">
          <div class="search-result-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div class="search-result-text">
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.subtitle)}</p>
          </div>
          <span class="search-result-category">${escapeHtml(item.category)}</span>
        </a>
      `).join('');
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
});

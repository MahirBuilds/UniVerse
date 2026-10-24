// AI Assistant Logic (Floating Bot & Full Chat Page)
document.addEventListener('DOMContentLoaded', () => {
  // ---------------- 1. FLOATING ASSISTANT ----------------
  const floatBtn = document.getElementById('floatingAssistantBtn');
  const floatPanel = document.getElementById('floatingAssistantPanel');
  const floatClose = document.getElementById('floatingCloseBtn');
  const floatSend = document.getElementById('floatingSendBtn');
  const floatInput = document.getElementById('floatingInput');
  const floatBody = document.getElementById('floatingPanelBody');
  const quickPills = document.querySelectorAll('.quick-action-pill, .quick-ai-btn');

  function openFloatingPanel() {
    if (floatPanel) {
      floatPanel.classList.add('open');
      if (floatInput) setTimeout(() => floatInput.focus(), 150);
    }
  }

  function closeFloatingPanel() {
    if (floatPanel) {
      floatPanel.classList.remove('open');
    }
  }

  if (floatBtn) {
    floatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (floatPanel.classList.contains('open')) {
        closeFloatingPanel();
      } else {
        openFloatingPanel();
      }
    });
  }

  if (floatClose) floatClose.addEventListener('click', closeFloatingPanel);

  // Quick Action Pills
  quickPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const promptText = pill.getAttribute('data-prompt') || pill.textContent.trim();
      openFloatingPanel();
      sendFloatingMessage(promptText);
    });
  });

  if (floatSend && floatInput) {
    floatSend.addEventListener('click', () => {
      const text = floatInput.value.trim();
      if (text) {
        sendFloatingMessage(text);
        floatInput.value = '';
      }
    });

    floatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = floatInput.value.trim();
        if (text) {
          sendFloatingMessage(text);
          floatInput.value = '';
        }
      }
    });
  }

  async function sendFloatingMessage(message) {
    if (!floatBody) return;

    // Append user bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.textContent = message;
    floatBody.appendChild(userBubble);
    floatBody.scrollTop = floatBody.scrollHeight;

    // Loading indicator
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble bot loading';
    loadingBubble.innerHTML = `<em>Thinking...</em>`;
    floatBody.appendChild(loadingBubble);
    floatBody.scrollTop = floatBody.scrollHeight;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message, mode: 'Flash' })
      });
      const data = await res.json();
      loadingBubble.remove();

      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble bot';
      // Simple markdown parser for headers/bold/lists
      botBubble.innerHTML = formatMarkdown(data.response);
      floatBody.appendChild(botBubble);
      floatBody.scrollTop = floatBody.scrollHeight;
    } catch (err) {
      loadingBubble.remove();
      const errBubble = document.createElement('div');
      errBubble.className = 'chat-bubble bot';
      errBubble.textContent = "Sorry, unable to process simulated query right now.";
      floatBody.appendChild(errBubble);
    }
  }

  // ---------------- 2. FULL AI ASSISTANT PAGE ----------------
  const chatMessagesArea = document.getElementById('fullChatMessages');
  const chatTextarea = document.getElementById('fullChatInput');
  const chatSendBtn = document.getElementById('fullChatSendBtn');
  const modelPills = document.querySelectorAll('.model-pill');
  let currentModel = 'Flash';

  modelPills.forEach(pill => {
    pill.addEventListener('click', () => {
      modelPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentModel = pill.getAttribute('data-model') || 'Flash';
      
      const badge = document.getElementById('activeModelBadge');
      if (badge) badge.textContent = `${currentModel} Mode Active`;
    });
  });

  if (chatSendBtn && chatTextarea) {
    chatSendBtn.addEventListener('click', sendFullChatMessage);
    chatTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendFullChatMessage();
      }
    });
  }

  async function sendFullChatMessage() {
    if (!chatTextarea || !chatMessagesArea) return;
    const msg = chatTextarea.value.trim();
    if (!msg) return;

    chatTextarea.value = '';

    // Append user message row
    const userRow = document.createElement('div');
    userRow.className = 'chat-message-row user';
    userRow.innerHTML = `
      <div class="chat-bubble-content">${escapeHtml(msg)}</div>
      <div class="chat-avatar-box">
        <img src="/static/images/avatar.svg" alt="User">
      </div>
    `;
    chatMessagesArea.appendChild(userRow);
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

    // Loading indicator
    const loadingRow = document.createElement('div');
    loadingRow.className = 'chat-message-row assistant';
    loadingRow.id = 'fullChatLoading';
    loadingRow.innerHTML = `
      <div class="chat-avatar-box">
        <img src="/static/images/robot_avatar.svg" alt="AI">
      </div>
      <div class="chat-bubble-content">
        <em>Analyzing with ${currentModel} engine...</em>
      </div>
    `;
    chatMessagesArea.appendChild(loadingRow);
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, mode: currentModel })
      });
      const data = await res.json();
      
      const loader = document.getElementById('fullChatLoading');
      if (loader) loader.remove();

      const botRow = document.createElement('div');
      botRow.className = 'chat-message-row assistant';
      botRow.innerHTML = `
        <div class="chat-avatar-box">
          <img src="/static/images/robot_avatar.svg" alt="AI">
        </div>
        <div class="chat-bubble-content">
          ${formatMarkdown(data.response)}
          <div style="margin-top: 8px; display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm copy-btn" onclick="copyToClipboard(this)">Copy</button>
          </div>
        </div>
      `;
      chatMessagesArea.appendChild(botRow);
      chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    } catch (err) {
      const loader = document.getElementById('fullChatLoading');
      if (loader) loader.remove();
    }
  }

  // Simple Markdown Formatter
  function formatMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 style="margin: 6px 0; color: var(--primary-accent);">$1</h4>');
    // Italics
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Bullet points
    html = html.replace(/^\* (.*$)/gim, '<li style="margin-left: 18px;">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li style="margin-left: 18px; list-style-type: decimal;">$1</li>');
    // Newlines
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  window.copyToClipboard = function(btn) {
    const bubble = btn.closest('.chat-bubble-content');
    if (bubble) {
      navigator.clipboard.writeText(bubble.innerText.replace('Copy', '').trim());
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    }
  };
});

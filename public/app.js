// Generate a unique session ID for the user
const sessionId = localStorage.getItem('jale_session_id') || crypto.randomUUID();
localStorage.setItem('jale_session_id', sessionId);

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');
const typingIndicator = document.getElementById('typing-indicator');
const themeBtn = document.getElementById('theme-btn');
const themeText = document.getElementById('theme-text');
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const toolsGrid = document.getElementById('tools-grid');
const agentsList = document.getElementById('agents-list');

let isWaitingForResponse = false;
let systemStatus = { agents: [], skills: [] };

// Initialize Dashboard
function init() {
  fetchSystemStatus();
  setupTabs();
  setupTheme();

  // Polling for updates every 10 seconds
  setInterval(fetchSystemStatus, 10000);
}

function renderTools(skills) {
  if (!toolsGrid || !skills) return;
  toolsGrid.innerHTML = skills
    .map(
      (tool) => `
    <div class="tool-card">
      <div class="tool-header">
        <span class="tool-emoji">${tool.emoji || '🔧'}</span>
        <span class="tool-name">${tool.displayName}</span>
      </div>
      <p class="tool-desc">Yetenek durumu: ${tool.enabled ? 'Aktif' : 'Pasif'}</p>
      <div class="tool-tags">
        <span class="tag ${tool.enabled ? 'online' : ''}">${tool.enabled ? 'Aktif' : 'Devre Dışı'}</span>
      </div>
    </div>
  `
    )
    .join('');
}

function renderAgents(agents) {
  if (!agentsList || !agents) return;
  agentsList.innerHTML = `
    <div class="swarm-overview">
      ${agents
        .map(
          (agent) => `
        <div class="agent-card">
          <div class="agent-avatar">${agent.name[0]}</div>
          <div class="agent-details">
            <h3 class="agent-name">${agent.name}</h3>
            <p class="agent-role">${agent.description || 'Sistem Ajanı'}</p>
            <div class="agent-meta">
              <span class="agent-model tag">${agent.lastActivity || 'Beklemede...'}</span>
              <span class="agent-status ${agent.status === 'Aktif' ? 'online' : ''}">${agent.status}</span>
            </div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

async function fetchSystemStatus() {
  try {
    const response = await fetch('/api/system-status');
    if (!response.ok) throw new Error('API hatası');
    const data = await response.json();
    systemStatus = data;
    renderTools(data.skills);
    renderAgents(data.agents);
  } catch (error) {
    console.error('Sistem durumu alınamadı:', error);
  }
}

function setupTabs() {
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');

      navItems.forEach((n) => n.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

function setupTheme() {
  const currentTheme = localStorage.getItem('jale_theme');
  if (currentTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (themeText) themeText.textContent = 'Açık Tema';
  }
}

// Chat Functions
function formatResponse(text) {
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${sender}-message`;
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  const p = document.createElement('p');
  if (sender === 'agent') {
    p.innerHTML = formatResponse(text);
  } else {
    p.textContent = text;
  }
  contentDiv.appendChild(p);
  msgDiv.appendChild(contentDiv);
  chatHistory.appendChild(msgDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message || isWaitingForResponse) return;

  addMessage(message, 'user');
  chatInput.value = '';
  isWaitingForResponse = true;
  typingIndicator.classList.remove('hidden');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });
    const data = await response.json();
    typingIndicator.classList.add('hidden');
    if (response.ok) {
      addMessage(data.reply, 'agent');
    } else {
      addMessage('Bir hata oluştu: ' + (data.error || 'Hata'), 'agent');
    }
  } catch (error) {
    typingIndicator.classList.add('hidden');
    addMessage('Sunucu hatası.', 'agent');
  } finally {
    isWaitingForResponse = false;
  }
});

themeBtn.addEventListener('click', () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('jale_theme', 'dark');
    themeText.textContent = 'Koyu Tema';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('jale_theme', 'light');
    themeText.textContent = 'Açık Tema';
  }
});

init();

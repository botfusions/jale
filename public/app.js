// Generate a unique session ID for the user
const sessionId = localStorage.getItem('jale_session_id') || crypto.randomUUID();
localStorage.setItem('jale_session_id', sessionId);

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');
const chatMain = document.getElementById('chat-container');
const typingIndicator = document.getElementById('typing-indicator');
const themeBtn = document.getElementById('theme-btn');

let isWaitingForResponse = false;

// Format Markdown-like text (very basic: bold, newlines)
function formatResponse(text) {
  // Replace **bold**
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Newlines to <br>
  formatted = formatted.replace(/\n/g, '<br>');
  // If it creates consecutive brs, we can let it be or wrap in paragraphs
  return formatted;
}

function scrollToBottom() {
  chatMain.scrollTop = chatMain.scrollHeight;
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
  scrollToBottom();
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const message = chatInput.value.trim();
  if (!message || isWaitingForResponse) return;

  // 1. Show user message
  addMessage(message, 'user');
  chatInput.value = '';

  // 2. Show typing indicator
  isWaitingForResponse = true;
  typingIndicator.classList.remove('hidden');
  scrollToBottom();

  // 3. Send to backend
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, sessionId }),
    });

    const data = await response.json();

    // Hide typing
    typingIndicator.classList.add('hidden');

    if (response.ok) {
      addMessage(data.reply, 'agent');
    } else {
      addMessage('Üzgünüm, bir hata oluştu: ' + (data.error || 'Bilinmeyen hata'), 'agent');
    }
  } catch (error) {
    typingIndicator.classList.add('hidden');
    addMessage('Sunucuya bağlanırken bir hata oluştu.', 'agent');
    console.error('Chat error:', error);
  } finally {
    isWaitingForResponse = false;
    chatInput.focus();
  }
});

// Theme switcher
themeBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (currentTheme === 'light') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('jale_theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('jale_theme', 'light');
  }
});

// Load saved theme
if (localStorage.getItem('jale_theme') === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
}

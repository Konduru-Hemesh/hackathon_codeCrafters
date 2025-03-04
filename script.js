// Mobile Navigation
const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const nav = document.querySelector('nav');

mobileNavToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    document.body.classList.toggle('nav-active');
});

// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');
const htmlElement = document.documentElement;

themeToggle.addEventListener('click', () => {
    htmlElement.classList.toggle('dark-theme');
    localStorage.setItem('theme', htmlElement.classList.contains('dark-theme') ? 'dark' : 'light');
});

// Set initial theme
if (localStorage.getItem('theme') === 'dark') {
    htmlElement.classList.add('dark-theme');
}

// Chat Functionality
const chatInput = document.querySelector('.chat-input');
const sendBtn = document.querySelector('.send-btn');
const chatMessages = document.querySelector('.chat-messages');
const newChatBtn = document.querySelector('.new-chat-btn');
const historyItems = document.querySelector('.history-items');

// ✅ Function to Load Chat History from Local Storage
function loadChatHistory(sessionId) {
    chatMessages.innerHTML = "";
    const storedHistory = JSON.parse(localStorage.getItem(`chat_${sessionId}`)) || [];
    storedHistory.forEach(({ user, bot }) => {
        sendMessage(user, true);
        sendMessage(bot, false);
    });
}

// ✅ Function to Save Chat History
function saveChatHistory(sessionId, userMessage, botResponse) {
    let history = JSON.parse(localStorage.getItem(`chat_${sessionId}`)) || [];
    history.push({ user: userMessage, bot: botResponse });
    localStorage.setItem(`chat_${sessionId}`, JSON.stringify(history));
}

// ✅ Function to Send Message to UI
async function sendMessage(text, isUser = true) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', isUser ? 'user' : 'bot');
    messageDiv.innerHTML = `
        <div class="avatar">${isUser ? 'U' : '🤖'}</div>
        <div>
            <div class="message-content">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// ✅ Handle Sending Prompt to Backend
sendBtn.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (!message) return;

    sendMessage(message); // Show user message
    chatInput.value = '';

    try {
        let response = await fetch("http://localhost:5000/generate-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_prompt: message }),
        });

        let data = await response.json();

        if (data.optimizedPrompt) {
            sendMessage(`🔹 Optimized Prompt:\n${data.optimizedPrompt}`, false);
            saveChatHistory(sessionStorage.getItem("currentChatId"), message, data.optimizedPrompt);
        } else {
            sendMessage("⚠️ Error: No optimized prompt received.", false);
        }
    } catch (error) {
        console.error("❌ Error communicating with backend:", error);
        sendMessage("⚠️ Server error. Please try again.", false);
    }
});

// ✅ New Chat (Creates a new session and saves previous history)
newChatBtn.addEventListener('click', () => {
    const chatId = `chat_${Date.now()}`;
    sessionStorage.setItem("currentChatId", chatId);

    const chatItem = document.createElement('div');
    chatItem.classList.add('history-item');
    chatItem.innerHTML = `
        <span class="history-text">Chat ${document.querySelectorAll('.history-item').length + 1}</span>
        <button class="delete-history">×</button>
    `;
    chatItem.dataset.chatId = chatId; // Store session ID
    historyItems.prepend(chatItem);

    chatMessages.innerHTML = "";
});

// ✅ Click on History to Restore Chat
historyItems.addEventListener('click', (e) => {
    if (e.target.classList.contains('history-text')) {
        const chatId = e.target.closest('.history-item').dataset.chatId;
        sessionStorage.setItem("currentChatId", chatId);
        loadChatHistory(chatId);
    }
});

// ✅ Delete Chat History
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-history')) {
        const chatItem = e.target.closest('.history-item');
        localStorage.removeItem(chatItem.dataset.chatId);
        chatItem.remove();
    }
});

// ✅ Load previous chat when the page loads
window.onload = () => {
    const existingChats = Object.keys(localStorage).filter((key) => key.startsWith("chat_"));
    existingChats.forEach((chatId) => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('history-item');
        chatItem.innerHTML = `
            <span class="history-text">${chatId.replace("chat_", "Chat ")}</span>
            <button class="delete-history">×</button>
        `;
        chatItem.dataset.chatId = chatId;
        historyItems.prepend(chatItem);
    });

    if (existingChats.length > 0) {
        sessionStorage.setItem("currentChatId", existingChats[0]);
        loadChatHistory(existingChats[0]);
    } else {
        sessionStorage.setItem("currentChatId", `chat_${Date.now()}`);
    }
};

/**
 * TrafficAI Common Shared Library
 * Handles state persistence (localStorage), Navbar links, Credits, and Toast Notifications
 */

const STORAGE_KEYS = {
    CREDITS: "traffic_ai_credits",
    HISTORY: "traffic_ai_history"
};

// Initialize State
function getStoredCredits() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem("traffic_ai_last_reset");
    const val = localStorage.getItem(STORAGE_KEYS.CREDITS);

    // Reset only on a new day or if no credits have been stored yet
    if (lastReset !== today || val === null) {
        localStorage.setItem("traffic_ai_last_reset", today);
        setStoredCredits(50);
        return 50;
    }

    return parseInt(val, 10);
}

function setStoredCredits(val) {
    localStorage.setItem(STORAGE_KEYS.CREDITS, val.toString());
    updateCreditDisplay(val);
}

function getStoredHistory() {
    const val = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return val ? JSON.parse(val) : [];
}

function saveHistoryItem(item) {
    const history = getStoredHistory();
    history.unshift(item);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

function clearStoredHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

function updateCreditDisplay(count) {
    const el = document.getElementById("creditCount");
    if (el) {
        el.textContent = count !== undefined ? count : getStoredCredits();
    }
}

// Toast Notification System (Anime Alert Badges)
function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const badgeLabel = type === 'error' ? 'ALERT // 警告' : (type === 'success' ? 'SUCCESS // 完了' : 'SYS // 通知');
    const icon = type === 'error' ? '⚠️' : (type === 'success' ? '🎯' : '⚡');

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span style="color: var(--anime-yellow); font-weight: 900; margin-right: 4px;">[${badgeLabel}]</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.2s ease';
        setTimeout(() => toast.remove(), 200);
    }, 3500);
}

// Active Nav Highlighter
function highlightActiveNav() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll("nav a");

    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href === currentPath || (currentPath === "" && href === "index.html")) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}

// Setup Mobile Navigation Toggle
function setupMobileMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("nav");

    if (toggle && nav) {
        toggle.addEventListener("click", () => {
            nav.classList.toggle("open");
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateCreditDisplay();
    highlightActiveNav();
    setupMobileMenu();
});

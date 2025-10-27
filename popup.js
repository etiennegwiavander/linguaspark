// LinguaSpark Extension Popup Script

// Global state for admin status
let isAdminUser = false;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('[LinguaSpark] Popup script loaded');
    
    // Check if this is being opened as a tab (from content script)
    const urlParams = new URLSearchParams(window.location.search);
    const isTab = urlParams.get('tab') === 'true';
    const source = urlParams.get('source');
    
    if (isTab) {
        // Redirect to the full Next.js application
        console.log('[LinguaSpark] Redirecting to full interface...');
        window.location.href = 'http://localhost:3000/popup?source=' + (source || 'extension');
    } else {
        // This is the popup - check admin status and show interface options
        checkAdminStatus().then(() => {
            showPopupInterface();
        });
    }
});

function showPopupInterface() {
    const popupContent = document.getElementById('popup-content');
    if (!popupContent) return;
    
    popupContent.innerHTML = `
        <div class="redirect-message">
            <h3>🎯 LinguaSpark</h3>
            <p>Click below to open the full lesson generator interface:</p>
            <button id="open-interface-btn" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                margin: 10px 0;
                width: 100%;
            ">Open Lesson Generator</button>
            <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                Or visit any educational webpage and look for the Sparky button!
            </p>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">
            <div style="font-size: 11px; color: #95a5a6;">
                <p><strong>How to use Sparky:</strong></p>
                <ul style="margin: 5px 0; padding-left: 15px;">
                    <li>Visit BBC News, Wikipedia, or Medium</li>
                    <li>Look for the floating Sparky button</li>
                    <li>Click to extract content and create lessons!</li>
                </ul>
            </div>
        </div>
    `;
    
    // Add event listener to the button
    const openBtn = document.getElementById('open-interface-btn');
    if (openBtn) {
        openBtn.addEventListener('click', openFullInterface);
    }
}

function openFullInterface() {
    console.log('[LinguaSpark] Opening full interface...');
    
    if (chrome && chrome.tabs) {
        chrome.tabs.create({
            url: 'http://localhost:3000'
        }, function(tab) {
            console.log('[LinguaSpark] Opened tab:', tab.id);
            window.close();
        });
    } else {
        // Fallback for when chrome.tabs is not available
        window.open('http://localhost:3000', '_blank');
        window.close();
    }
}

/**
 * Check if the current user has admin privileges
 * Stores admin status in chrome.storage for use throughout the extension
 */
async function checkAdminStatus() {
    try {
        console.log('[LinguaSpark] Checking admin status...');
        
        // Get the current user's session from the web app
        const response = await fetch('http://localhost:3000/api/auth/session', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.log('[LinguaSpark] No active session found');
            isAdminUser = false;
            currentUserId = null;
            chrome.storage.local.set({ isAdmin: false, userId: null });
            return;
        }
        
        const sessionData = await response.json();
        
        if (!sessionData.user || !sessionData.user.id) {
            console.log('[LinguaSpark] No user in session');
            isAdminUser = false;
            currentUserId = null;
            chrome.storage.local.set({ isAdmin: false, userId: null });
            return;
        }
        
        currentUserId = sessionData.user.id;
        
        // Check admin status via API
        const adminCheckResponse = await fetch('http://localhost:3000/api/admin/check-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ userId: currentUserId })
        });
        
        if (adminCheckResponse.ok) {
            const adminData = await adminCheckResponse.json();
            isAdminUser = adminData.isAdmin === true;
            console.log('[LinguaSpark] Admin status:', isAdminUser);
        } else {
            isAdminUser = false;
            console.log('[LinguaSpark] Admin check failed');
        }
        
        // Store in chrome.storage for access from content scripts
        chrome.storage.local.set({ 
            isAdmin: isAdminUser, 
            userId: currentUserId 
        });
        
    } catch (error) {
        console.error('[LinguaSpark] Error checking admin status:', error);
        isAdminUser = false;
        currentUserId = null;
        chrome.storage.local.set({ isAdmin: false, userId: null });
    }
}
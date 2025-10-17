// LinguaSpark Extension Popup Script

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
        // This is the popup - show interface options
        showPopupInterface();
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
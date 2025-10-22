# Enhanced Ghost Mascot with Blinking Eyes and Contextual Animations
Write-Host "🎨 Applying Enhanced Ghost Mascot with Blinking Eyes..." -ForegroundColor Cyan

# Read the base64 ghost image
$ghostBase64 = Get-Content "public/mascot.txt" -Raw

# Update content.js with enhanced mascot functionality
$contentJs = @"
// LinguaSpark Content Script - Enhanced Ghost Mascot with Blinking
(() => {
  console.log("[LinguaSpark] Enhanced Ghost Mascot Content Script Loaded");

  let buttonInstance = null;
  let isInitialized = false;
  let blinkInterval = null;
  let animationState = 'idle';

  // Ghost mascot states with blinking patterns
  const MASCOT_STATES = {
    idle: {
      animation: 'float 3s ease-in-out infinite',
      blinkInterval: [6000, 10000], // Random blinks every 6-10 seconds
      blinkDuration: 150,
      glow: 'none'
    },
    reading: {
      animation: 'float 3s ease-in-out infinite, tilt 2s ease-in-out infinite',
      blinkInterval: [8000, 12000], // Slower, focused blinks
      blinkDuration: 200,
      glow: '0 0 20px rgba(59, 130, 246, 0.5)'
    },
    thinking: {
      animation: 'sway 2s ease-in-out infinite',
      blinkInterval: [3000, 5000], // More frequent blinks
      blinkDuration: 120,
      glow: '0 0 25px rgba(59, 130, 246, 0.7)'
    },
    success: {
      animation: 'bounce 0.6s ease-in-out',
      blinkInterval: [500, 800], // Excited double-blink
      blinkDuration: 100,
      glow: '0 0 30px rgba(34, 197, 94, 0.8)'
    },
    error: {
      animation: 'sway 1.5s ease-in-out infinite',
      blinkInterval: [4000, 6000], // Longer, concerned blinks
      blinkDuration: 250,
      glow: '0 0 25px rgba(239, 68, 68, 0.7)'
    }
  };

  // Initialize button
  function initializeExtractButton() {
    if (isInitialized) return;
    console.log("[LinguaSpark] Initializing enhanced ghost mascot...");
    
    createFloatingButton();
    isInitialized = true;
  }

  // Create floating button with ghost mascot
  function createFloatingButton() {
    if (buttonInstance) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'linguaspark-extract-button';
    buttonContainer.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    \`;

    const button = document.createElement('button');
    button.className = 'linguaspark-button';
    button.style.cssText = \`
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: white;
      border: 3px solid #3b82f6;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      overflow: hidden;
      position: relative;
    \`;

    // Create ghost container with eyes
    const ghostContainer = document.createElement('div');
    ghostContainer.className = 'ghost-container';
    ghostContainer.style.cssText = \`
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    \`;

    // Ghost image
    const ghostImg = document.createElement('img');
    ghostImg.src = 'data:image/png;base64,${ghostBase64}';
    ghostImg.alt = 'LinguaSpark Ghost';
    ghostImg.style.cssText = \`
      width: 48px;
      height: 48px;
      object-fit: contain;
      pointer-events: none;
    \`;

    // Eyes overlay (positioned on top of ghost)
    const eyesContainer = document.createElement('div');
    eyesContainer.className = 'ghost-eyes';
    eyesContainer.style.cssText = \`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 48px;
      height: 48px;
      pointer-events: none;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    \`;

    // Left eye
    const leftEye = document.createElement('div');
    leftEye.className = 'ghost-eye left-eye';
    leftEye.style.cssText = \`
      width: 6px;
      height: 6px;
      background: #1f2937;
      border-radius: 50%;
      transition: height 0.1s ease;
    \`;

    // Right eye
    const rightEye = document.createElement('div');
    rightEye.className = 'ghost-eye right-eye';
    rightEye.style.cssText = \`
      width: 6px;
      height: 6px;
      background: #1f2937;
      border-radius: 50%;
      transition: height 0.1s ease;
    \`;

    eyesContainer.appendChild(leftEye);
    eyesContainer.appendChild(rightEye);
    ghostContainer.appendChild(ghostImg);
    ghostContainer.appendChild(eyesContainer);
    button.appendChild(ghostContainer);
    buttonContainer.appendChild(button);
    document.body.appendChild(buttonContainer);

    buttonInstance = button;

    // Start idle animation and blinking
    setMascotState('idle');

    // Button click handler
    button.addEventListener('click', handleButtonClick);

    console.log("[LinguaSpark] Enhanced ghost mascot created successfully");
  }

  // Set mascot state with animation and blinking
  function setMascotState(state) {
    if (!buttonInstance) return;
    
    animationState = state;
    const stateConfig = MASCOT_STATES[state];
    
    const ghostImg = buttonInstance.querySelector('img');
    const button = buttonInstance;
    
    // Apply animation
    ghostImg.style.animation = stateConfig.animation;
    
    // Apply glow
    button.style.boxShadow = \`0 4px 12px rgba(0, 0, 0, 0.15), \${stateConfig.glow}\`;
    
    // Restart blinking with new pattern
    startBlinking(stateConfig);
    
    console.log(\`[LinguaSpark] Mascot state: \${state}\`);
  }

  // Blinking mechanism
  function startBlinking(stateConfig) {
    // Clear existing blink interval
    if (blinkInterval) {
      clearInterval(blinkInterval);
    }
    
    const blink = () => {
      const eyes = buttonInstance.querySelectorAll('.ghost-eye');
      
      // Close eyes
      eyes.forEach(eye => {
        eye.style.height = '1px';
      });
      
      // Open eyes after blink duration
      setTimeout(() => {
        eyes.forEach(eye => {
          eye.style.height = '6px';
        });
      }, stateConfig.blinkDuration);
    };
    
    // Schedule random blinks
    const scheduleNextBlink = () => {
      const [min, max] = stateConfig.blinkInterval;
      const delay = Math.random() * (max - min) + min;
      
      blinkInterval = setTimeout(() => {
        blink();
        scheduleNextBlink();
      }, delay);
    };
    
    scheduleNextBlink();
  }

  // Handle button click
  function handleButtonClick() {
    console.log("[LinguaSpark] Ghost mascot clicked!");
    
    // Change to thinking state
    setMascotState('thinking');
    
    // Simulate extraction process
    setTimeout(() => {
      // Success state
      setMascotState('success');
      
      // Return to idle after celebration
      setTimeout(() => {
        setMascotState('idle');
      }, 2000);
    }, 3000);
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtractButton);
  } else {
    initializeExtractButton();
  }
})();
"@

Write-Host "📝 Writing enhanced content.js..." -ForegroundColor Yellow
$contentJs | Out-File -FilePath "content.js" -Encoding UTF8 -NoNewline

# Update content.css with enhanced animations
$contentCss = @"
/* LinguaSpark Enhanced Ghost Mascot Styles */

.linguaspark-button {
  transition: all 0.3s ease;
}

.linguaspark-button:hover {
  transform: scale(1.05);
}

.linguaspark-button:active {
  transform: scale(0.95);
}

/* Ghost container */
.ghost-container {
  position: relative;
}

/* Mascot Animations */
@keyframes float {
  0%, 100% { 
    transform: translateY(0px); 
  }
  50% { 
    transform: translateY(-8px); 
  }
}

@keyframes tilt {
  0%, 100% { 
    transform: rotate(-1deg); 
  }
  50% { 
    transform: rotate(1deg); 
  }
}

@keyframes sway {
  0%, 100% { 
    transform: translateX(0px) rotate(0deg); 
  }
  25% { 
    transform: translateX(-3px) rotate(-1deg); 
  }
  75% { 
    transform: translateX(3px) rotate(1deg); 
  }
}

@keyframes bounce {
  0%, 100% { 
    transform: translateY(0px) scale(1); 
  }
  25% { 
    transform: translateY(-15px) scale(1.05); 
  }
  50% { 
    transform: translateY(-8px) scale(1.02); 
  }
  75% { 
    transform: translateY(-12px) scale(1.03); 
  }
}

/* Smooth transitions for all mascot states */
.linguaspark-button img {
  transition: filter 0.3s ease, transform 0.3s ease;
}

/* Eye blinking */
.ghost-eye {
  transition: height 0.1s ease;
}

/* Accessibility */
.linguaspark-button:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .linguaspark-button img,
  .ghost-container {
    animation: none !important;
  }
}
"@

Write-Host "📝 Writing enhanced content.css..." -ForegroundColor Yellow
$contentCss | Out-File -FilePath "content.css" -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✅ Enhanced Ghost Mascot Applied Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🎭 Features Added:" -ForegroundColor Cyan
Write-Host "  ✨ Blinking Eyes - Natural blinking that varies by state" -ForegroundColor White
Write-Host "     • Idle: Random blinks every 6-10 seconds" -ForegroundColor Gray
Write-Host "     • Reading: Slower, focused blinks (8-12s)" -ForegroundColor Gray
Write-Host "     • Thinking: More frequent blinks (3-5s)" -ForegroundColor Gray
Write-Host "     • Success: Excited double-blink (0.5-0.8s)" -ForegroundColor Gray
Write-Host "     • Error: Longer, concerned blinks (4-6s)" -ForegroundColor Gray
Write-Host ""
Write-Host "  🎬 Contextual Animations:" -ForegroundColor White
Write-Host "     • Idle: Gentle floating motion" -ForegroundColor Gray
Write-Host "     • Reading: Floating + subtle tilt" -ForegroundColor Gray
Write-Host "     • Thinking: Sway motion with blue glow" -ForegroundColor Gray
Write-Host "     • Success: Celebratory bounce with green glow" -ForegroundColor Gray
Write-Host "     • Error: Concerned sway with red glow" -ForegroundColor Gray
Write-Host ""
Write-Host "  🔧 Bug Fixes:" -ForegroundColor White
Write-Host "     • Fixed star reversion issue on click" -ForegroundColor Gray
Write-Host "     • Ghost mascot now persists through all states" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Go to chrome://extensions/" -ForegroundColor White
Write-Host "  2. Click 'Reload' on LinguaSpark extension" -ForegroundColor White
Write-Host "  3. Close all old tabs with the extension" -ForegroundColor White
Write-Host "  4. Open a new webpage to test" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your ghost mascot now has personality!" -ForegroundColor Magenta

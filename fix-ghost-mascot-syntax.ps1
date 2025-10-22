# Fix Ghost Mascot Syntax Error
Write-Host "🔧 Fixing Ghost Mascot Syntax Error..." -ForegroundColor Cyan

# Read the base64 ghost image
$ghostBase64 = Get-Content "public/mascot.txt" -Raw

# Create the fixed content.js with proper escaping
$contentJsContent = @'
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
      blinkInterval: [6000, 10000],
      blinkDuration: 150,
      glow: 'none'
    },
    reading: {
      animation: 'float 3s ease-in-out infinite, tilt 2s ease-in-out infinite',
      blinkInterval: [8000, 12000],
      blinkDuration: 200,
      glow: '0 0 20px rgba(59, 130, 246, 0.5)'
    },
    thinking: {
      animation: 'sway 2s ease-in-out infinite',
      blinkInterval: [3000, 5000],
      blinkDuration: 120,
      glow: '0 0 25px rgba(59, 130, 246, 0.7)'
    },
    success: {
      animation: 'bounce 0.6s ease-in-out',
      blinkInterval: [500, 800],
      blinkDuration: 100,
      glow: '0 0 30px rgba(34, 197, 94, 0.8)'
    },
    error: {
      animation: 'sway 1.5s ease-in-out infinite',
      blinkInterval: [4000, 6000],
      blinkDuration: 250,
      glow: '0 0 25px rgba(239, 68, 68, 0.7)'
    }
  };

  function initializeExtractButton() {
    if (isInitialized) return;
    console.log("[LinguaSpark] Initializing enhanced ghost mascot...");
    
    createFloatingButton();
    isInitialized = true;
  }

  function createFloatingButton() {
    if (buttonInstance) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'linguaspark-extract-button';
    buttonContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;

    const button = document.createElement('button');
    button.className = 'linguaspark-button';
    button.style.cssText = `
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
    `;

    const ghostContainer = document.createElement('div');
    ghostContainer.className = 'ghost-container';
    ghostContainer.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const ghostImg = document.createElement('img');
    ghostImg.src = 'data:image/png;base64,GHOSTBASE64PLACEHOLDER';
    ghostImg.alt = 'LinguaSpark Ghost';
    ghostImg.style.cssText = `
      width: 48px;
      height: 48px;
      object-fit: contain;
      pointer-events: none;
    `;

    const eyesContainer = document.createElement('div');
    eyesContainer.className = 'ghost-eyes';
    eyesContainer.style.cssText = `
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
    `;

    const leftEye = document.createElement('div');
    leftEye.className = 'ghost-eye left-eye';
    leftEye.style.cssText = `
      width: 6px;
      height: 6px;
      background: #1f2937;
      border-radius: 50%;
      transition: height 0.1s ease;
    `;

    const rightEye = document.createElement('div');
    rightEye.className = 'ghost-eye right-eye';
    rightEye.style.cssText = `
      width: 6px;
      height: 6px;
      background: #1f2937;
      border-radius: 50%;
      transition: height 0.1s ease;
    `;

    eyesContainer.appendChild(leftEye);
    eyesContainer.appendChild(rightEye);
    ghostContainer.appendChild(ghostImg);
    ghostContainer.appendChild(eyesContainer);
    button.appendChild(ghostContainer);
    buttonContainer.appendChild(button);
    document.body.appendChild(buttonContainer);

    buttonInstance = button;

    setMascotState('idle');
    button.addEventListener('click', handleButtonClick);

    console.log("[LinguaSpark] Enhanced ghost mascot created successfully");
  }

  function setMascotState(state) {
    if (!buttonInstance) return;
    
    animationState = state;
    const stateConfig = MASCOT_STATES[state];
    
    const ghostImg = buttonInstance.querySelector('img');
    const button = buttonInstance;
    
    ghostImg.style.animation = stateConfig.animation;
    button.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.15), ${stateConfig.glow}`;
    
    startBlinking(stateConfig);
    
    console.log(`[LinguaSpark] Mascot state: ${state}`);
  }

  function startBlinking(stateConfig) {
    if (blinkInterval) {
      clearInterval(blinkInterval);
    }
    
    const blink = () => {
      const eyes = buttonInstance.querySelectorAll('.ghost-eye');
      
      eyes.forEach(eye => {
        eye.style.height = '1px';
      });
      
      setTimeout(() => {
        eyes.forEach(eye => {
          eye.style.height = '6px';
        });
      }, stateConfig.blinkDuration);
    };
    
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

  function handleButtonClick() {
    console.log("[LinguaSpark] Ghost mascot clicked!");
    
    setMascotState('thinking');
    
    setTimeout(() => {
      setMascotState('success');
      
      setTimeout(() => {
        setMascotState('idle');
      }, 2000);
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtractButton);
  } else {
    initializeExtractButton();
  }
})();
'@

# Replace placeholder with actual base64
$contentJsContent = $contentJsContent -replace 'GHOSTBASE64PLACEHOLDER', $ghostBase64

Write-Host "📝 Writing fixed content.js..." -ForegroundColor Yellow
$contentJsContent | Out-File -FilePath "content.js" -Encoding UTF8 -NoNewline

Write-Host "✅ Syntax error fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Go to chrome://extensions/" -ForegroundColor White
Write-Host "  2. Click 'Reload' on LinguaSpark extension" -ForegroundColor White
Write-Host "  3. Test on a webpage" -ForegroundColor White

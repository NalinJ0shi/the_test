        const videoElement = document.getElementById('video');
        const canvasElement = document.getElementById('canvas');
        const customCursor = document.getElementById('customCursor');
        const statusOverlay = document.getElementById('statusOverlay');

        const colorsBtn = document.getElementById('colorsBtn');
        const numbersBtn = document.getElementById('numbersBtn');
        const animalsBtn = document.getElementById('animalsBtn');
        const alphabetsBtn = document.getElementById('alphabetsBtn');
        const mainContent = document.getElementById('mainContent');
        const sidebar = document.querySelector('.sidebar'); // Get sidebar element

        // Onboarding elements
        const onboardingOverlay = document.getElementById('onboardingOverlay');
        const onboardingTitle = document.getElementById('onboardingTitle');
        const onboardingInstruction = document.getElementById('onboardingInstruction');
        const onboardingButton = document.getElementById('onboardingButton');

        // Pause elements
        const pauseBtn = document.getElementById('pauseBtn');
        const pauseOverlay = document.getElementById('pauseOverlay');
        const resumeBtn = document.getElementById('resumeBtn');

        // Removed colorGradingBtn constant

        // --- Onboarding State Variables ---
        let isOnboardingActive = true;
        let onboardingStage = 0; // 0: Click to Start, 1: Move Hand, 2: Good Job (Move), 3: Curl Fingers, 4: Good Job (Fist), 5: Complete
        let lastCursorX = 0;
        let lastCursorY = 0;
        let lastMoveDetectTime = 0;
        const MOVE_DETECTION_THRESHOLD = 50; // Pixels
        const MOVE_DEBOUNCE_TIME = 1000; // 1 second
        const GOOD_JOB_DISPLAY_TIME = 1500; // 1.5 seconds

        // --- Pause State Variable ---
        let isPaused = false;

        // --- Audio Setup ---
        // IMPORTANT: Ensure you have audio files in the specified paths relative to your HTML file.
        // For example, 'numbers/one.mp3' means a 'numbers' folder containing 'one.mp3'.
        // If files are missing or paths are incorrect, audio will not play.
        const audioMap = {
            numbers: {
                "ONE": new Audio('numbers/one.mp3'),
                "TWO": new Audio('numbers/two.mp3'),
                "THREE": new Audio('numbers/three.mp3'),
                "FOUR": new Audio('numbers/four.mp3'),
                "FIVE": new Audio('numbers/five.mp3'),
                "SIX": new Audio('numbers/six.mp3'),
                "SEVEN": new Audio('numbers/seven.mp3'),
                "EIGHT": new Audio('numbers/eight.mp3'),
                "NINE": new Audio('numbers/nine.mp3'),
                "TEN": new Audio('numbers/ten.mp3'),
                "ZERO": new Audio('numbers/zero.mp3'),
            },
            colors: {
                 "RED": new Audio('colors/red.mp3'),
                 "YELLOW": new Audio('colors/yellow.mp3'),
                 "BLUE": new Audio('colors/blue.mp3'),
                 "GREEN": new Audio('colors/green.mp3'),
                 "PURPLE": new Audio('colors/purple.mp3'),
                 "PINK": new Audio('colors/pink.mp3'),
                 "BROWN": new Audio('colors/brown.mp3'),
                 "BLACK": new Audio('colors/black.mp3'),
                 "WHITE": new Audio('colors/white.mp3')
            },
            animals: {
                "DOG": new Audio('animals/dog.mp3'),
                "CAT": new Audio('animals/cat.mp3'),
                "LION": new Audio('animals/lion.mp3'),
                "ELEPHANT": new Audio('animals/elephant.mp3'),
                "MONKEY": new Audio('animals/monkey.mp3'),
                "DUCK": new Audio('animals/duck.mp3'),
                "COW": new Audio('animals/cow.mp3'),
            },
            alphabets: {
                // For English:
                "A": new Audio('alphabets/A.mp3'),
                "B": new Audio('alphabets/B.mp3'),
                "C": new Audio('alphabets/C.mp3'),
                "D": new Audio('alphabets/D.mp3'),
                "E": new Audio('alphabets/E.mp3'),
                "F": new Audio('alphabets/F.mp3'),
                "G": new Audio('alphabets/G.mp3'),
                "H": new Audio('alphabets/H.mp3'),
                "I": new Audio('alphabets/I.mp3'),
                "J": new Audio('alphabets/J.mp3'),
                "K": new Audio('alphabets/K.mp3'),
                "L": new Audio('alphabets/L.mp3'),
                "M": new Audio('alphabets/M.mp3'),
                "N": new Audio('alphabets/N.mp3'),
                "O": new Audio('alphabets/O.mp3'),
                "P": new Audio('alphabets/P.mp3'),
                "Q": new Audio('alphabets/Q.mp3'),
                "R": new Audio('alphabets/R.mp3'),
                "S": new Audio('alphabets/S.mp3'),
                "T": new Audio('alphabets/T.mp3'),


                // For Hindi Swar (Vowels):
                "अ": new Audio('hindi/hindi_a.mp3'),
                "आ": new Audio('hindi/aaM.mp3'),
                "इ": new Audio('hindi/e-2.mp3'),
                "ई": new Audio('hindi/e-2.mp3'),
                "उ": new Audio('hindi/ooo.mp3'),
                "ऊ": new Audio('hindi/ooo.mp3'),
                "ऋ": new Audio('hindi/ru.mp3'),
                "ए": new Audio('hindi/AA.mp3'),
                "ऐ": new Audio('hindi/Aye.mp3'),
                "ओ": new Audio('hindi/OO.mp3'),
                "औ": new Audio('hindi/OW.mp3'),
                "अं": new Audio('hindi/Ang.mp3'),
                "अः": new Audio('hindi/Aha.mp3'),
            },
            system: { // New category for system sounds like clicks
                "click": new Audio('click.mp3'),
                "good_job": new Audio('correct.mp3') // Add a good job sound
            }
        };

        // Preload audio files and set volume
        for (const category in audioMap) {
            for (const item in audioMap[category]) {
                audioMap[category][item].volume = 0.7;
                audioMap[category][item].load();
            }
        }

        // Centralized function to play audio
        function playItemAudio(category, itemName) {
            if (audioMap[category] && audioMap[category][itemName]) {
                audioMap[category][itemName].currentTime = 0; // Rewind to start
                audioMap[category][itemName].play().catch(e => console.error(`Audio playback error for ${itemName} in ${category}:`, e));
            } else {
                console.warn(`No audio found for ${category} - ${itemName}`);
            }
        }
        // --- End Audio Setup ---

        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        let fistGestureDetected = false;
        const CLICK_DEBOUNCE_TIME = 500;

        // --- State for Finger Counting ---
        let lastTotalFingerCount = -1;
        let lastFingerCountUpdateTime = 0;
        const FINGER_COUNT_DEBOUNCE_TIME = 800;
        // --- End State ---

        // --- Dwell-to-Click State for Buttons ---
        let hoveredButton = null;
        let hoverStartTime = 0;
        const DWELL_TIME_THRESHOLD = 1000; // 1 second
        // --- End Dwell-to-Click State ---

        // --- Alphabet Language State ---
        let isHindiAlphabet = false; // false for English, true for Hindi
        // --- End Alphabet Language State ---

        hands.onResults(onResults);

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });

        // Start camera only after onboarding is complete or user clicks start
        // camera.start(); // Moved to onboarding completion

        // Helper function to calculate distance between two landmarks
        function getDistance(p1, p2) {
            return Math.sqrt(
                Math.pow(p1.x - p2.x, 2) +
                Math.pow(p1.y - p2.y, 2) +
                Math.pow(p1.z - p2.z, 2)
            );
        }

        // Helper function to detect if a hand is a "fist"
        function isHandAFist(landmarks) {
            const indexFingerTip = landmarks[8];
            const middleFingerTip = landmarks[12];
            const ringFingerTip = landmarks[16];
            const pinkyTip = landmarks[20];

            const indexFingerPIP = landmarks[6];
            const middleFingerPIP = landmarks[10];
            const ringFingerPIP = landmarks[14];
            const pinkyFingerPIP = landmarks[18];

            const sensitivityThreshold = 0.03;

            const fingersCurled =
                (indexFingerTip.y > indexFingerPIP.y + sensitivityThreshold) &&
                (middleFingerTip.y > middleFingerPIP.y + sensitivityThreshold) &&
                (ringFingerTip.y > ringFingerPIP.y + sensitivityThreshold) &&
                (pinkyTip.y > pinkyFingerPIP.y + sensitivityThreshold);

            return fingersCurled;
        }

        // --- Helper function to count extended fingers on a SINGLE hand ---
        function countExtendedFingers(landmarks) {
            let fingerCount = 0;

            // Thumb: Check if tip (4) is significantly away from the base of index finger (5)
            // and its Y-coordinate is above its base (landmark 2)
            const thumbTip = landmarks[4];
            const indexMCP = landmarks[5];
            const thumbBase = landmarks[2];
            const thumbExtendedThreshold = 0.1;

            if (getDistance(thumbTip, indexMCP) > thumbExtendedThreshold && thumbTip.y < thumbBase.y) {
                fingerCount++;
            }

            // Other fingers (Index, Middle, Ring, Pinky)
            // A finger is extended if its tip is significantly higher (smaller Y-value) than its PIP joint.
            const fingerLandmarks = [
                [8, 7],   // Index finger: tip (8), PIP (7)
                [12, 11], // Middle finger: tip (12), PIP (11)
                [16, 15], // Ring finger: tip (16), PIP (15)
                [20, 19]  // Pinky finger: tip (20), PIP (19)
            ];

            for (const [tipId, pipId] of fingerLandmarks) {
                const tipY = landmarks[tipId].y;
                const pipY = landmarks[pipId].y;
                const extendedYThreshold = -0.04;

                if (tipY < pipY + extendedYThreshold) {
                    fingerCount++;
                }
            }
            return fingerCount;
        }
        // --- End Finger Counting ---


        // --- Content Management Logic ---
        const categories = {
            colors: {
                name: "Colors",
                items: [
                    { name: "RED", color: "#F44336" },
                    { name: "BLUE", color: "#2196F3" },
                    { name: "GREEN", color: "#4CAF50" },
                    { name: "YELLOW", color: "#FFEB3B" }, // Removed text_color, not needed for background
                    { name: "PURPLE", color: "#9C27B0" },
                    { name: "PINK", color: "#FF69B4" },
                    { name: "BROWN", color: "#8B4513" },
                    { name: "BLACK", color: "#000000" },
                    { name: "WHITE", color: "#FFFFFF" } // Removed text_color and border
                ],
                currentIndex: 0
            },
            numbers: {
                name: "Numbers",
                items: [
                    { name: "ONE", display: "ONE!" },
                    { name: "TWO", display: "TWO!" },
                    { name: "THREE", display: "THREE!" },
                    { name: "FOUR", display: "FOUR!" },
                    { name: "FIVE", display: "FIVE!" },
                    { name: "SIX", display: "SIX!" },
                    { name: "SEVEN", display: "SEVEN!" },
                    { name: "EIGHT", display: "EIGHT!" },
                    { name: "NINE", display: "NINE!" },
                    { name: "TEN", display: "TEN!" }
                ],
                currentIndex: 0
            },
            animals: {
                name: "Animals",
                items: [
                    { name: "DOG", display: "🐶 DOG!" },
                    { name: "CAT", display: "🐱 CAT!" },
                    { name: "LION", display: "🦁 LION!" },
                    { name: "ELEPHANT", display: "🐘 ELEPHANT!" },
                    { name: "MONKEY", display: "🐒 MONKEY!" },
                    { name: "DUCK", display: "🦆 DUCK!" },
                    { name: "COW", "display": "🐄 COW!" },
                ],
                currentIndex: 0
            },
            alphabets: {
                name: "Alphabets",
                englishItems: Array.from({ length: 26 }, (_, i) => ({
                    name: String.fromCharCode(65 + i), // A, B, C...
                    display: String.fromCharCode(65 + i) + "!"
                })),
                hindiItems: [ // Hindi Swar (Vowels)
                    { name: "अ", display: "अ!" },
                    { name: "आ", display: "आ!" },
                    { name: "इ", display: "इ!" },
                    { name: "ई", display: "ई!" },
                    { name: "उ", display: "उ!" },
                    { name: "ऊ", display: "ऊ!" },
                    { name: "ऋ", display: "ऋ!" },
                    { name: "ए", display: "ए!" },
                    { name: "ऐ", display: "ऐ!" },
                    { name: "ओ", display: "ओ!" },
                    { name: "औ", display: "औ!" },
                    { name: "अं", display: "अं!" },
                    { name: "अः", display: "अः!" }
                ],
                currentIndex: 0
            }
        };

        let currentCategory = 'colors'; // Default category

        function renderContent() {
            const categoryData = categories[currentCategory];
            let itemsToDisplay = categoryData.items;

            if (currentCategory === 'alphabets') {
                itemsToDisplay = isHindiAlphabet ? categoryData.hindiItems : categoryData.englishItems;
            }

            const currentItem = itemsToDisplay[categoryData.currentIndex];

            let contentHtml = ``;

            if (currentCategory === 'colors') {
                const color = currentItem.color;
                // Define gradient colors based on the main color for the smoke effect
                let gradientColor1 = color;
                let gradientColor2 = color;

                // Example gradient variations (you can expand this for more colors)
                if (color === "#F44336") { // RED
                    gradientColor1 = "#B71C1C"; gradientColor2 = "#FFCDD2";
                } else if (color === "#2196F3") { // BLUE
                    gradientColor1 = "#1976D2"; gradientColor2 = "#BBDEFB";
                } else if (color === "#4CAF50") { // GREEN
                    gradientColor1 = "#2E7D32"; gradientColor2 = "#C8E6C9";
                } else if (color === "#FFEB3B") { // YELLOW
                    gradientColor1 = "#FDD835"; gradientColor2 = "#FFF9C4";
                } else if (color === "#9C27B0") { // PURPLE
                    gradientColor1 = "#6A1B9A"; gradientColor2 = "#E1BEE7";
                } else if (color === "#FF9800") { // ORANGE
                    gradientColor1 = "#EF6C00"; gradientColor2 = "#FFECB3";
                } else if (color === "#FF69B4") { // PINK
                    gradientColor1 = "#D81B60"; gradientColor2 = "#F8BBD0";
                } else if (color === "#8B4513") { // BROWN
                    gradientColor1 = "#4E342E"; gradientColor2 = "#D7CCC8";
                } else if (color === "#000000") { // BLACK
                    gradientColor1 = "#212121"; gradientColor2 = "#616161";
                } else if (color === "#FFFFFF") { // WHITE
                    gradientColor1 = "#E0E0E0"; gradientColor2 = "#F5F5F5";
                }


                contentHtml = `
                    <div class="color-background-effect" id="colorBackground" style="background-image: radial-gradient(circle at 20% 80%, ${gradientColor1}, ${gradientColor2});"></div>
                    <h2 class="content-heading">What Color Is This?</h2>
                    <p class="instruction-text">Make a fist to change the color!</p>
                    <p class="instruction-text">(Close your fist when the cursor is over <span class="instruction-highlight">GREEN LIGHT</span> to see a new color!)</p>
                `;
                playItemAudio('colors', currentItem.name); // Play audio for colors (if audio files are provided)
            } else if (currentCategory === 'numbers') {
                contentHtml = `
                    <h2 class="content-heading">Count with Me!</h2>
                    <p class="content-subheading">Can you see...</p>
                    <div class="display-item" id="displayItem">${currentItem.display}</div>
                    <p class="instruction-text">Show me your fingers (1-10) to count!</p>
                    <p class="instruction-text">(Use one or two hands when the cursor is over <span class="instruction-highlight">GREEN LIGHT</span>)</p>
                `;
                playItemAudio('numbers', currentItem.name); // Play audio for numbers
            } else if (currentCategory === 'animals') {
                contentHtml = `
                    <h2 class="content-heading">Fun Animals!</h2>
                    <p class="content-subheading">${currentItem.name}!</p>
                    <div class="display-item" id="displayItem">${currentItem.display}</div>
                    <p class="instruction-text">Make a fist to change animal sounds!</p>
                    <p class="instruction-text">(Close your fist when the cursor is over <span class="instruction-highlight">GREEN LIGHT</span> to hear a new animal!)</p>
                `;
                playItemAudio('animals', currentItem.name); // Play audio for animals
            } else if (currentCategory === 'alphabets') {
                contentHtml = `
                    <h2 class="content-heading">Learn the Alphabets!</h2>
                    <p class="content-subheading">What letter is this?</p>
                    <div class="display-item" id="displayItem" style="font-size: ${isHindiAlphabet ? '6em' : '8em'};">${currentItem.display}</div>
                    <p class="instruction-text">Make a fist to see the next letter!</p>
                    <p class="instruction-text">(Close your fist when the cursor is over <span class="instruction-highlight">GREEN LIGHT</span> to see a new letter!)</p>
                    <button id="alphabetSettingsIcon" class="icon-button" role="button" aria-label="Toggle Alphabet Language">⚙️</button>
                `;
                playItemAudio('alphabets', currentItem.name); // Play audio for alphabets
            }
            mainContent.innerHTML = contentHtml;
            updateActiveButton();

            // Apply animation to the relevant element
            const elementForAnimation = (currentCategory === 'colors') ? document.getElementById('colorBackground') : document.getElementById('displayItem');
            if (elementForAnimation) {
                elementForAnimation.classList.add('animate');
                setTimeout(() => {
                    elementForAnimation.classList.remove('animate');
                }, 300);
            }

            // Re-add event listener for the settings icon if it exists
            if (currentCategory === 'alphabets') {
                const settingsIcon = document.getElementById('alphabetSettingsIcon');
                if (settingsIcon) {
                    settingsIcon.addEventListener('click', toggleAlphabetLanguage);
                }
            }
            // Ensure pause button is always present in the sidebar
            // No need to append pauseBtn here as it's static in HTML now
        }

        function nextItem() {
            const categoryData = categories[currentCategory];
            let itemsToCycle = categoryData.items;

            if (currentCategory === 'alphabets') {
                itemsToCycle = isHindiAlphabet ? categoryData.hindiItems : categoryData.englishItems;
            }

            categoryData.currentIndex = (categoryData.currentIndex + 1) % itemsToCycle.length;
            renderContent();
        }

        function setActiveCategory(categoryName) {
            currentCategory = categoryName;
            categories[currentCategory].currentIndex = 0; // Reset index when changing category
            isHindiAlphabet = false; // Reset to English when entering alphabet category
            renderContent();
            lastTotalFingerCount = -1; // Reset finger count state when changing categories
        }

        function toggleAlphabetLanguage() {
            isHindiAlphabet = !isHindiAlphabet;
            categories.alphabets.currentIndex = 0; // Reset index when changing language
            renderContent();
            playItemAudio('system', 'click'); // Play click sound on language toggle
        }

        function updateActiveButton() {
            document.querySelectorAll('.category-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(`${currentCategory}Btn`).classList.add('active');
        }

        // --- Onboarding Logic ---
        function renderOnboarding() {
            onboardingButton.style.display = 'block'; // Ensure button is visible by default for onboarding steps
            onboardingOverlay.classList.remove('good-job'); // Reset good-job class

            switch (onboardingStage) {
                case 0: // Click to Start
                    onboardingTitle.textContent = "Welcome to Little Gestures!";
                    onboardingInstruction.textContent = "Learn colors, numbers, animals, and alphabets using hand gestures!";
                    onboardingButton.textContent = "Click to Start";
                    onboardingButton.onclick = () => {
                        playItemAudio('system', 'click');
                        onboardingStage = 1;
                        renderOnboarding();
                        camera.start(); // Start camera once user clicks start
                    };
                    sidebar.classList.add('hidden');
                    mainContent.classList.add('hidden');
                    pauseBtn.classList.add('hidden'); // Hide pause button during onboarding
                    // Removed colorGradingBtn.classList.add('hidden');
                    break;
                case 1: // Move your hand
                    onboardingTitle.textContent = "Let's Get Started!";
                    onboardingInstruction.textContent = "Move your hand in front of the camera to control the cursor.";
                    onboardingButton.style.display = 'none'; // Hide button for this stage
                    break;
                case 2: // Good job (Move)
                    onboardingTitle.textContent = "Good Job!";
                    onboardingInstruction.textContent = "You've successfully moved your hand!";
                    onboardingButton.style.display = 'none';
                    onboardingOverlay.classList.add('good-job');
                    playItemAudio('system', 'good_job');
                    setTimeout(() => {
                        onboardingStage = 3;
                        renderOnboarding();
                    }, GOOD_JOB_DISPLAY_TIME);
                    break;
                case 3: // Curl your fingers to click
                    onboardingTitle.textContent = "Ready to Click?";
                    onboardingInstruction.textContent = "Make a fist to 'click' on items and change content.";
                    onboardingButton.style.display = 'none';
                    break;
                case 4: // Good job (Fist)
                    onboardingTitle.textContent = "Awesome!";
                    onboardingInstruction.textContent = "You've mastered the fist gesture!";
                    onboardingButton.style.display = 'none';
                    onboardingOverlay.classList.add('good-job');
                    playItemAudio('system', 'good_job');
                    setTimeout(() => {
                        onboardingStage = 5;
                        renderOnboarding();
                    }, GOOD_JOB_DISPLAY_TIME);
                    break;
                case 5: // Onboarding Complete
                    isOnboardingActive = false;
                    onboardingOverlay.classList.add('hidden'); // Hide the overlay
                    sidebar.classList.remove('hidden'); // Show sidebar
                    mainContent.classList.remove('hidden'); // Show main content
                    pauseBtn.classList.remove('hidden'); // Show pause button after onboarding
                    // Removed colorGradingBtn.classList.remove('hidden');
                    renderContent(); // Render initial content of the app
                    break;
            }
        }

        // --- Pause/Resume Logic ---
        function togglePause() {
            isPaused = !isPaused;
            if (isPaused) {
                camera.stop(); // Stop camera processing
                pauseOverlay.classList.remove('hidden'); // Show pause overlay
                customCursor.style.display = 'none'; // Hide cursor when paused
                statusOverlay.innerHTML = `Status: Paused
                                          <br>Gesture: None`;
            } else {
                camera.start(); // Resume camera processing
                pauseOverlay.classList.add('hidden'); // Hide pause overlay
                // Cursor will be re-enabled by onResults when hand is detected
            }
            playItemAudio('system', 'click'); // Play click sound for pause/resume
        }

        // Initial call to render onboarding
        renderOnboarding();

        // Add event listeners for the category buttons (only active after onboarding)
        colorsBtn.addEventListener('click', () => setActiveCategory('colors'));
        numbersBtn.addEventListener('click', () => setActiveCategory('numbers'));
        animalsBtn.addEventListener('click', () => setActiveCategory('animals'));
        alphabetsBtn.addEventListener('click', () => setActiveCategory('alphabets'));

        // Add event listeners for pause/resume buttons
        pauseBtn.addEventListener('click', togglePause);
        resumeBtn.addEventListener('click', togglePause);

        // Removed event listeners for color grading button


        // --- Main Hand Tracking Loop ---
        function onResults(results) {
            // Do not process hand results if paused
            if (isPaused) {
                return;
            }

            let currentGesture = "No Hand Detected";
            customCursor.style.display = 'none';

            const currentTime = Date.now();

            let primaryHandLandmarks = null;
            let allHandLandmarks = [];
            let numHandsDetected = 0;

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                numHandsDetected = results.multiHandLandmarks.length;

                primaryHandLandmarks = results.multiHandLandmarks[0];
                allHandLandmarks = results.multiHandLandmarks;

                // --- Cursor Control (uses primary hand) ---
                const indexFingerTip = primaryHandLandmarks[8];
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;

                const cursorX = (1 - indexFingerTip.x) * screenWidth;
                const cursorY = indexFingerTip.y * screenHeight;

                customCursor.style.left = `${cursorX}px`;
                customCursor.style.top = `${cursorY}px`;
                customCursor.style.display = 'block';

                // --- Onboarding Stage 1: Detect Hand Movement ---
                if (isOnboardingActive && onboardingStage === 1) {
                    const distanceMoved = Math.sqrt(
                        Math.pow(cursorX - lastCursorX, 2) +
                        Math.pow(cursorY - lastCursorY, 2)
                    );

                    // If hand moves significantly and debounce time has passed
                    if (distanceMoved > MOVE_DETECTION_THRESHOLD && (currentTime - lastMoveDetectTime > MOVE_DEBOUNCE_TIME)) {
                        onboardingStage = 2; // Transition to Good Job (Move)
                        renderOnboarding();
                        lastMoveDetectTime = currentTime; // Reset debounce timer
                    }
                    lastCursorX = cursorX;
                    lastCursorY = cursorY;
                    currentGesture = "Moving Hand";
                }
                // --- End Onboarding Stage 1 ---

                // --- Onboarding Stage 3: Detect Fist Gesture ---
                if (isOnboardingActive && onboardingStage === 3) {
                    const isPrimaryHandFist = isHandAFist(primaryHandLandmarks);
                    if (isPrimaryHandFist) {
                        onboardingStage = 4; // Transition to Good Job (Fist)
                        renderOnboarding();
                    }
                    currentGesture = isPrimaryHandFist ? "Fist Detected" : "Open Hand";
                }
                // --- End Onboarding Stage 3 ---


                // --- Dwell-to-Click for Interactive Elements (only if onboarding is complete) ---
                if (!isOnboardingActive) {
                    const elementUnderCursor = document.elementFromPoint(cursorX, cursorY);
                    const isInteractiveElement = elementUnderCursor && (
                        elementUnderCursor.classList.contains('category-button') ||
                        elementUnderCursor.id === 'alphabetSettingsIcon' ||
                        elementUnderCursor.id === 'pauseBtn' // Pause button is back in sidebar
                    );

                    if (isInteractiveElement) {
                        if (hoveredButton !== elementUnderCursor) {
                            // Started hovering over a new interactive element
                            if (hoveredButton) {
                                hoveredButton.classList.remove('hovering-to-click');
                            }
                            hoveredButton = elementUnderCursor;
                            hoverStartTime = currentTime;
                            hoveredButton.classList.add('hovering-to-click');
                            currentGesture = `Hovering over ${hoveredButton.id || 'Interactive Element'} (Dwell: ${((currentTime - hoverStartTime) / 1000).toFixed(1)}s)`;
                        } else {
                            // Still hovering over the same element
                            const dwellTime = currentTime - hoverStartTime;
                            currentGesture = `Hovering over ${hoveredButton.id || 'Interactive Element'} (Dwell: ${(dwellTime / 1000).toFixed(1)}s)`;
                            if (dwellTime >= DWELL_TIME_THRESHOLD) {
                                // Dwell time reached, simulate click!
                                if (!hoveredButton.classList.contains('clicked')) {
                                    hoveredButton.classList.add('clicked');
                                    playItemAudio('system', 'click'); // Play a generic click sound for button interactions

                                    if (hoveredButton.id === 'colorsBtn') setActiveCategory('colors');
                                    else if (hoveredButton.id === 'numbersBtn') setActiveCategory('numbers');
                                    else if (hoveredButton.id === 'animalsBtn') setActiveCategory('animals');
                                    else if (hoveredButton.id === 'alphabetsBtn') setActiveCategory('alphabets');
                                    else if (hoveredButton.id === 'alphabetSettingsIcon') toggleAlphabetLanguage(); // Handle settings icon
                                    else if (hoveredButton.id === 'pauseBtn') togglePause(); // Handle pause button

                                    // Reset dwell state after successful click
                                    hoveredButton.classList.remove('hovering-to-click');
                                    hoveredButton = null;
                                    hoverStartTime = 0;
                                    setTimeout(() => {
                                        if (elementUnderCursor) elementUnderCursor.classList.remove('clicked');
                                    }, CLICK_DEBOUNCE_TIME);
                                }
                            }
                        }
                    } else {
                        // Not hovering over any interactive element
                        if (hoveredButton) {
                            hoveredButton.classList.remove('hovering-to-click');
                            hoveredButton.classList.remove('clicked');
                            hoveredButton = null;
                            hoverStartTime = 0;
                        }
                    }
                }
                // --- End Dwell-to-Click ---


                // --- Total Finger Count Logic for Numbers Category (only if onboarding is complete) ---
                if (!isOnboardingActive && currentCategory === 'numbers') {
                    let totalCountedFingers = 0;
                    for (const handLandmarks of allHandLandmarks) {
                        const handFingerCount = countExtendedFingers(handLandmarks);
                        totalCountedFingers += handFingerCount;
                    }

                    if (totalCountedFingers > 10) {
                        totalCountedFingers = 10;
                    }

                    if (totalCountedFingers >= 1 && totalCountedFingers <= 10 &&
                        totalCountedFingers !== lastTotalFingerCount &&
                        (currentTime - lastFingerCountUpdateTime > FINGER_COUNT_DEBOUNCE_TIME))
                    {
                        categories.numbers.currentIndex = totalCountedFingers - 1;
                        renderContent();
                        lastFingerCountUpdateTime = currentTime;
                        lastTotalFingerCount = totalCountedFingers;
                        currentGesture = `Showing ${totalCountedFingers} Fingers`;
                    } else if (totalCountedFingers === 0 && lastTotalFingerCount !== 0 &&
                               (currentTime - lastFingerCountUpdateTime > FINGER_COUNT_DEBOUNCE_TIME)) {
                        // This block handles the transition from showing fingers to showing ZERO!
                        // No hand visible, but previously showed a number
                        // We will set lastTotalFingerCount to 0 to make sure the "ZERO!" re-render is debounced
                        lastTotalFingerCount = 0; // Mark as showing zero
                        lastFingerCountUpdateTime = currentTime; // Update time for debouncing
                        playItemAudio('numbers', 'ZERO'); // Play ZERO audio here
                    }
                }
                // --- End Total Finger Count Logic ---


                // --- Fist Gesture for Content Advancement (Colors, Animals & Alphabets) (only if onboarding is complete) ---
                if (!isOnboardingActive && (currentCategory === 'colors' || currentCategory === 'animals' || currentCategory === 'alphabets')) {
                    const isPrimaryHandFist = isHandAFist(primaryHandLandmarks);
                    // Added a null check for elementUnderCursor before calling .closest()
                    const elementUnderCursor = document.elementFromPoint(cursorX, cursorY);
                    if (isPrimaryHandFist && elementUnderCursor && elementUnderCursor.closest('#mainContent')) {
                        currentGesture = "Fist (Content Advance)";

                        if (!fistGestureDetected && (currentTime - CLICK_DEBOUNCE_TIME > CLICK_DEBOUNCE_TIME)) {
                            fistGestureDetected = true;
                            nextItem();
                        }
                    } else {
                        fistGestureDetected = false;
                    }
                }

            } else {
                // No hands detected
                numHandsDetected = 0;
                statusOverlay.innerHTML = `Status: No Hand Detected
                                          <br>Gesture: None`;
                customCursor.style.display = 'none';
                fistGestureDetected = false;

                // Display "ZERO!" in numbers section when no hand is detected
                if (!isOnboardingActive && currentCategory === 'numbers') {
                     // Only re-render if it's not already showing ZERO! to avoid flicker
                    if (lastTotalFingerCount !== 0) {
                        mainContent.innerHTML = `
                            <h2 class="content-heading">Count with Me!</h2>
                            <p class="content-subheading">Can you see...</p>
                            <div class="display-item" id="displayItem">ZERO!</div>
                            <p class="instruction-text">Show me your fingers (1-10) to count!</p>
                            <p class="instruction-text">(Use one or two hands when the cursor is over <span class="instruction-highlight">GREEN LIGHT</span>)</p>
                        `;
                        const displayItemElement = document.getElementById('displayItem');
                        if (displayItemElement) {
                            displayItemElement.classList.add('animate');
                            setTimeout(() => {
                                displayItemElement.classList.remove('animate');
                            }, 300);
                        }
                        lastTotalFingerCount = 0; // Mark as showing zero
                        lastFingerCountUpdateTime = currentTime; // Update time for debouncing
                        playItemAudio('numbers', 'ZERO'); // Play ZERO audio here
                    }
                } else {
                    // Reset finger count state for other categories
                    lastTotalFingerCount = -1;
                }


                // Reset dwell state if hand disappears
                if (hoveredButton) {
                    hoveredButton.classList.remove('hovering-to-click');
                    hoveredButton.classList.remove('clicked');
                    hoveredButton = null;
                    hoverStartTime = 0;
                }
            }
            // Update status overlay text
            statusOverlay.innerHTML = `Status: ${numHandsDetected > 0 ? 'Hand Detected' : 'No Hand Detected'} (${numHandsDetected} hand${numHandsDetected === 1 ? '' : 's'})
                                      <br>Gesture: ${currentGesture}`;
        }
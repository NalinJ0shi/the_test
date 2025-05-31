// main.js

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas'); // Still needed for MediaPipe processing
const customCursor = document.getElementById('customCursor');
const statusOverlay = document.getElementById('statusOverlay');

// --- Audio Setup ---
const clickAudio = new Audio('click.mp3'); // Path to your MP3 file
clickAudio.volume = 0.7; // Adjust volume (0.0 to 1.0)
// Optional: Preload the audio for faster playback
clickAudio.load();
// --- End Audio Setup ---

// Buttons for demonstration (ensure these IDs exist in your index.html)
document.getElementById('demoButton1').addEventListener('click', () => {
    alert('Button 1 Clicked by Hand Gesture (Fist)!');
    // The audio will play from the gesture detection, not here.
});
document.getElementById('demoButton2').addEventListener('click', () => {
    alert('Button 2 Clicked by Hand Gesture (Fist)!');
    // The audio will play from the gesture detection, not here.
});

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1, // Only track one hand for cursor control
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

let fistGestureDetected = false;
let lastClickTime = 0;
const CLICK_DEBOUNCE_TIME = 500; // milliseconds to prevent rapid clicks

// For scroll gesture (remains the same as previous version)
let lastHandY = null;
let lastScrollTime = 0;
const SCROLL_DEBOUNCE_TIME = 200; // milliseconds between scroll events
const SCROLL_THRESHOLD = 0.03; // Normalized Y movement to trigger scroll

hands.onResults(onResults);

// Access the webcam
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640, // Standard resolution, doesn't matter much as it's hidden
    height: 480
});
camera.start();

function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0]; // Get the first detected hand

        // MediaPipe gives normalized coordinates (0 to 1).
        // Convert them to screen pixel coordinates.
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Index finger tip (landmark 8) for cursor control
        const indexFingerTip = landmarks[8];
        const thumbTip = landmarks[4];
        const middleFingerTip = landmarks[12];
        const ringFingerTip = landmarks[16];
        const pinkyTip = landmarks[20];

        // Finger knuckle landmarks (Metacarpophalangeal - MCP)
        const indexFingerMCP = landmarks[5];
        const middleFingerMCP = landmarks[9];
        const ringFingerMCP = landmarks[13];
        const pinkyFingerMCP = landmarks[17];


        // Calculate cursor position
        // We inverse the X to make it feel natural (moving hand left moves cursor left)
        const cursorX = (1 - indexFingerTip.x) * screenWidth;
        const cursorY = indexFingerTip.y * screenHeight;

        customCursor.style.left = `${cursorX}px`;
        customCursor.style.top = `${cursorY}px`;
        customCursor.style.display = 'block'; // Show cursor when hand is detected

        // --- Gesture Detection ---

        // 1. "Fist" Gesture for Click: Check if finger tips are below their respective MCP joints
        const isFist =
            indexFingerTip.y > indexFingerMCP.y &&
            middleFingerTip.y > middleFingerMCP.y &&
            ringFingerTip.y > ringFingerMCP.y &&
            pinkyTip.y > pinkyFingerMCP.y &&
            thumbTip.x > landmarks[2].x; // Optional: Check if thumb is also tucked away

        const currentTime = Date.now();
        let currentGesture = "Moving hand";

        if (isFist) {
            currentGesture = "Fist (Click)";
            if (!fistGestureDetected && (currentTime - lastClickTime > CLICK_DEBOUNCE_TIME)) {
                fistGestureDetected = true;
                lastClickTime = currentTime;
                customCursor.classList.add('clicking'); // Visual feedback for click

                // --- Play Audio Here ---
                clickAudio.currentTime = 0; // Rewind to start in case it's still playing
                clickAudio.play().catch(e => console.error("Audio playback error:", e));
                // --- End Play Audio ---

                // Simulate a click event at the cursor's position
                const elementUnderCursor = document.elementFromPoint(cursorX, cursorY);
                if (elementUnderCursor) {
                    console.log('Simulating click on:', elementUnderCursor);
                    elementUnderCursor.click(); // Trigger native click event
                }
            }
        } else {
            if (fistGestureDetected) {
                customCursor.classList.remove('clicking');
            }
            fistGestureDetected = false;
        }

        // 2. "Scroll" Gesture (Open hand moving up/down)
        const isOpenHand =
            !isFist && // Ensure it's not a fist
            indexFingerTip.y < indexFingerMCP.y &&
            middleFingerTip.y < middleFingerMCP.y &&
            ringFingerTip.y < ringFingerMCP.y &&
            pinkyTip.y < pinkyFingerMCP.y;


        if (isOpenHand && lastHandY !== null) {
            const deltaY = indexFingerTip.y - lastHandY; // Positive for down, negative for up
            const SCROLL_SENSITIVITY = 50; // Pixels to scroll

            if (Math.abs(deltaY) > SCROLL_THRESHOLD && (currentTime - lastScrollTime > SCROLL_DEBOUNCE_TIME)) {
                if (deltaY > 0) { // Moving hand down
                    window.scrollBy({ top: SCROLL_SENSITIVITY * 2, behavior: 'smooth' });
                    currentGesture = "Scrolling Down";
                } else { // Moving hand up
                    window.scrollBy({ top: -SCROLL_SENSITIVITY * 2, behavior: 'smooth' });
                    currentGesture = "Scrolling Up";
                }
                lastScrollTime = currentTime;
            }
        }
        lastHandY = indexFingerTip.y;


        statusOverlay.innerHTML = `Status: Hand Detected
                                  <br>Gesture: ${currentGesture}`;

    } else {
        statusOverlay.innerHTML = `Status: No Hand Detected
                                  <br>Gesture: None`;
        customCursor.style.display = 'none'; // Hide cursor if no hand
        fistGestureDetected = false; // Reset click state
        lastHandY = null; // Reset scroll state
    }
}
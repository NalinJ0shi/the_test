        const videoElement = document.getElementById('video');
        const canvasElement = document.getElementById('canvas'); // Still needed for MediaPipe processing
        const canvasCtx = canvasElement.getContext('2d');
        const customCursor = document.getElementById('customCursor');
        const statusOverlay = document.getElementById('statusOverlay');

        // Buttons for demonstration
        document.getElementById('demoButton1').addEventListener('click', () => {
            alert('Button 1 Clicked by Hand Gesture!');
        });
        document.getElementById('demoButton2').addEventListener('click', () => {
            alert('Button 2 Clicked by Hand Gesture!');
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

        let clickGestureDetected = false;
        let lastClickTime = 0;
        const CLICK_DEBOUNCE_TIME = 500; // milliseconds to prevent rapid clicks

        // For scroll gesture
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
            // Draw nothing on the hidden canvas
            // canvasCtx.save();
            // canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            // canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0]; // Get the first detected hand

                // MediaPipe gives normalized coordinates (0 to 1).
                // Convert them to screen pixel coordinates.
                // Note: We mirror the X coordinate because the camera typically mirrors the video.
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;

                // Index finger tip (landmark 8) for cursor control
                const indexFingerTip = landmarks[8];
                const thumbTip = landmarks[4];
                const middleFingerTip = landmarks[12];
                const ringFingerTip = landmarks[16];
                const pinkyTip = landmarks[20];

                // Calculate cursor position
                // We inverse the X to make it feel natural (moving hand left moves cursor left)
                const cursorX = (1 - indexFingerTip.x) * screenWidth;
                const cursorY = indexFingerTip.y * screenHeight;

                customCursor.style.left = `${cursorX}px`;
                customCursor.style.top = `${cursorY}px`;
                customCursor.style.display = 'block'; // Show cursor when hand is detected

                // --- Gesture Detection ---

                // 1. "Click" Gesture (Pinch: Index finger tip close to thumb tip)
                const clickDistance = Math.sqrt(
                    Math.pow(indexFingerTip.x - thumbTip.x, 2) +
                    Math.pow(indexFingerTip.y - thumbTip.y, 2) +
                    Math.pow(indexFingerTip.z - thumbTip.z, 2) // Include Z for better accuracy
                );

                const CLICK_THRESHOLD = 0.05; // Normalized distance for a pinch

                const currentTime = Date.now();
                let currentGesture = "Moving hand";

                if (clickDistance < CLICK_THRESHOLD) {
                    currentGesture = "Pinch (Click)";
                    if (!clickGestureDetected && (currentTime - lastClickTime > CLICK_DEBOUNCE_TIME)) {
                        clickGestureDetected = true;
                        lastClickTime = currentTime;
                        customCursor.classList.add('clicking'); // Visual feedback for click

                        // Simulate a click event at the cursor's position
                        const elementUnderCursor = document.elementFromPoint(cursorX, cursorY);
                        if (elementUnderCursor) {
                            console.log('Simulating click on:', elementUnderCursor);
                            elementUnderCursor.click(); // Trigger native click event
                        }
                    }
                } else {
                    if (clickGestureDetected) {
                        customCursor.classList.remove('clicking');
                    }
                    clickGestureDetected = false;
                }

                // 2. "Scroll" Gesture (Open hand moving up/down)
                // Check if hand is "open" (fingers generally extended)
                const isOpenHand =
                    indexFingerTip.y < middleFingerTip.y &&
                    middleFingerTip.y < ringFingerTip.y &&
                    ringFingerTip.y < pinkyTip.y; // Simplified check: tips are higher than knuckles

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
                clickGestureDetected = false; // Reset click state
                lastHandY = null; // Reset scroll state
            }
            // canvasCtx.restore(); // Restore context if you uncomment drawing
        }
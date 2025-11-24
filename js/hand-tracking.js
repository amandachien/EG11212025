// Hand Tracking Module using MediaPipe Hands
// Detects pinch and open hand gestures

import { CONFIG } from '../config.js';

class HandTracking {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.isInitialized = false;
        this.lastGestureTime = 0;
        this.gestureCallbacks = {
            pinch: [],
            openHand: [],
            fist: []
        };
        this.currentGesture = null;
        this.handLandmarks = null;
        this.animationFrameId = null;
    }

    /**
     * Initialize hand tracking
     * @param {HTMLVideoElement} videoElement - Video element for camera feed
     * @param {HTMLCanvasElement} canvasElement - Canvas for visualization (optional)
     */
    async initialize(videoElement, canvasElement = null) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;

        if (this.canvasElement) {
            this.canvasCtx = this.canvasElement.getContext('2d');
        }

        try {
            // Check if MediaPipe is loaded
            if (typeof window.Hands === 'undefined') {
                throw new Error('MediaPipe Hands library not loaded. Please check CDN links.');
            }

            // Initialize MediaPipe Hands
            this.hands = new window.Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });

            this.hands.onResults((results) => this.onResults(results));

            this.hands.onResults((results) => this.onResults(results));

            // Start processing frames
            this.startProcessing();

            this.isInitialized = true;
            console.log('Hand tracking initialized');
            return true;
        } catch (error) {
            console.error('Hand tracking initialization failed:', error);
            throw error;
        }
    }

    /**
     * Start processing video frames
     */
    startProcessing() {
        const processFrame = async () => {
            if (this.videoElement && this.hands && !this.videoElement.paused && !this.videoElement.ended) {
                await this.hands.send({ image: this.videoElement });
            }
            this.animationFrameId = requestAnimationFrame(processFrame);
        };
        processFrame();
    }

    /**
     * Process hand tracking results
     */
    onResults(results) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this.handLandmarks = null;
            this.currentGesture = null;
            return;
        }

        const landmarks = results.multiHandLandmarks[0];
        this.handLandmarks = landmarks;

        // Detect gestures
        const gesture = this.detectGesture(landmarks);

        if (gesture && gesture !== this.currentGesture) {
            this.handleGesture(gesture, landmarks);
        }

        this.currentGesture = gesture;

        // Optional: Draw hand landmarks on canvas
        if (this.canvasElement && this.canvasCtx) {
            this.drawHands(results);
        }
    }

    /**
     * Detect gesture from hand landmarks
     */
    detectGesture(landmarks) {
        // Check cooldown
        const now = Date.now();
        if (now - this.lastGestureTime < CONFIG.gestures.cooldownMs) {
            return null;
        }

        // Detect pinch (thumb tip close to index finger tip)
        if (this.isPinch(landmarks)) {
            return 'pinch';
        }

        // Detect open hand (all fingers extended)
        if (this.isOpenHand(landmarks)) {
            return 'openHand';
        }

        // Detect fist (all fingers closed)
        if (this.isFist(landmarks)) {
            return 'fist';
        }

        return null;
    }

    /**
     * Check if hand is making pinch gesture
     */
    isPinch(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2) +
            Math.pow(thumbTip.z - indexTip.z, 2)
        );

        return distance < CONFIG.gestures.pinchThreshold;
    }

    /**
     * Check if hand is open (all fingers extended)
     */
    isOpenHand(landmarks) {
        // Check if all fingertips are above their respective knuckles
        const fingers = [
            { tip: 8, pip: 6 },   // Index
            { tip: 12, pip: 10 }, // Middle
            { tip: 16, pip: 14 }, // Ring
            { tip: 20, pip: 18 }  // Pinky
        ];

        let extendedCount = 0;

        for (const finger of fingers) {
            const tip = landmarks[finger.tip];
            const pip = landmarks[finger.pip];

            // Check if tip is above pip (y is inverted in screen coordinates)
            if (tip.y < pip.y) {
                extendedCount++;
            }
        }

        // Also check thumb
        const thumbTip = landmarks[4];
        const thumbIP = landmarks[3];
        const thumbExtended = Math.abs(thumbTip.x - thumbIP.x) > 0.05;

        if (thumbExtended) {
            extendedCount++;
        }

        return extendedCount >= 4; // At least 4 fingers extended
    }

    /**
     * Check if hand is a fist (all fingers closed)
     */
    isFist(landmarks) {
        // EXCLUSION: If thumb and index are close, it's likely a pinch (or near pinch), not a fist
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const pinchDist = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2) +
            Math.pow(thumbTip.z - indexTip.z, 2)
        );

        if (pinchDist < CONFIG.gestures.fistPinchExclusion) {
            return false;
        }

        // Check if all fingertips are below their respective PIP joints
        const fingers = [
            { tip: 8, pip: 6 },   // Index
            { tip: 12, pip: 10 }, // Middle
            { tip: 16, pip: 14 }, // Ring
            { tip: 20, pip: 18 }  // Pinky
        ];

        let closedCount = 0;

        for (const finger of fingers) {
            const tip = landmarks[finger.tip];
            const pip = landmarks[finger.pip];

            // Check if tip is below pip (y is inverted in screen coordinates, so tip.y > pip.y means lower)
            if (tip.y > pip.y) {
                closedCount++;
            }
        }

        // Thumb is tricky, check if it's close to the palm/index base
        // thumbTip is already defined above
        const indexMCP = landmarks[5]; // Index base
        const thumbClosed = Math.abs(thumbTip.x - indexMCP.x) < 0.1;

        if (thumbClosed) {
            closedCount++;
        }

        return closedCount >= 4; // At least 4 fingers closed
    }

    /**
     * Handle detected gesture
     */
    handleGesture(gesture, landmarks) {
        this.lastGestureTime = Date.now();

        // Get 3D position for AR placement
        const position = this.getLandmarkPosition(landmarks);

        // Trigger callbacks
        if (this.gestureCallbacks[gesture]) {
            this.gestureCallbacks[gesture].forEach(callback => {
                callback(position, landmarks);
            });
        }

        console.log(`Gesture detected: ${gesture}`, position);
    }

    /**
     * Get 3D position from hand landmarks (center of palm)
     */
    getLandmarkPosition(landmarks) {
        // Use wrist position as reference
        const wrist = landmarks[0];
        return {
            x: wrist.x,
            y: wrist.y,
            z: wrist.z
        };
    }

    /**
     * Draw hand landmarks on canvas
     */
    drawHands(results) {
        const ctx = this.canvasCtx;
        const canvas = this.canvasElement;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks && window.drawConnectors && window.drawLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                // Draw connections
                window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
                    color: '#00ff88',
                    lineWidth: 2
                });

                // Draw landmarks
                window.drawLandmarks(ctx, landmarks, {
                    color: '#00d4ff',
                    lineWidth: 1,
                    radius: 3
                });
            }
        }

        ctx.restore();
    }

    /**
     * Register callback for gesture
     */
    on(gesture, callback) {
        if (this.gestureCallbacks[gesture]) {
            this.gestureCallbacks[gesture].push(callback);
        }
    }

    /**
     * Remove callback for gesture
     */
    off(gesture, callback) {
        if (this.gestureCallbacks[gesture]) {
            const index = this.gestureCallbacks[gesture].indexOf(callback);
            if (index > -1) {
                this.gestureCallbacks[gesture].splice(index, 1);
            }
        }
    }

    /**
     * Get current hand landmarks
     */
    getHandLandmarks() {
        return this.handLandmarks;
    }

    /**
     * Stop hand tracking
     */
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.isInitialized = false;
    }
}

// Export singleton instance
export const handTracking = new HandTracking();

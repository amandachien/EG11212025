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
            openHand: []
        };
        this.currentGesture = null;
        this.handLandmarks = null;
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
            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646559476/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });

            this.hands.onResults((results) => this.onResults(results));

            // Initialize camera
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.hands) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: 1280,
                height: 720,
                facingMode: 'environment' // Use back camera on mobile
            });

            await this.camera.start();
            this.isInitialized = true;
            console.log('Hand tracking initialized');
            return true;
        } catch (error) {
            console.error('Hand tracking initialization failed:', error);
            throw error;
        }
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

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                // Draw connections
                drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                    color: '#00ff88',
                    lineWidth: 2
                });

                // Draw landmarks
                drawLandmarks(ctx, landmarks, {
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
        if (this.camera) {
            this.camera.stop();
        }
        this.isInitialized = false;
    }
}

// Export singleton instance
export const handTracking = new HandTracking();

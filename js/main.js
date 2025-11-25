// Main Application Controller
// Coordinates all modules and manages AR session

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { apiService } from './api-service.js';
import { handTracking } from './hand-tracking.js';
import { plantDetector } from './plant-detector.js';
import { orbCreator } from './orb-creator.js';
import { pendantCreator } from './pendant-creator.js';

class ARPlantGame {
    constructor() {
        this.isInitialized = false;
        this.isRunning = false;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.lastFrameTime = 0;

        // UI elements
        this.ui = {};
    }

    /**
     * Initialize the application
     */
    async initialize() {
        console.log('Initializing AR Plant Game...');

        try {
            // Get UI elements
            this.initializeUI();

            // Get video and canvas elements
            this.videoElement = document.getElementById('camera-feed');
            this.canvasElement = document.getElementById('ar-canvas');

            // Initialize Three.js scene
            this.initializeThreeJS();

            // Initialize plant detector
            this.updateStatus('Loading AI models...');
            await plantDetector.initialize();

            // Initialize orb and pendant creators
            orbCreator.initialize(this.scene);
            pendantCreator.initialize(this.scene);

            this.isInitialized = true;
            this.updateStatus('Ready');

            console.log('AR Plant Game initialized successfully');
            return true;
        } catch (error) {
            console.error('Initialization failed:', error);
            this.updateStatus('Initialization failed');
            throw error;
        }
    }

    /**
     * Initialize UI elements and event listeners
     */
    initializeUI() {
        this.ui = {
            startBtn: document.getElementById('start-btn'),
            instructionsPanel: document.getElementById('instructions-panel'),
            plantInfoPanel: document.getElementById('plant-info-panel'),
            plantInfoContent: document.getElementById('plant-info-content'),
            closePlantInfo: document.getElementById('close-plant-info'),
            envDataPanel: document.getElementById('env-data-panel'),
            statusIndicator: document.getElementById('status-indicator'),
            statusText: document.querySelector('.status-text'),
            loadingSpinner: document.getElementById('loading-spinner'),
            detectPlantBtn: document.getElementById('detect-plant-btn'),
            createOrbBtn: document.getElementById('create-orb-btn'),
            createPendantBtn: document.getElementById('create-pendant-btn'),
            tempValue: document.getElementById('temp-value'),
            weatherValue: document.getElementById('weather-value'),
            aqiValue: document.getElementById('aqi-value')
        };

        // Event listeners
        this.ui.startBtn.addEventListener('click', () => this.start());
        this.ui.closePlantInfo.addEventListener('click', () => this.hidePlantInfo());
        this.ui.detectPlantBtn.addEventListener('click', () => this.detectPlant());
        this.ui.createOrbBtn.addEventListener('click', () => this.createOrbManual());
        this.ui.createPendantBtn.addEventListener('click', () => this.createPendantManual());
    }

    /**
     * Initialize Three.js scene
     */
    initializeThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.01,
            1000
        );
        this.camera.position.set(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasElement,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Start AR experience
     */
    async start() {
        if (this.isRunning) return;

        try {
            this.showLoading('Starting AR experience...');

            // Hide instructions
            this.ui.instructionsPanel.classList.add('hidden');

            // Request camera permissions and start video
            await this.startCamera();

            // Initialize hand tracking
            this.updateStatus('Initializing hand tracking...');
            await handTracking.initialize(this.videoElement);

            // Register gesture callbacks
            handTracking.on('pinch', (position) => this.onPinchGesture(position));
            handTracking.on('openHand', (position) => this.onOpenHandGesture(position));
            handTracking.on('peace', (position) => this.onPeaceGesture(position));

            this.isRunning = true;
            this.hideLoading();
            this.updateStatus('AR Active');

            // Show environmental data panel
            this.ui.envDataPanel.classList.remove('hidden');

            // Start render loop
            this.animate();

            console.log('AR experience started');
        } catch (error) {
            console.error('Failed to start AR experience:', error);
            this.hideLoading();
            this.updateStatus('Failed to start');
            alert('Failed to start AR experience. Please ensure camera permissions are granted.');
        }
    }

    /**
     * Start camera
     */
    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.videoElement.srcObject = stream;
            await this.videoElement.play();

            return true;
        } catch (error) {
            console.error('Camera access failed:', error);
            throw error;
        }
    }

    /**
     * Detect plant
     */
    async detectPlant() {
        if (!this.isRunning) return;

        try {
            this.showLoading('Identifying plant...');

            const plant = await plantDetector.identifyPlant(this.videoElement);

            if (plant) {
                this.showPlantInfo(plant);
                this.ui.createPendantBtn.disabled = false;
            } else {
                alert('No plant detected. Please point your camera at a plant.');
            }

            this.hideLoading();
        } catch (error) {
            console.error('Plant detection failed:', error);
            this.hideLoading();
            alert('Plant detection failed. Please try again.');
        }
    }

    /**
     * Create orb manually (fallback for devices without hand tracking)
     */
    async createOrbManual() {
        if (!this.isRunning) return;

        try {
            this.showLoading('Creating environmental orb...');

            // Create orb in front of camera
            const position = new THREE.Vector3(0, 0, -CONFIG.ar.orbDistance);
            position.applyQuaternion(this.camera.quaternion);
            position.add(this.camera.position);

            const orb = await orbCreator.createOrb(position);

            // Update environmental data display
            this.updateEnvironmentalData(orb.userData.weatherData, orb.userData.airQualityData);

            this.hideLoading();
        } catch (error) {
            console.error('Orb creation failed:', error);
            this.hideLoading();
            alert('Failed to create orb. Please try again.');
        }
    }

    /**
     * Create pendant manually (fallback for devices without hand tracking)
     */
    async createPendantManual() {
        if (!this.isRunning) return;

        const plant = plantDetector.getLatestPlant();
        if (!plant) {
            alert('Please detect a plant first.');
            return;
        }

        try {
            this.showLoading('Creating plant pendant...');

            // Create pendant in front of camera
            const position = new THREE.Vector3(0, 0, -CONFIG.ar.pendantDistance);
            position.applyQuaternion(this.camera.quaternion);
            position.add(this.camera.position);

            await pendantCreator.createPendant(position);

            this.hideLoading();
        } catch (error) {
            console.error('Pendant creation failed:', error);
            this.hideLoading();
            alert('Failed to create pendant. Please try again.');
        }
    }

    /**
     * Handle pinch gesture
     */
    async onPinchGesture(handPosition) {
        console.log('Pinch gesture detected');

        // Convert hand position to AR space
        const position = this.handPositionToARSpace(handPosition);

        try {
            // Show feedback that orb creation started
            this.updateStatus('Creating orb...');

            const orb = await orbCreator.createOrb(position);
            this.updateEnvironmentalData(orb.userData.weatherData, orb.userData.airQualityData);

            // Reset status
            this.updateStatus('AR Active');
        } catch (error) {
            console.error('Failed to create orb from gesture:', error);
            this.updateStatus('Orb creation failed');

            // Reset status after brief delay
            setTimeout(() => {
                this.updateStatus('AR Active');
            }, 2000);
        }
    }

    /**
     * Handle open hand gesture
     */
    async onOpenHandGesture(handPosition) {
        console.log('Open hand gesture detected');

        const plant = plantDetector.getLatestPlant();
        if (!plant) {
            console.log('No plant detected yet, attaching orbs to wrist instead');
            // Attach existing orbs to wrist
            const allOrbs = orbCreator.getAllOrbs();
            if (allOrbs.length > 0) {
                orbCreator.attachOrbsToWrist(allOrbs);
                this.updateStatus('Orbs attached to wrist');
                setTimeout(() => this.updateStatus('AR Active'), 2000);
            }
            return;
        }

        // Convert hand position to AR space
        const position = this.handPositionToARSpace(handPosition);

        try {
            await pendantCreator.createPendant(position);
        } catch (error) {
            console.error('Failed to create pendant from gesture:', error);
        }
    }

    /**
     * Handle peace gesture - clear all AR objects
     */
    onPeaceGesture(handPosition) {
        console.log('Peace gesture detected - clearing all AR objects');

        // Clear all orbs
        orbCreator.clearAllOrbs();

        // Clear all pendants and connections
        pendantCreator.clearAll();

        // Update status
        this.updateStatus('AR cleared');
        setTimeout(() => this.updateStatus('AR Active'), 2000);
    }


    /**
     * Convert hand position to AR space
     */
    handPositionToARSpace(handPosition) {
        // Convert normalized screen coordinates to AR space
        const x = (handPosition.x - 0.5) * 2 * CONFIG.ar.orbDistance;
        const y = -(handPosition.y - 0.5) * 2 * CONFIG.ar.orbDistance;
        const z = -CONFIG.ar.orbDistance;

        const position = new THREE.Vector3(x, y, z);
        position.applyQuaternion(this.camera.quaternion);
        position.add(this.camera.position);

        return position;
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // Update wrist tracking for orbs
        const wristLandmarks = handTracking.getWristLandmarks();
        if (wristLandmarks) {
            orbCreator.updateWristPosition(wristLandmarks);
        }

        // Update orbs
        orbCreator.update(deltaTime);

        // Update pendants and connections
        pendantCreator.update(deltaTime);

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Update environmental data display
     */
    updateEnvironmentalData(weatherData, airQualityData) {
        this.ui.tempValue.textContent = `${Math.round(weatherData.temperature)}°C`;
        this.ui.weatherValue.textContent = weatherData.description;

        const aqi = airQualityData.aqiUS;
        let aqiLabel = 'Good';
        if (aqi > 200) aqiLabel = 'Hazardous';
        else if (aqi > 150) aqiLabel = 'Very Unhealthy';
        else if (aqi > 100) aqiLabel = 'Unhealthy';
        else if (aqi > 50) aqiLabel = 'Moderate';

        this.ui.aqiValue.textContent = `${aqi} (${aqiLabel})`;
    }

    /**
     * Show plant info panel
     */
    showPlantInfo(plant) {
        this.ui.plantInfoContent.innerHTML = plantDetector.formatPlantInfo(plant);
        this.ui.plantInfoPanel.classList.remove('hidden');
    }

    /**
     * Hide plant info panel
     */
    hidePlantInfo() {
        this.ui.plantInfoPanel.classList.add('hidden');
    }

    /**
     * Update status indicator
     */
    updateStatus(text) {
        this.ui.statusText.textContent = text;
    }

    /**
     * Show loading spinner
     */
    showLoading(text = 'Processing...') {
        this.ui.loadingSpinner.querySelector('.loading-text').textContent = text;
        this.ui.loadingSpinner.classList.remove('hidden');
    }

    /**
     * Hide loading spinner
     */
    hideLoading() {
        this.ui.loadingSpinner.classList.add('hidden');
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize and start the application
const app = new ARPlantGame();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    app.initialize();
}

// Export for debugging
window.arPlantGame = app;

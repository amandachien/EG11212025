// Plant Detector Module
// Handles plant identification and segmentation

import { apiService } from './api-service.js';

class PlantDetector {
    constructor() {
        this.isProcessing = false;
        this.detectedPlants = [];
        this.segmentationModel = null;
        this.currentPlantSegmentation = null;
        this.demoMode = false; // Demo mode flag
    }

    /**
     * Initialize plant detector
     */
    async initialize() {
        try {
            // Load DeepLab model for plant segmentation
            console.log('Loading plant segmentation model...');
            this.segmentationModel = await deeplab.load({
                base: 'pascal',
                quantizationBytes: 2
            });
            console.log('Plant segmentation model loaded');
            return true;
        } catch (error) {
            console.error('Failed to load segmentation model:', error);
            // Continue without segmentation
            return false;
        }
    }

    /**
     * Enable demo mode (no API calls)
     */
    enableDemoMode() {
        this.demoMode = true;
        console.log('Demo mode enabled - plant detection will use mock data');
    }

    /**
     * Disable demo mode
     */
    disableDemoMode() {
        this.demoMode = false;
        console.log('Demo mode disabled - plant detection will use real API');
    }

    /**
     * Get demo plant data (mock)
     */
    getDemoPlantData() {
        const demoPlants = [
            {
                name: 'Monstera Deliciosa',
                commonNames: ['Swiss Cheese Plant', 'Split-leaf Philodendron'],
                scientificName: 'Monstera deliciosa',
                probability: 0.95,
                description: 'A species of flowering plant native to tropical forests of southern Mexico. Known for its large, glossy, heart-shaped leaves with natural holes and splits.',
                source: 'Demo'
            },
            {
                name: 'Pothos',
                commonNames: ['Devil\'s Ivy', 'Golden Pothos'],
                scientificName: 'Epipremnum aureum',
                probability: 0.92,
                description: 'A popular houseplant with heart-shaped leaves. Very easy to care for and can thrive in various lighting conditions.',
                source: 'Demo'
            },
            {
                name: 'Snake Plant',
                commonNames: ['Mother-in-Law\'s Tongue', 'Sansevieria'],
                scientificName: 'Dracaena trifasciata',
                probability: 0.89,
                description: 'A resilient succulent that can grow anywhere between 6 inches to several feet tall. Known for its air-purifying qualities.',
                source: 'Demo'
            },
            {
                name: 'Peace Lily',
                commonNames: ['Spathiphyllum', 'White Sails'],
                scientificName: 'Spathiphyllum wallisii',
                probability: 0.88,
                description: 'A tropical plant known for its elegant white flowers and ability to thrive in low light conditions.',
                source: 'Demo'
            }
        ];

        // Return random demo plant
        return demoPlants[Math.floor(Math.random() * demoPlants.length)];
    }

    /**
     * Capture and identify plant from video frame
     * @param {HTMLVideoElement} videoElement - Video element
     * @returns {Promise<Object>} Plant identification result
     */
    async identifyPlant(videoElement) {
        if (this.isProcessing) {
            console.log('Already processing a plant identification request');
            return null;
        }

        this.isProcessing = true;

        try {
            // Demo mode - return mock data
            if (this.demoMode) {
                console.log('Using demo mode - returning mock plant data');
                const imageData = this.captureFrame(videoElement);
                const demoData = this.getDemoPlantData();

                const plant = {
                    id: Date.now(),
                    name: demoData.name,
                    commonNames: demoData.commonNames,
                    scientificName: demoData.scientificName,
                    probability: demoData.probability,
                    description: demoData.description,
                    imageData: imageData,
                    segmentation: null,
                    timestamp: Date.now(),
                    source: demoData.source
                };

                this.detectedPlants.push(plant);
                return plant;
            }

            // Real API mode
            // Capture frame from video
            const imageData = this.captureFrame(videoElement);

            // Send to Plant.id API via Netlify Function
            let result;
            let isFallback = false;

            try {
                result = await apiService.identifyPlant(imageData);
            } catch (apiError) {
                console.warn('Primary API failed, trying PlantNet fallback:', apiError);
                try {
                    result = await apiService.identifyPlantNet(imageData);
                    isFallback = true;
                } catch (fallbackError) {
                    console.error('Fallback API also failed:', fallbackError);
                    throw apiError; // Throw original error if both fail
                }
            }

            // Segment the plant if model is loaded
            if (this.segmentationModel) {
                await this.segmentPlant(videoElement);
            }

            // Store detected plant
            if (isFallback) {
                // Handle PlantNet response structure
                if (result && result.results && result.results.length > 0) {
                    const bestMatch = result.results[0];
                    const plant = {
                        id: Date.now(),
                        name: bestMatch.species.commonNames[0] || bestMatch.species.scientificNameWithoutAuthor,
                        commonNames: bestMatch.species.commonNames || [],
                        scientificName: bestMatch.species.scientificNameWithoutAuthor,
                        probability: bestMatch.score,
                        description: 'Identified via PlantNet',
                        imageData: imageData,
                        segmentation: this.currentPlantSegmentation,
                        timestamp: Date.now(),
                        source: 'PlantNet'
                    };
                    this.detectedPlants.push(plant);
                    return plant;
                }
            } else {
                // Handle Plant.id response structure
                if (result && result.suggestions && result.suggestions.length > 0) {
                    const plant = {
                        id: Date.now(),
                        name: result.suggestions[0].plant_name,
                        commonNames: result.suggestions[0].plant_details?.common_names || [],
                        scientificName: result.suggestions[0].plant_details?.scientific_name,
                        probability: result.suggestions[0].probability,
                        description: result.suggestions[0].plant_details?.wiki_description?.value,
                        imageData: imageData,
                        segmentation: this.currentPlantSegmentation,
                        timestamp: Date.now(),
                        source: 'Plant.id'
                    };

                    this.detectedPlants.push(plant);
                    return plant;
                }
            }

            return null;
        } catch (error) {
            console.error('Plant identification error:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Capture frame from video element
     * @param {HTMLVideoElement} videoElement
     * @returns {string} Base64 encoded image
     */
    captureFrame(videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0);

        // Convert to base64
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    }

    /**
     * Segment plant from video frame using DeepLab
     * @param {HTMLVideoElement} videoElement
     */
    async segmentPlant(videoElement) {
        if (!this.segmentationModel) {
            console.log('Segmentation model not loaded');
            return null;
        }

        try {
            const segmentation = await this.segmentationModel.segment(videoElement);

            // Extract plant pixels (assuming plant is the main object)
            this.currentPlantSegmentation = this.extractPlantMask(segmentation);

            return this.currentPlantSegmentation;
        } catch (error) {
            console.error('Plant segmentation error:', error);
            return null;
        }
    }

    /**
     * Extract plant mask from segmentation result
     * @param {Object} segmentation - DeepLab segmentation result
     * @returns {ImageData} Plant mask
     */
    extractPlantMask(segmentation) {
        const { width, height, segmentationMap } = segmentation;

        // Create canvas for mask
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Create image data
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        // Extract plant pixels (class 15 is typically "plant" in PASCAL VOC)
        // We'll use any non-background class for now
        for (let i = 0; i < segmentationMap.length; i++) {
            const classId = segmentationMap[i];
            const pixelIndex = i * 4;

            if (classId > 0) { // Non-background
                data[pixelIndex] = 0;       // R
                data[pixelIndex + 1] = 255; // G (green for plants)
                data[pixelIndex + 2] = 136; // B
                data[pixelIndex + 3] = 180; // A (semi-transparent)
            } else {
                data[pixelIndex + 3] = 0; // Transparent background
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Get most recent detected plant
     * @returns {Object|null}
     */
    getLatestPlant() {
        if (this.detectedPlants.length === 0) return null;
        return this.detectedPlants[this.detectedPlants.length - 1];
    }

    /**
     * Get all detected plants
     * @returns {Array}
     */
    getAllPlants() {
        return this.detectedPlants;
    }

    /**
     * Clear detected plants
     */
    clearPlants() {
        this.detectedPlants = [];
        this.currentPlantSegmentation = null;
    }

    /**
     * Format plant info for display
     * @param {Object} plant
     * @returns {string} HTML string
     */
    formatPlantInfo(plant) {
        const commonName = plant.commonNames && plant.commonNames.length > 0
            ? plant.commonNames[0]
            : plant.name;

        const confidence = Math.round(plant.probability * 100);

        let html = `
      <div class="plant-card">
        <h4 class="plant-name">${commonName}</h4>
        ${plant.scientificName ? `<p class="plant-scientific"><em>${plant.scientificName}</em></p>` : ''}
        <div class="plant-confidence">
          <span class="confidence-label">Confidence:</span>
          <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${confidence}%"></div>
          </div>
          <span class="confidence-value">${confidence}%</span>
        </div>
        ${plant.description ? `<p class="plant-description">${plant.description.substring(0, 200)}...</p>` : ''}
      </div>
    `;

        return html;
    }
}

// Export singleton instance
export const plantDetector = new PlantDetector();

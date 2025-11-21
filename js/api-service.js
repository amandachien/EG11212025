// API Service - Handles all API calls through Netlify Functions
// NO API KEYS HERE - they are securely stored in Netlify environment variables

import { CONFIG } from '../config.js';

class APIService {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    /**
     * Identify a plant from an image
     * @param {string} imageData - Base64 encoded image
     * @returns {Promise<Object>} Plant identification results
     */
    async identifyPlant(imageData) {
        try {
            const response = await fetch(CONFIG.api.plantIdentify, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageData })
            });

            if (!response.ok) {
                throw new Error(`Plant identification failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Plant identification error:', error);
            throw error;
        }
    }

    /**
     * Get weather data for a location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} Weather data
     */
    async getWeather(lat, lon) {
        const cacheKey = `weather_${lat}_${lon}`;

        // Check cache
        if (this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey).data;
        }

        // Check if request is already pending
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        try {
            const requestPromise = fetch(
                `${CONFIG.api.weather}?lat=${lat}&lon=${lon}`
            ).then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Weather API failed: ${response.status}`);
                }
                return response.json();
            });

            this.pendingRequests.set(cacheKey, requestPromise);
            const data = await requestPromise;
            this.pendingRequests.delete(cacheKey);

            // Cache the result
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            this.pendingRequests.delete(cacheKey);
            console.error('Weather API error:', error);
            throw error;
        }
    }

    /**
     * Get air quality data for a location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} Air quality data
     */
    async getAirQuality(lat, lon) {
        const cacheKey = `airquality_${lat}_${lon}`;

        // Check cache
        if (this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey).data;
        }

        // Check if request is already pending
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        try {
            const requestPromise = fetch(
                `${CONFIG.api.airQuality}?lat=${lat}&lon=${lon}`
            ).then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Air Quality API failed: ${response.status}`);
                }
                return response.json();
            });

            this.pendingRequests.set(cacheKey, requestPromise);
            const data = await requestPromise;
            this.pendingRequests.delete(cacheKey);

            // Cache the result
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            this.pendingRequests.delete(cacheKey);
            console.error('Air Quality API error:', error);
            throw error;
        }
    }

    /**
     * Get current geolocation
     * @returns {Promise<{lat: number, lon: number}>}
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    /**
     * Set cache with timestamp
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Check if cache is valid
     */
    isCacheValid(key) {
        if (!this.cache.has(key)) return false;

        const cached = this.cache.get(key);
        const age = Date.now() - cached.timestamp;
        return age < CONFIG.performance.cacheTimeout;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export singleton instance
export const apiService = new APIService();

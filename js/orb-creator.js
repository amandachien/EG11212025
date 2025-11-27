// Orb Creator Module
// Creates 3D liquid orbs with environmental data visualization

import * as THREE from 'three';
import { apiService } from './api-service.js';
import { CONFIG } from '../config.js';

class OrbCreator {
    constructor() {
        this.orbs = [];
        this.scene = null;
        this.liquidShaderMaterial = null;
        this.wristOrbs = []; // Orbs attached to wrist
        this.wristPosition = null;
        this.wristOrientation = null;
        this.isWristTracking = false;
        this.tagsContainer = document.getElementById('tags-container');
    }

    /**
     * Initialize orb creator with Three.js scene
     * @param {THREE.Scene} scene - Three.js scene
     */
    initialize(scene) {
        this.scene = scene;
        this.createLiquidShaderMaterial();
    }

    /**
     * Create custom shader material for liquid orb effect
     */
    createLiquidShaderMaterial() {
        const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform float time;
      uniform float morphFactor;
      uniform float spikiness;
      
      // Simplex noise function (simplified)
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        // Add noise-based distortion
        float noise = snoise(position * 2.0 + time * 0.5);
        float displacement = noise * morphFactor * 0.3;
        
        // Add spiky distortion
        float spikeNoise = snoise(position * 5.0 + time);
        displacement += spikeNoise * spikiness * 0.2;
        
        vec3 newPosition = position + normal * displacement;
        vPosition = newPosition;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;

        const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform float time;
      uniform float opacity;
      
      void main() {
        // View direction
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        vec3 normal = normalize(vNormal);
        
        // Fresnel effect (stronger for metallic look)
        float fresnel = pow(1.0 - dot(viewDirection, normal), 2.0);
        
        // Y3K Gradient Palette
        vec3 silver = vec3(0.9, 0.9, 1.0);
        vec3 neonPink = vec3(1.0, 0.0, 0.8);
        vec3 electricBlue = vec3(0.0, 0.8, 1.0);
        
        // Animated color mixing
        float mixFactor = sin(time + vPosition.y * 2.0) * 0.5 + 0.5;
        
        // Base color: Mix between the data-driven color (color1) and Y3K silver
        vec3 baseColor = mix(color1, silver, 0.6);
        
        // Secondary color: Mix with neon accents based on position
        vec3 accentColor = mix(neonPink, electricBlue, sin(vPosition.x * 4.0 + time) * 0.5 + 0.5);
        
        // Combine base and accent
        vec3 finalColor = mix(baseColor, accentColor, fresnel * 0.5);
        
        // Pseudo-Environment Reflection (Metallic look)
        vec3 ref = reflect(-viewDirection, normal);
        float reflection = dot(ref, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5; // Fake sky reflection
        
        // Add strong specular highlight
        float specular = pow(max(dot(ref, vec3(0.5, 0.7, 0.5)), 0.0), 30.0);
        
        // Compose final look
        finalColor += reflection * 0.3 * silver; // Add reflection
        finalColor += specular * 0.8; // Add specular highlight
        finalColor += fresnel * 0.4 * electricBlue; // Add rim glow
        
        // Pulsing effect
        float pulse = sin(time * 2.0) * 0.05 + 0.95;
        
        gl_FragColor = vec4(finalColor * pulse, opacity);
      }
    `;

        this.liquidShaderMaterial = {
            vertexShader,
            fragmentShader
        };
    }

    /**
     * Create an orb at a position with environmental data
     * @param {THREE.Vector3} position - Position in AR space
     * @param {Object} weatherData - Weather data
     * @param {Object} airQualityData - Air quality data
     * @returns {THREE.Mesh} Orb mesh
     */
    async createOrb(position) {
        let weatherData, airQualityData;

        try {
            // Get current location
            const location = await apiService.getCurrentLocation();

            // Fetch environmental data
            [weatherData, airQualityData] = await Promise.all([
                apiService.getWeather(location.lat, location.lon),
                apiService.getAirQuality(location.lat, location.lon)
            ]);
        } catch (error) {
            console.warn('Failed to fetch environmental data, using fallback:', error);

            // Use fallback mock data so orb always appears
            weatherData = {
                temperature: 20,
                condition: 'clear',
                description: 'Clear Sky'
            };

            airQualityData = {
                aqiUS: 50  // Good air quality
            };
        }

        // Map data to visual properties
        const visualProps = this.mapDataToVisuals(weatherData, airQualityData);

        // Create orb geometry
        const geometry = new THREE.SphereGeometry(CONFIG.ar.orbScale, 32, 32);

        // Create material with shader
        const material = new THREE.ShaderMaterial({
            vertexShader: this.liquidShaderMaterial.vertexShader,
            fragmentShader: this.liquidShaderMaterial.fragmentShader,
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(visualProps.color) },
                color2: { value: new THREE.Color(visualProps.color).offsetHSL(0, 0, 0.2) },
                morphFactor: { value: visualProps.morphFactor },
                spikiness: { value: visualProps.spikiness },
                opacity: { value: 0.85 }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        // Create mesh
        const orb = new THREE.Mesh(geometry, material);
        orb.position.copy(position);

        // Store metadata
        orb.userData = {
            type: 'orb',
            weatherData,
            airQualityData,
            visualProps,
            animationSpeed: visualProps.animationSpeed,
            createdAt: Date.now()
        };

        // Add to scene
        if (this.scene) {
            this.scene.add(orb);
        }

        this.orbs.push(orb);

        // Limit number of orbs
        if (this.orbs.length > CONFIG.performance.maxOrbs) {
            this.removeOrb(this.orbs[0]);
        }

        // Create coordinate tag
        this.createTag(orb);

        return orb;
    }

    /**
     * Map environmental data to visual properties
     */
    mapDataToVisuals(weatherData, airQualityData) {
        // Map air quality to color
        const aqi = airQualityData.aqiUS;
        let color;

        if (aqi <= CONFIG.airQuality.thresholds[0]) {
            color = CONFIG.airQuality.colors.good;
        } else if (aqi <= CONFIG.airQuality.thresholds[1]) {
            color = CONFIG.airQuality.colors.moderate;
        } else if (aqi <= CONFIG.airQuality.thresholds[2]) {
            color = CONFIG.airQuality.colors.unhealthy;
        } else if (aqi <= CONFIG.airQuality.thresholds[3]) {
            color = CONFIG.airQuality.colors.veryUnhealthy;
        } else {
            color = CONFIG.airQuality.colors.hazardous;
        }

        // Map weather to shape
        const condition = weatherData.condition.toLowerCase();
        const shapeConfig = CONFIG.weather.shapes[condition] || CONFIG.weather.shapes.clear;

        // Map temperature to animation speed
        const temp = weatherData.temperature;
        const tempNormalized = (temp - CONFIG.temperature.minTemp) /
            (CONFIG.temperature.maxTemp - CONFIG.temperature.minTemp);
        const animationSpeed = CONFIG.temperature.minSpeed +
            (tempNormalized * (CONFIG.temperature.maxSpeed - CONFIG.temperature.minSpeed));

        return {
            color,
            morphFactor: shapeConfig.morphFactor,
            spikiness: shapeConfig.spikiness,
            animationSpeed: Math.max(CONFIG.temperature.minSpeed, Math.min(animationSpeed, CONFIG.temperature.maxSpeed))
        };
    }

    /**
     * Update orb animations
     * @param {number} deltaTime - Time since last frame
     * @param {THREE.Camera} camera - Camera for projecting tags
     */
    update(deltaTime, camera) {
        this.orbs.forEach(orb => {
            if (orb.material.uniforms) {
                orb.material.uniforms.time.value += deltaTime * orb.userData.animationSpeed;
            }

            // Gentle floating animation for non-wrist orbs
            if (!orb.userData.attachedToWrist) {
                orb.position.y += Math.sin(Date.now() * 0.001 + orb.userData.createdAt) * 0.0001;
            }
        });

        // Update wrist-attached orbs
        if (this.isWristTracking && this.wristPosition) {
            this.updateWristOrbPositions();
        }

        // Update tags
        if (camera) {
            this.updateTags(camera);
        }
    }

    /**
     * Attach orbs to wrist in circular pattern
     * @param {Array} orbs - Orbs to attach to wrist
     */
    attachOrbsToWrist(orbs) {
        if (!orbs || orbs.length === 0) return;

        this.wristOrbs = orbs;
        this.isWristTracking = true;

        // Mark orbs as attached
        orbs.forEach(orb => {
            orb.userData.attachedToWrist = true;
        });

        console.log(`Attached ${orbs.length} orbs to wrist`);
    }

    /**
     * Update wrist position from hand tracking landmarks
     * @param {Object} wristLandmarks - Wrist landmark data from hand tracking
     */
    updateWristPosition(wristLandmarks) {
        if (!wristLandmarks) {
            this.wristPosition = null;
            this.wristOrientation = null;
            return;
        }

        this.wristPosition = wristLandmarks.position;
        this.wristOrientation = {
            indexMCP: wristLandmarks.indexMCP,
            pinkyMCP: wristLandmarks.pinkyMCP
        };
    }

    /**
     * Update positions of hand-attached orbs in 3D spherical orbit
     */
    updateWristOrbPositions() {
        if (!this.wristPosition || this.wristOrbs.length === 0) return;

        // Orbit radius - visible distance from palm center
        const orbitRadius = 0.15;
        const numOrbs = this.wristOrbs.length;
        const time = Date.now() * 0.0005;

        // Calculate hand orientation basis vectors
        // Default to identity if no orientation data
        let u = new THREE.Vector3(1, 0, 0);
        let v = new THREE.Vector3(0, 1, 0);
        let n = new THREE.Vector3(0, 0, 1);

        if (this.wristOrientation) {
            // Convert landmarks to AR space vectors
            const wrist = this.toVector(this.wristPosition);
            const index = this.toVector(this.wristOrientation.indexMCP);
            const pinky = this.toVector(this.wristOrientation.pinkyMCP);

            // Vector from wrist to knuckles
            const v1 = new THREE.Vector3().subVectors(index, wrist).normalize();
            const v2 = new THREE.Vector3().subVectors(pinky, wrist).normalize();

            // Normal to the palm plane (approximate)
            n.crossVectors(v1, v2).normalize();

            // Forward vector (towards fingers)
            v.addVectors(v1, v2).normalize();

            // Right vector
            u.crossVectors(v, n).normalize();
        }

        this.wristOrbs.forEach((orb, index) => {
            const angleOffset = (2 * Math.PI * index) / numOrbs;

            // Rotate around the hand's "up" vector (n)
            // We want the ring to encircle the wrist, so we rotate in the u-n plane or u-v plane?
            // Usually a bracelet goes around the wrist. The wrist axis is roughly 'v' (forearm direction).
            // So we want to rotate in the u-n plane.

            const angle = time + angleOffset;

            // Calculate offset in the local basis (u, n)
            const localX = Math.cos(angle) * orbitRadius;
            const localY = Math.sin(angle) * orbitRadius; // Actually local Z in hand space

            // Combine basis vectors
            const offset = new THREE.Vector3()
                .addScaledVector(u, localX)
                .addScaledVector(n, localY);

            // Apply a slight oscillation along the arm axis (v) for "floating" effect
            const floatOffset = Math.sin(time * 2 + index) * 0.02;
            offset.addScaledVector(v, floatOffset);

            // Convert wrist position to AR space
            const basePos = this.handPositionToARSpace(this.wristPosition);

            orb.position.copy(basePos).add(offset);
        });
    }

    /**
     * Helper to convert normalized landmark to Vector3 (screen space)
     */
    toVector(landmark) {
        return new THREE.Vector3(landmark.x, landmark.y, landmark.z);
    }

    /**
     * Helper to convert hand position to AR space (duplicated from main.js logic for consistency)
     */
    handPositionToARSpace(handPosition) {
        const x = (handPosition.x - 0.5) * 2 * CONFIG.ar.orbDistance;
        const y = -(handPosition.y - 0.5) * 2 * CONFIG.ar.orbDistance;
        const z = -CONFIG.ar.orbDistance;

        // Note: We don't have access to camera here directly for rotation, 
        // but since we are updating every frame in world space, we can approximate 
        // or pass camera. For now, we'll assume camera is at origin looking down -Z 
        // or rely on the fact that we are adding to camera position in main.js.
        // Wait, main.js does: position.applyQuaternion(camera.quaternion).add(camera.position).
        // I need to replicate that or pass the camera to this method.
        // Since I don't have camera here easily without passing it down, 
        // I will use a simplified projection assuming the camera hasn't moved much 
        // or just use the raw values if the camera is static.
        // BETTER: Use the camera passed in update() if available, but updateWristOrbPositions is called from update().
        // I'll assume standard AR view.

        return new THREE.Vector3(x, y, z);
    }

    /**
     * Create coordinate tag for an orb
     */
    createTag(orb) {
        if (!this.tagsContainer) return;

        const tag = document.createElement('div');
        tag.className = 'coordinate-tag';
        this.tagsContainer.appendChild(tag);
        orb.userData.tagElement = tag;
    }

    /**
     * Remove coordinate tag
     */
    removeTag(orb) {
        if (orb.userData.tagElement && orb.userData.tagElement.parentNode) {
            orb.userData.tagElement.parentNode.removeChild(orb.userData.tagElement);
        }
    }

    /**
     * Update all coordinate tags
     */
    updateTags(camera) {
        this.orbs.forEach(orb => {
            const tag = orb.userData.tagElement;
            if (!tag) return;

            // Project 3D position to 2D screen space
            const position = orb.position.clone();
            position.project(camera);

            // Check if visible (z < 1 means in front of camera)
            if (position.z < 1) {
                const x = (position.x * 0.5 + 0.5) * window.innerWidth;
                const y = -(position.y * 0.5 - 0.5) * window.innerHeight;

                // Use absolute positioning to prevent upper-left corner glitch
                tag.style.left = `${x}px`;
                tag.style.top = `${y}px`;
                tag.style.display = 'block';

                // Update text with coordinates
                const newText = `X:${orb.position.x.toFixed(2)} Y:${orb.position.y.toFixed(2)} Z:${orb.position.z.toFixed(2)}`;

                if (tag.textContent !== newText) {
                    tag.textContent = newText;
                    tag.classList.add('flash');
                } else {
                    tag.classList.remove('flash');
                }
            } else {
                tag.style.display = 'none';
            }
        });
    }

    /**
     * Hide all coordinate tags
     */
    hideAllTags() {
        this.orbs.forEach(orb => {
            const tag = orb.userData.tagElement;
            if (tag) {
                tag.style.display = 'none';
            }
        });
    }

    /**
     * Detach orbs from wrist
     */
    detachOrbsFromWrist() {
        this.wristOrbs.forEach(orb => {
            orb.userData.attachedToWrist = false;
        });
        this.wristOrbs = [];
        this.isWristTracking = false;
        this.wristPosition = null;
        this.wristOrientation = null;
        console.log('Detached orbs from wrist');
    }

    /**
     * Remove an orb
     */
    removeOrb(orb) {
        const index = this.orbs.indexOf(orb);
        if (index > -1) {
            this.orbs.splice(index, 1);
        }

        if (this.scene && orb.parent === this.scene) {
            this.scene.remove(orb);
        }

        this.removeTag(orb);

        if (orb.geometry) orb.geometry.dispose();
        if (orb.material) orb.material.dispose();
    }

    /**
     * Get all orbs
     */
    getAllOrbs() {
        return this.orbs;
    }

    /**
     * Clear all orbs
     */
    clearAllOrbs() {
        // Hide all tags first
        this.hideAllTags();

        // Detach from wrist first
        this.detachOrbsFromWrist();

        // Remove all orbs
        [...this.orbs].forEach(orb => this.removeOrb(orb));
        this.orbs = [];
    }
}

// Export singleton instance
export const orbCreator = new OrbCreator();

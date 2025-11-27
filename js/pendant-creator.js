// Pendant Creator Module
// Creates plant pendants with connections to orbs

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { plantDetector } from './plant-detector.js';
import { orbCreator } from './orb-creator.js';

class PendantCreator {
    constructor() {
        this.pendants = [];
        this.connections = [];
        this.scene = null;
        this.tagsContainer = document.getElementById('tags-container');
    }

    /**
     * Initialize pendant creator with Three.js scene
     * @param {THREE.Scene} scene - Three.js scene
     */
    initialize(scene) {
        this.scene = scene;
    }

    /**
     * Create a pendant from the latest detected plant
     * @param {THREE.Vector3} position - Position in AR space
     * @returns {THREE.Group} Pendant group
     */
    async createPendant(position) {
        const plant = plantDetector.getLatestPlant();

        if (!plant) {
            throw new Error('No plant detected. Please detect a plant first.');
        }

        try {
            // Create pendant group
            const pendantGroup = new THREE.Group();

            // Create pendant mesh with plant texture
            const pendantMesh = await this.createPendantMesh(plant);
            pendantGroup.add(pendantMesh);

            // Create frame around pendant
            const frame = this.createPendantFrame();
            pendantGroup.add(frame);

            // Position pendant
            pendantGroup.position.copy(position);

            // Store metadata
            pendantGroup.userData = {
                type: 'pendant',
                plant: plant,
                createdAt: Date.now()
            };

            // Add to scene
            if (this.scene) {
                this.scene.add(pendantGroup);
            }

            this.pendants.push(pendantGroup);

            // Create connections to all existing orbs
            this.connectToOrbs(pendantGroup);

            // Limit number of pendants
            if (this.pendants.length > CONFIG.performance.maxPendants) {
                this.removePendant(this.pendants[0]);
            }

            // Create coordinate tag
            this.createTag(pendantGroup);

            return pendantGroup;
        } catch (error) {
            console.error('Failed to create pendant:', error);
            throw error;
        }
    }

    /**
     * Create pendant mesh with plant texture
     */
    async createPendantMesh(plant) {
        // Create texture from plant image
        const texture = await this.createTextureFromImage(plant.imageData);

        // Create geometry (rounded rectangle)
        const shape = new THREE.Shape();
        const width = CONFIG.ar.pendantScale;
        const height = CONFIG.ar.pendantScale * 1.2;
        const radius = 0.01;

        shape.moveTo(-width / 2 + radius, -height / 2);
        shape.lineTo(width / 2 - radius, -height / 2);
        shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
        shape.lineTo(width / 2, height / 2 - radius);
        shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
        shape.lineTo(-width / 2 + radius, height / 2);
        shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
        shape.lineTo(-width / 2, -height / 2 + radius);
        shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);

        const geometry = new THREE.ShapeGeometry(shape);

        // Create material with plant texture
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        // Apply segmentation mask if available
        if (plant.segmentation) {
            const maskTexture = new THREE.CanvasTexture(plant.segmentation);
            material.alphaMap = maskTexture;
        }

        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    /**
     * Create pendant frame
     */
    createPendantFrame() {
        const width = CONFIG.ar.pendantScale;
        const height = CONFIG.ar.pendantScale * 1.2;

        // Create frame outline
        const shape = new THREE.Shape();
        const radius = 0.01;

        shape.moveTo(-width / 2 + radius, -height / 2);
        shape.lineTo(width / 2 - radius, -height / 2);
        shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
        shape.lineTo(width / 2, height / 2 - radius);
        shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
        shape.lineTo(-width / 2 + radius, height / 2);
        shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
        shape.lineTo(-width / 2, -height / 2 + radius);
        shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);

        const holePath = new THREE.Path();
        const innerWidth = width - 0.01;
        const innerHeight = height - 0.01;
        const innerRadius = radius * 0.8;

        holePath.moveTo(-innerWidth / 2 + innerRadius, -innerHeight / 2);
        holePath.lineTo(innerWidth / 2 - innerRadius, -innerHeight / 2);
        holePath.quadraticCurveTo(innerWidth / 2, -innerHeight / 2, innerWidth / 2, -innerHeight / 2 + innerRadius);
        holePath.lineTo(innerWidth / 2, innerHeight / 2 - innerRadius);
        holePath.quadraticCurveTo(innerWidth / 2, innerHeight / 2, innerWidth / 2 - innerRadius, innerHeight / 2);
        holePath.lineTo(-innerWidth / 2 + innerRadius, innerHeight / 2);
        holePath.quadraticCurveTo(-innerWidth / 2, innerHeight / 2, -innerWidth / 2, innerHeight / 2 - innerRadius);
        holePath.lineTo(-innerWidth / 2, -innerHeight / 2 + innerRadius);
        holePath.quadraticCurveTo(-innerWidth / 2, -innerHeight / 2, -innerWidth / 2 + innerRadius, -innerHeight / 2);

        shape.holes.push(holePath);

        const geometry = new THREE.ShapeGeometry(shape);

        // Y3K Shader Material
        const vertexShader = `
            varying vec3 vPosition;
            varying vec2 vUv;
            uniform float time;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vPosition;
            varying vec2 vUv;
            uniform float time;
            
            void main() {
                // Y3K Color Palette
                vec3 silver = vec3(0.9, 0.9, 1.0);
                vec3 neonPink = vec3(1.0, 0.0, 0.8);
                vec3 electricBlue = vec3(0.0, 0.8, 1.0);
                
                // Animated gradient based on position and time
                float mixFactor1 = sin(vPosition.y * 10.0 + time) * 0.5 + 0.5;
                float mixFactor2 = cos(vPosition.x * 10.0 + time * 0.7) * 0.5 + 0.5;
                
                // Mix colors
                vec3 color1 = mix(silver, neonPink, mixFactor1);
                vec3 color2 = mix(electricBlue, silver, mixFactor2);
                vec3 finalColor = mix(color1, color2, 0.5);
                
                // Add metallic shine
                float shine = pow(mixFactor1 * mixFactor2, 2.0);
                finalColor += shine * 0.3;
                
                // Pulsing effect
                float pulse = sin(time * 2.0) * 0.1 + 0.9;
                
                gl_FragColor = vec4(finalColor * pulse, 1.0);
            }
        `;

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                time: { value: 0 }
            },
            side: THREE.DoubleSide
        });

        const frame = new THREE.Mesh(geometry, material);
        frame.position.z = -0.001; // Slightly behind the pendant

        // Store material for animation
        frame.userData.isY3KFrame = true;

        return frame;
    }

    /**
     * Create texture from base64 image
     */
    createTextureFromImage(base64Data) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const texture = new THREE.Texture(img);
                texture.needsUpdate = true;
                resolve(texture);
            };
            img.onerror = reject;
            img.src = `data:image/jpeg;base64,${base64Data}`;
        });
    }

    /**
     * Connect pendant to all orbs with breaklines
     */
    connectToOrbs(pendant) {
        const orbs = orbCreator.getAllOrbs();

        orbs.forEach(orb => {
            const connection = this.createConnection(pendant, orb);
            this.connections.push(connection);

            if (this.scene) {
                this.scene.add(connection);
            }
        });
    }

    /**
     * Create animated connection line between pendant and orb
     */
    createConnection(obj1, obj2) {
        // Create line geometry
        const points = [
            obj1.position.clone(),
            obj2.position.clone()
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // Create dashed line material with glow
        const material = new THREE.LineDashedMaterial({
            color: 0xffffff,
            linewidth: 2,
            scale: 1,
            dashSize: 0.02,
            gapSize: 0.01,
            transparent: true,
            opacity: 0.6
        });

        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();

        // Store metadata for animation (support both pendant-orb and bracelet connections)
        line.userData = {
            type: 'connection',
            pendant: obj1.userData?.type === 'pendant' ? obj1 : obj2.userData?.type === 'pendant' ? obj2 : null,
            orb: obj1.userData?.type === 'orb' ? obj1 : obj2.userData?.type === 'orb' ? obj2 : null,
            obj1: obj1,
            obj2: obj2,
            phase: Math.random() * Math.PI * 2
        };

        return line;
    }

    /**
     * Update pendant and connection animations
     * @param {number} deltaTime - Time since last frame
     * @param {THREE.Camera} camera - Camera for projecting tags
     */
    update(deltaTime, camera) {
        // Update pendant rotations and Y3K frame animations
        this.pendants.forEach(pendant => {
            // Update wrist-attached pendant positions
            if (pendant.userData.attachedToWrist && pendant.userData.wristIndex !== undefined) {
                this.updateWristPendantPosition(pendant);
            }

            pendant.rotation.y += deltaTime * 0.5;

            // Update Y3K frame shader time
            pendant.traverse(child => {
                if (child.userData.isY3KFrame && child.material.uniforms) {
                    child.material.uniforms.time.value += deltaTime;
                }
            });
        });

        // Update connections
        this.connections.forEach(connection => {
            // Update line positions
            const obj1 = connection.userData.pendant || connection.userData.obj1;
            const obj2 = connection.userData.orb || connection.userData.obj2;

            if (obj1 && obj2) {
                const points = [
                    obj1.position.clone(),
                    obj2.position.clone()
                ];
                connection.geometry.setFromPoints(points);
                connection.computeLineDistances();

                // Animate opacity
                const phase = connection.userData.phase + Date.now() * 0.002;
                connection.material.opacity = 0.3 + Math.sin(phase) * 0.3;
            }
        });

        // Update tags
        if (camera) {
            this.updateTags(camera);
        }
    }

    /**
     * Update hand-attached pendant position in same orbit as orbs
     * @param {THREE.Group} pendant - Pendant to update
     */
    updateWristPendantPosition(pendant) {
        // Get hand center position from orb creator
        if (!orbCreator.wristPosition) return;

        // Use same orbit radius as orbs for consistent circular path
        const orbitRadius = 0.15;

        // Get total number of objects (orbs + pendants) for even distribution
        const totalObjects = orbCreator.wristOrbs.length +
            this.pendants.filter(p => p.userData.attachedToWrist).length;

        const index = pendant.userData.wristIndex;
        const time = Date.now() * 0.0005;

        // Calculate hand orientation basis vectors (same as orbs)
        let u = new THREE.Vector3(1, 0, 0);
        let v = new THREE.Vector3(0, 1, 0);
        let n = new THREE.Vector3(0, 0, 1);

        if (orbCreator.wristOrientation) {
            // Convert landmarks to AR space vectors
            const wrist = new THREE.Vector3(
                orbCreator.wristPosition.x,
                orbCreator.wristPosition.y,
                orbCreator.wristPosition.z
            );
            const indexMCP = new THREE.Vector3(
                orbCreator.wristOrientation.indexMCP.x,
                orbCreator.wristOrientation.indexMCP.y,
                orbCreator.wristOrientation.indexMCP.z
            );
            const pinkyMCP = new THREE.Vector3(
                orbCreator.wristOrientation.pinkyMCP.x,
                orbCreator.wristOrientation.pinkyMCP.y,
                orbCreator.wristOrientation.pinkyMCP.z
            );

            // Vector from wrist to knuckles
            const v1 = new THREE.Vector3().subVectors(indexMCP, wrist).normalize();
            const v2 = new THREE.Vector3().subVectors(pinkyMCP, wrist).normalize();

            // Normal to the palm plane
            n.crossVectors(v1, v2).normalize();

            // Forward vector (towards fingers)
            v.addVectors(v1, v2).normalize();

            // Right vector
            u.crossVectors(v, n).normalize();
        }

        // Calculate angle offset based on total objects
        const angleOffset = (2 * Math.PI * index) / totalObjects;
        const angle = time + angleOffset;

        // Calculate offset in the local basis (u, n) - same as orbs
        const localX = Math.cos(angle) * orbitRadius;
        const localY = Math.sin(angle) * orbitRadius;

        // Combine basis vectors
        const offset = new THREE.Vector3()
            .addScaledVector(u, localX)
            .addScaledVector(n, localY);

        // Apply slight oscillation along arm axis for floating effect
        const floatOffset = Math.sin(time * 2 + index) * 0.02;
        offset.addScaledVector(v, floatOffset);

        // Convert wrist position to AR space (same method as orbs)
        const x = (orbCreator.wristPosition.x - 0.5) * 2 * CONFIG.ar.orbDistance;
        const y = -(orbCreator.wristPosition.y - 0.5) * 2 * CONFIG.ar.orbDistance;
        const z = -CONFIG.ar.orbDistance;
        const basePos = new THREE.Vector3(x, y, z);

        // Set pendant position
        pendant.position.copy(basePos).add(offset);
    }

    /**
     * Remove a pendant and its connections
     */
    removePendant(pendant) {
        const index = this.pendants.indexOf(pendant);
        if (index > -1) {
            this.pendants.splice(index, 1);
        }

        // Remove connections
        this.connections = this.connections.filter(connection => {
            if (connection.userData.pendant === pendant) {
                if (this.scene && connection.parent === this.scene) {
                    this.scene.remove(connection);
                }
                connection.geometry.dispose();
                connection.material.dispose();
                return false;
            }
            return true;
        });

        // Remove pendant from scene
        if (this.scene && pendant.parent === this.scene) {
            this.scene.remove(pendant);
        }

        // Dispose resources
        pendant.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                if (child.material.alphaMap) child.material.alphaMap.dispose();
                child.material.dispose();
            }
        });

        this.removeTag(pendant);
    }

    /**
     * Get all pendants
     */
    getAllPendants() {
        return this.pendants;
    }

    /**
     * Hide all pendant coordinate tags
     */
    hideAllTags() {
        this.pendants.forEach(pendant => {
            const tag = pendant.userData.tagElement;
            if (tag) {
                tag.style.display = 'none';
            }
        });
    }

    /**
     * Clear all pendants and connections
     */
    clearAll() {
        // Hide all tags first
        this.hideAllTags();

        // Remove all connections first
        this.connections.forEach(connection => {
            if (this.scene && connection.parent === this.scene) {
                this.scene.remove(connection);
            }
            if (connection.geometry) connection.geometry.dispose();
            if (connection.material) connection.material.dispose();
        });
        this.connections = [];

        // Remove all pendants
        [...this.pendants].forEach(pendant => {
            if (this.scene && pendant.parent === this.scene) {
                this.scene.remove(pendant);
            }
            // Dispose resources
            pendant.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    if (child.material.alphaMap) child.material.alphaMap.dispose();
                    child.material.dispose();
                }
            });
        });
        this.pendants = [];

        console.log('Cleared all pendants and connections');
    }

    /**
     * Attach pendants to wrist in circular pattern
     * @param {Array} pendants - Pendants to attach
     * @param {number} orbCount - Number of orbs already on wrist (for offset)
     */
    attachPendantsToWrist(pendants, orbCount = 0) {
        pendants.forEach(pendant => {
            pendant.userData.attachedToWrist = true;
            pendant.userData.wristIndex = orbCount + pendants.indexOf(pendant);
        });
        console.log(`Attached ${pendants.length} pendants to wrist`);
    }

    /**
     * Create connections between all objects in bracelet
     * @param {Array} objects - All objects (orbs and pendants) in bracelet
     */
    createBraceletConnections(objects) {
        // Clear existing connections
        this.connections.forEach(connection => {
            if (this.scene && connection.parent === this.scene) {
                this.scene.remove(connection);
            }
            if (connection.geometry) connection.geometry.dispose();
            if (connection.material) connection.material.dispose();
        });
        this.connections = [];

        // Create connections between adjacent objects in the bracelet
        for (let i = 0; i < objects.length; i++) {
            const current = objects[i];
            const next = objects[(i + 1) % objects.length]; // Wrap around to first

            const connection = this.createConnection(current, next);
            this.connections.push(connection);

            if (this.scene) {
                this.scene.add(connection);
            }
        }

        console.log(`Created ${this.connections.length} bracelet connections`);
    }
    /**
     * Create coordinate tag for a pendant
     */
    createTag(pendant) {
        if (!this.tagsContainer) return;

        const tag = document.createElement('div');
        tag.className = 'coordinate-tag';
        this.tagsContainer.appendChild(tag);
        pendant.userData.tagElement = tag;
    }

    /**
     * Remove coordinate tag
     */
    removeTag(pendant) {
        if (pendant.userData.tagElement && pendant.userData.tagElement.parentNode) {
            pendant.userData.tagElement.parentNode.removeChild(pendant.userData.tagElement);
        }
    }

    /**
     * Update all coordinate tags
     */
    updateTags(camera) {
        this.pendants.forEach(pendant => {
            const tag = pendant.userData.tagElement;
            if (!tag) return;

            // Project 3D position to 2D screen space
            const position = pendant.position.clone();
            position.project(camera);

            // Check if visible (z < 1 means in front of camera)
            if (position.z < 1) {
                const x = (position.x * 0.5 + 0.5) * window.innerWidth;
                const y = -(position.y * 0.5 - 0.5) * window.innerHeight;

                // Use absolute positioning to prevent upper-left corner glitch (same as orbs)
                tag.style.left = `${x}px`;
                tag.style.top = `${y}px`;
                tag.style.display = 'block';

                // Update text with coordinates
                const newText = `X:${pendant.position.x.toFixed(2)} Y:${pendant.position.y.toFixed(2)} Z:${pendant.position.z.toFixed(2)}`;

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
}

// Export singleton instance
export const pendantCreator = new PendantCreator();

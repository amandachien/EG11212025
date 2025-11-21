// Pendant Creator Module
// Creates plant pendants and connects them to orbs with breaklines

import { CONFIG } from '../config.js';
import { plantDetector } from './plant-detector.js';
import { orbCreator } from './orb-creator.js';

class PendantCreator {
    constructor() {
        this.pendants = [];
        this.connections = [];
        this.scene = null;
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
        const material = new THREE.MeshBasicMaterial({
            color: 0xffd700, // Gold color
            side: THREE.DoubleSide
        });

        const frame = new THREE.Mesh(geometry, material);
        frame.position.z = -0.001; // Slightly behind the pendant

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
    createConnection(pendant, orb) {
        // Create line geometry
        const points = [
            pendant.position.clone(),
            orb.position.clone()
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

        // Store metadata for animation
        line.userData = {
            type: 'connection',
            pendant: pendant,
            orb: orb,
            phase: Math.random() * Math.PI * 2
        };

        return line;
    }

    /**
     * Update pendant and connection animations
     */
    update(deltaTime) {
        // Update pendant rotations
        this.pendants.forEach(pendant => {
            pendant.rotation.y += deltaTime * 0.5;
        });

        // Update connections
        this.connections.forEach(connection => {
            // Update line positions
            const points = [
                connection.userData.pendant.position.clone(),
                connection.userData.orb.position.clone()
            ];
            connection.geometry.setFromPoints(points);
            connection.computeLineDistances();

            // Animate opacity
            const phase = connection.userData.phase + Date.now() * 0.002;
            connection.material.opacity = 0.3 + Math.sin(phase) * 0.3;
        });
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
    }

    /**
     * Get all pendants
     */
    getAllPendants() {
        return this.pendants;
    }

    /**
     * Clear all pendants and connections
     */
    clearAll() {
        this.pendants.forEach(pendant => this.removePendant(pendant));
        this.pendants = [];
        this.connections = [];
    }
}

// Export singleton instance
export const pendantCreator = new PendantCreator();

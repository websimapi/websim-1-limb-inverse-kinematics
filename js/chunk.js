import { SeededRandom } from './utils';

// Constants
export const CHUNK_SIZE = 200;
export const CHUNK_RENDER_DISTANCE = 3;

// Biome types
export const BIOMES = {
    PLAINS: { color: '#7ec850', itemChance: 0.3, itemColor: '#ffdd00' },
    DESERT: { color: '#e3d985', itemChance: 0.2, itemColor: '#c17753' },
    FOREST: { color: '#4a7c10', itemChance: 0.4, itemColor: '#ff5588' },
    WATER: { color: '#4286f4', itemChance: 0.1, itemColor: '#00ffff' },
    MOUNTAIN: { color: '#a0a0a0', itemChance: 0.5, itemColor: '#d4af37' }
};

// Global state
let chunksExplored = 0;
let itemsCollected = 0;
let worldChunks = new Map(); // Map of chunk coordinates to chunk data

// Update the UI counters
export function updateCounters() {
    document.getElementById('chunksExplored').textContent = chunksExplored;
    document.getElementById('itemsCollected').textContent = itemsCollected;
}

// Chunk class to handle world generation
export class Chunk {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.items = [];
        this.explored = false;
        
        // Seed based on chunk position for consistent generation
        const chunkSeed = (x * 13337 + y * 92083) % 998244353;
        const random = new SeededRandom(chunkSeed);
        
        // Determine biome based on position and noise
        const distFromOrigin = Math.sqrt(x * x + y * y);
        
        let biomeChances = [
            { biome: BIOMES.PLAINS, chance: 0.5 },
            { biome: BIOMES.DESERT, chance: 0.2 },
            { biome: BIOMES.FOREST, chance: 0.2 },
            { biome: BIOMES.WATER, chance: 0.05 },
            { biome: BIOMES.MOUNTAIN, chance: 0.05 }
        ];
        
        // Adjust biome chances based on distance from origin
        if (distFromOrigin > 5) {
            biomeChances = [
                { biome: BIOMES.PLAINS, chance: 0.2 },
                { biome: BIOMES.DESERT, chance: 0.3 },
                { biome: BIOMES.FOREST, chance: 0.3 },
                { biome: BIOMES.WATER, chance: 0.1 },
                { biome: BIOMES.MOUNTAIN, chance: 0.1 }
            ];
        }
        
        if (distFromOrigin > 10) {
            biomeChances = [
                { biome: BIOMES.PLAINS, chance: 0.1 },
                { biome: BIOMES.DESERT, chance: 0.2 },
                { biome: BIOMES.FOREST, chance: 0.2 },
                { biome: BIOMES.WATER, chance: 0.2 },
                { biome: BIOMES.MOUNTAIN, chance: 0.3 }
            ];
        }
        
        // Select biome based on weighted chance
        const biomeRoll = random.next();
        let cumulativeChance = 0;
        this.biome = BIOMES.PLAINS; // Default
        
        for (const biomeOption of biomeChances) {
            cumulativeChance += biomeOption.chance;
            if (biomeRoll <= cumulativeChance) {
                this.biome = biomeOption.biome;
                break;
            }
        }
        
        // Generate items in the chunk
        const itemCount = random.intRange(0, 5);
        for (let i = 0; i < itemCount; i++) {
            if (random.next() < this.biome.itemChance) {
                this.items.push({
                    x: random.range(0, CHUNK_SIZE),
                    y: random.range(0, CHUNK_SIZE),
                    size: random.range(5, 15),
                    collected: false
                });
            }
        }
        
        // Generate terrain features
        this.features = [];
        if (this.biome === BIOMES.FOREST) {
            // Add trees
            const treeCount = random.intRange(5, 15);
            for (let i = 0; i < treeCount; i++) {
                this.features.push({
                    type: 'tree',
                    x: random.range(0, CHUNK_SIZE),
                    y: random.range(0, CHUNK_SIZE),
                    size: random.range(10, 25)
                });
            }
        } else if (this.biome === BIOMES.MOUNTAIN) {
            // Add rock formations
            const rockCount = random.intRange(3, 8);
            for (let i = 0; i < rockCount; i++) {
                this.features.push({
                    type: 'rock',
                    x: random.range(0, CHUNK_SIZE),
                    y: random.range(0, CHUNK_SIZE),
                    size: random.range(15, 35)
                });
            }
        } else if (this.biome === BIOMES.DESERT) {
            // Add cacti
            const cactiCount = random.intRange(2, 7);
            for (let i = 0; i < cactiCount; i++) {
                this.features.push({
                    type: 'cactus',
                    x: random.range(0, CHUNK_SIZE),
                    y: random.range(0, CHUNK_SIZE),
                    size: random.range(8, 20)
                });
            }
        } else if (this.biome === BIOMES.WATER) {
            // Add lily pads
            const lilyCount = random.intRange(5, 12);
            for (let i = 0; i < lilyCount; i++) {
                this.features.push({
                    type: 'lily',
                    x: random.range(0, CHUNK_SIZE),
                    y: random.range(0, CHUNK_SIZE),
                    size: random.range(5, 15)
                });
            }
        }
    }
    
    // Mark chunk as explored and increment counter
    markExplored() {
        if (!this.explored) {
            this.explored = true;
            chunksExplored++;
            updateCounters();
        }
    }
    
    // Calculate world position from chunk coordinates
    getWorldX() {
        return this.x * CHUNK_SIZE;
    }
    
    getWorldY() {
        return this.y * CHUNK_SIZE;
    }
    
    // Draw chunk and its contents
    draw(ctx, camera) {
        const screenX = this.getWorldX() - camera.x;
        const screenY = this.getWorldY() - camera.y;
        
        // Draw chunk background
        ctx.fillStyle = this.biome.color;
        ctx.fillRect(screenX, screenY, CHUNK_SIZE, CHUNK_SIZE);
        
        // Draw chunk border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, CHUNK_SIZE, CHUNK_SIZE);
        
        // Draw features
        for (const feature of this.features) {
            const featureScreenX = screenX + feature.x;
            const featureScreenY = screenY + feature.y;
            
            if (feature.type === 'tree') {
                // Draw tree trunk
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(
                    featureScreenX - feature.size/6, 
                    featureScreenY - feature.size/2, 
                    feature.size/3, 
                    feature.size/2
                );
                
                // Draw tree top
                ctx.fillStyle = '#2d5f1d';
                ctx.beginPath();
                ctx.arc(
                    featureScreenX, 
                    featureScreenY - feature.size/2, 
                    feature.size/2, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            } else if (feature.type === 'rock') {
                ctx.fillStyle = '#707070';
                ctx.beginPath();
                ctx.arc(
                    featureScreenX, 
                    featureScreenY, 
                    feature.size/2, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            } else if (feature.type === 'cactus') {
                ctx.fillStyle = '#7d9f60';
                ctx.fillRect(
                    featureScreenX - feature.size/6, 
                    featureScreenY - feature.size/2, 
                    feature.size/3, 
                    feature.size
                );
                
                // Cactus arms
                ctx.fillRect(
                    featureScreenX - feature.size/6, 
                    featureScreenY - feature.size/4, 
                    feature.size/2, 
                    feature.size/3
                );
            } else if (feature.type === 'lily') {
                ctx.fillStyle = '#49a34d';
                ctx.beginPath();
                ctx.arc(
                    featureScreenX, 
                    featureScreenY, 
                    feature.size/2, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        // Draw items
        for (const item of this.items) {
            if (!item.collected) {
                const itemScreenX = screenX + item.x;
                const itemScreenY = screenY + item.y;
                
                // Glow effect
                const gradient = ctx.createRadialGradient(
                    itemScreenX, itemScreenY, 0,
                    itemScreenX, itemScreenY, item.size * 1.5
                );
                gradient.addColorStop(0, this.biome.itemColor);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(itemScreenX, itemScreenY, item.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Item
                ctx.fillStyle = this.biome.itemColor;
                ctx.beginPath();
                ctx.arc(itemScreenX, itemScreenY, item.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner glow
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(
                    itemScreenX - item.size * 0.3, 
                    itemScreenY - item.size * 0.3, 
                    item.size * 0.3, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
    
    // Check if player is collecting items in this chunk
    checkItemCollection(worldX, worldY, collectionRadius) {
        const relativeX = worldX - this.getWorldX();
        const relativeY = worldY - this.getWorldY();
        
        for (const item of this.items) {
            if (!item.collected) {
                const distance = Math.sqrt(
                    (relativeX - item.x) ** 2 + 
                    (relativeY - item.y) ** 2
                );
                
                if (distance < collectionRadius + item.size) {
                    item.collected = true;
                    itemsCollected++;
                    updateCounters();
                    
                    // Visual feedback could be added here
                    return true;
                }
            }
        }
        return false;
    }
}

// Get or create a chunk at the specified coordinates
export function getChunk(chunkX, chunkY) {
    const key = `${chunkX},${chunkY}`;
    if (!worldChunks.has(key)) {
        worldChunks.set(key, new Chunk(chunkX, chunkY));
    }
    return worldChunks.get(key);
}

// Draw the visible world chunks
export function drawVisibleChunks(ctx, camera, player) {
    // Calculate the chunk coordinates for the player
    const centerChunkX = Math.floor(player.x / CHUNK_SIZE);
    const centerChunkY = Math.floor(player.y / CHUNK_SIZE);
    
    // Draw chunks within render distance
    for (let dx = -CHUNK_RENDER_DISTANCE; dx <= CHUNK_RENDER_DISTANCE; dx++) {
        for (let dy = -CHUNK_RENDER_DISTANCE; dy <= CHUNK_RENDER_DISTANCE; dy++) {
            const chunkX = centerChunkX + dx;
            const chunkY = centerChunkY + dy;
            
            // Get or generate the chunk and draw it
            const chunk = getChunk(chunkX, chunkY);
            chunk.draw(ctx, camera);
        }
    }
}

// Check for item collection
export function checkItemCollection(player) {
    // Get the current chunk the player is in
    const chunkX = Math.floor(player.x / CHUNK_SIZE);
    const chunkY = Math.floor(player.y / CHUNK_SIZE);
    const chunk = getChunk(chunkX, chunkY);
    
    // Mark the chunk as explored
    chunk.markExplored();
    
    // Check for item collection
    chunk.checkItemCollection(player.x, player.y, 20); // 20 is collection radius
}
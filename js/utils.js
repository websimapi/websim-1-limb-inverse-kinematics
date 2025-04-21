// Utility functions for math and random number generation

// Random generator with seed for consistent world generation
export class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    // Simple random function based on seed
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    // Get random number in range
    range(min, max) {
        return min + this.next() * (max - min);
    }
    
    // Get random integer in range
    intRange(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
}

// Calculate distance between two points
export function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Calculate the unit vector from p1 to p2
export function direction(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Avoid division by zero
    if (dist === 0) return { x: 0, y: 0 };
    
    return {
        x: dx / dist,
        y: dy / dist
    };
}

// Calculate the angle between three points (with p2 as the vertex)
export function angleBetween(p1, p2, p3) {
    const a = {x: p1.x - p2.x, y: p1.y - p2.y};
    const b = {x: p3.x - p2.x, y: p3.y - p2.y};
    
    const dotProduct = a.x * b.x + a.y * b.y;
    const magnitudeA = Math.sqrt(a.x * a.x + a.y * a.y);
    const magnitudeB = Math.sqrt(b.x * b.x + b.y * b.y);
    
    // Ensure we don't get NaN from division by zero
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    const cosTheta = dotProduct / (magnitudeA * magnitudeB);
    
    // Clamp to avoid floating point errors
    const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));
    
    return Math.acos(clampedCosTheta) * (180 / Math.PI); // Convert to degrees
}
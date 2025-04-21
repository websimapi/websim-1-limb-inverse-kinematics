import { distance, direction } from './utils.js';
import { CHUNK_SIZE, checkItemCollection, drawVisibleChunks } from './chunk.js';
import { fabrik, drawPlayer } from './ik.js';
import { updatePlayerMovement, initializeArm } from './player.js';
import { setupUI } from './ui.js';

// Setup canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
const gameState = {
    chunksExplored: 0,
    itemsCollected: 0,
    gameStarted: false,
    segmentCount: parseInt(document.getElementById('segmentCount').value),
    totalLength: parseInt(document.getElementById('totalLength').value),
    maxConstraintAngle: parseInt(document.getElementById('constraintAngle').value),
    moveSpeed: parseInt(document.getElementById('moveSpeed').value)
};

// World variables
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    targetX: null,
    targetY: null,
    isMoving: false
};

// Camera variables
let camera = {
    x: 0,
    y: 0
};

// Arm segments
let segments = [];
let targetPoint = { x: player.x, y: player.y };

// ARM CONTROL VARIABLES
const armState = {
    armTargetX: null,
    armTargetY: null,
    armMovementSpeed: 5, // How fast the arm can travel to its target
    armReachingTarget: false
};

// Initialize arm segments on startup
initializeArm(player, segments, gameState.segmentCount, gameState.totalLength);

// Setup UI controls
setupUI(canvas, player, camera, segments, gameState, armState);

// Animation loop
function animate() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState.gameStarted) {
        // Update player movement
        updatePlayerMovement(
            player, camera, canvas, gameState.moveSpeed, 
            targetPoint, armState.armTargetX, armState.armTargetY, armState.armMovementSpeed
        );
        
        // Check for item collection
        checkItemCollection(player);
        
        // Draw world
        drawVisibleChunks(ctx, camera, player);
        
        // Apply FABRIK to reach target point
        fabrik(segments, player, targetPoint, gameState.maxConstraintAngle);
        
        // Draw player (arm)
        drawPlayer(ctx, segments, player, camera, targetPoint);
    }
    
    // Schedule the next frame
    requestAnimationFrame(animate);
}

// Start the game loop
animate();
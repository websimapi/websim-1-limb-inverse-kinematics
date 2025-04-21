// Setup UI event listeners and controls
export function setupUI(canvas, player, camera, segments, gameState, armState) {
    // UI elements
    const segmentCountInput = document.getElementById('segmentCount');
    const segmentCountValue = document.getElementById('segmentCountValue');
    const totalLengthInput = document.getElementById('totalLength');
    const totalLengthValue = document.getElementById('totalLengthValue');
    const constraintAngleInput = document.getElementById('constraintAngle');
    const constraintAngleValue = document.getElementById('constraintAngleValue');
    const moveSpeedInput = document.getElementById('moveSpeed');
    const moveSpeedValue = document.getElementById('moveSpeedValue');
    const tutorial = document.getElementById('tutorial');
    const startButton = document.getElementById('startButton');

    // Event listeners for UI controls
    segmentCountInput.addEventListener('input', () => {
        gameState.segmentCount = parseInt(segmentCountInput.value);
        segmentCountValue.textContent = gameState.segmentCount;
        initializeArm();
    });

    totalLengthInput.addEventListener('input', () => {
        gameState.totalLength = parseInt(totalLengthInput.value);
        totalLengthValue.textContent = gameState.totalLength;
        initializeArm();
    });

    constraintAngleInput.addEventListener('input', () => {
        gameState.maxConstraintAngle = parseInt(constraintAngleInput.value);
        constraintAngleValue.textContent = gameState.maxConstraintAngle;
    });
    
    moveSpeedInput.addEventListener('input', () => {
        gameState.moveSpeed = parseInt(moveSpeedInput.value);
        moveSpeedValue.textContent = gameState.moveSpeed;
    });
    
    // Hide tutorial and start game
    startButton.addEventListener('click', () => {
        tutorial.classList.add('hidden');
        gameState.gameStarted = true;
        initializeArm();
    });

    // Track mouse movement to extend arm in real-time
    canvas.addEventListener('mousemove', (e) => {
        if (!gameState.gameStarted) return;
        
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        const worldX = screenX + camera.x;
        const worldY = screenY + camera.y;
        
        // Set the arm's target to follow the mouse position
        armState.armTargetX = worldX;
        armState.armTargetY = worldY;
        armState.armReachingTarget = true;
    });

    // Handle click for movement (only controls player movement now)
    canvas.addEventListener('click', (e) => {
        if (!gameState.gameStarted) return;
        
        // Get click position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        player.targetX = screenX + camera.x;
        player.targetY = screenY + camera.y;
        
        player.isMoving = true;
    });

    // Helper function to initialize the arm with current settings
    function initializeArm() {
        segments.length = 0; // Clear existing segments
        const segmentLength = gameState.totalLength / gameState.segmentCount;
        
        // Start with a straight arm pointing right
        for (let i = 0; i <= gameState.segmentCount; i++) {
            segments.push({
                x: player.x,
                y: player.y - i * segmentLength
            });
        }
    }
}
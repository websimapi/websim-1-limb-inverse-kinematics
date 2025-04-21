import { direction, distance } from './utils';

// Update player movement
export function updatePlayerMovement(player, camera, canvas, moveSpeed, targetPoint, armTargetX, armTargetY, armMovementSpeed) {
    if (player.isMoving && player.targetX !== null && player.targetY !== null) {
        const dir = direction(
            { x: player.x, y: player.y }, 
            { x: player.targetX, y: player.targetY }
        );
        
        const dist = distance(
            { x: player.x, y: player.y }, 
            { x: player.targetX, y: player.targetY }
        );
        
        // If we're close enough to the target, stop moving
        if (dist < 5) {
            player.isMoving = false;
            player.targetX = null;
            player.targetY = null;
        } else {
            // Move player towards target
            player.x += dir.x * moveSpeed;
            player.y += dir.y * moveSpeed;
            
            // Update camera to follow player
            camera.x = player.x - canvas.width / 2;
            camera.y = player.y - canvas.height / 2;
        }
    }
    
    // Update arm target position gradually
    updateArmTarget(player, targetPoint, armTargetX, armTargetY, armMovementSpeed);
}

// Update the arm's target position with realistic movement speed
export function updateArmTarget(player, targetPoint, armTargetX, armTargetY, armMovementSpeed) {
    if (armTargetX === null || armTargetY === null) {
        // If there's no arm target, the target is the player
        targetPoint.x = player.x;
        targetPoint.y = player.y;
        return;
    }
    
    // Calculate distance from current arm target to desired target
    const currentDist = distance(targetPoint, { x: armTargetX, y: armTargetY });
    
    // If we're already close to the target, just set it exactly
    if (currentDist < armMovementSpeed) {
        targetPoint.x = armTargetX;
        targetPoint.y = armTargetY;
        return;
    }
    
    // Otherwise, move the arm target towards the desired target at a limited speed
    const dir = direction(targetPoint, { x: armTargetX, y: armTargetY });
    targetPoint.x += dir.x * armMovementSpeed;
    targetPoint.y += dir.y * armMovementSpeed;
}

// Initialize arm segments
export function initializeArm(player, segments, segmentCount, totalLength) {
    segments.length = 0; // Clear existing segments
    const segmentLength = totalLength / segmentCount;
    
    // Start with a straight arm pointing right
    for (let i = 0; i <= segmentCount; i++) {
        segments.push({
            x: player.x,
            y: player.y - i * segmentLength
        });
    }
    
    return segments;
}
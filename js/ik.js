import { distance, direction, angleBetween } from 'utils';

// Apply constraints to a joint
export function applyConstraint(p1, p2, p3, maxAngle) {
    const currentAngle = angleBetween(p1, p2, p3);
    
    if (currentAngle > maxAngle) {
        // Calculate the direction vectors
        const dir1 = direction(p2, p1);
        const dir3 = direction(p2, p3);
        
        // Calculate the rotation axis (perpendicular to the plane)
        const cross = {z: dir1.x * dir3.y - dir1.y * dir3.x};
        
        // Determine rotation direction based on the cross product
        const rotationDirection = cross.z < 0 ? 1 : -1;
        
        // Calculate the angle to rotate
        const angleToRotate = (currentAngle - maxAngle) * rotationDirection * (Math.PI / 180);
        
        // Rotate p3 around p2
        const dx = p3.x - p2.x;
        const dy = p3.y - p2.y;
        const cos = Math.cos(angleToRotate);
        const sin = Math.sin(angleToRotate);
        
        p3.x = p2.x + dx * cos - dy * sin;
        p3.y = p2.y + dx * sin + dy * cos;
        
        return true; // Constraint was applied
    }
    
    return false; // No constraint needed
}

// FABRIK algorithm implementation
export function fabrik(segments, player, target, maxConstraintAngle) {
    if (segments.length < 2) return false;
    
    // Get segment lengths
    const lengths = [];
    for (let i = 0; i < segments.length - 1; i++) {
        lengths.push(distance(segments[i], segments[i+1]));
    }
    
    // Get the total arm length
    const armLength = lengths.reduce((sum, length) => sum + length, 0);
    
    // Check if target is reachable
    const distToTarget = distance(segments[0], target);
    
    // If target is too far, extend arm in target direction
    if (distToTarget > armLength) {
        const dir = direction(segments[0], target);
        
        // Place all segments along the direction to target
        let currentDist = 0;
        for (let i = 0; i < segments.length - 1; i++) {
            currentDist += lengths[i];
            segments[i+1].x = segments[0].x + dir.x * currentDist;
            segments[i+1].y = segments[0].y + dir.y * currentDist;
        }
        
        return true; // We did our best with an unreachable target
    }
    
    // Start FABRIK iterations
    for (let iteration = 0; iteration < 10; iteration++) {
        // --- Forward Reaching ---
        // Set end effector to target
        segments[segments.length - 1].x = target.x;
        segments[segments.length - 1].y = target.y;
        
        // Work backwards from target to base
        for (let i = segments.length - 2; i >= 0; i--) {
            const dir = direction(segments[i+1], segments[i]);
            segments[i].x = segments[i+1].x + dir.x * lengths[i];
            segments[i].y = segments[i+1].y + dir.y * lengths[i];
        }
        
        // --- Backward Reaching ---
        // Restore the base position (player position)
        segments[0].x = player.x;
        segments[0].y = player.y;
        
        // Work forwards from base to end effector
        for (let i = 0; i < segments.length - 1; i++) {
            const dir = direction(segments[i], segments[i+1]);
            segments[i+1].x = segments[i].x + dir.x * lengths[i];
            segments[i+1].y = segments[i].y + dir.y * lengths[i];
        }
        
        // Apply joint angle constraints
        let constraintApplied = false;
        if (maxConstraintAngle < 180) {
            for (let i = 1; i < segments.length - 1; i++) {
                constraintApplied = applyConstraint(
                    segments[i-1], 
                    segments[i], 
                    segments[i+1], 
                    maxConstraintAngle
                ) || constraintApplied;
            }
            
            // If constraints were applied, we need to rebuild the arm
            if (constraintApplied) {
                // Forward pass after constraint application
                for (let i = 1; i < segments.length - 1; i++) {
                    const dir = direction(segments[i], segments[i+1]);
                    segments[i+1].x = segments[i].x + dir.x * lengths[i];
                    segments[i+1].y = segments[i].y + dir.y * lengths[i];
                }
            }
        }
        
        // Check if end effector is close enough to target
        const errorDistance = distance(segments[segments.length - 1], target);
        if (errorDistance < 0.5) {
            break;
        }
    }
    
    return true;
}

// Draw the player (arm)
export function drawPlayer(ctx, segments, player, camera, targetPoint) {
    // Draw the arm segments
    for (let i = 0; i < segments.length - 1; i++) {
        const screenStart = {
            x: segments[i].x - camera.x,
            y: segments[i].y - camera.y
        };
        
        const screenEnd = {
            x: segments[i+1].x - camera.x,
            y: segments[i+1].y - camera.y
        };
        
        // Create gradient for segment
        const segmentGradient = ctx.createLinearGradient(
            screenStart.x, screenStart.y, screenEnd.x, screenEnd.y
        );
        
        // Gradient colors based on position in the arm
        const startColor = `hsl(${210 - (i * 12)}, 70%, 50%)`;
        const endColor = `hsl(${210 - ((i+1) * 12)}, 70%, 45%)`;
        
        segmentGradient.addColorStop(0, startColor);
        segmentGradient.addColorStop(1, endColor);
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(screenStart.x, screenStart.y);
        ctx.lineTo(screenEnd.x, screenEnd.y);
        ctx.lineWidth = 12 - (i * 0.8); // Thinner towards the end
        ctx.lineCap = 'round';
        ctx.strokeStyle = segmentGradient;
        ctx.stroke();
        
        // Draw joint at the start of the segment
        ctx.beginPath();
        ctx.arc(screenStart.x, screenStart.y, 8 - (i * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = startColor;
        ctx.fill();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Draw end effector (last joint)
    const lastJoint = segments[segments.length - 1];
    const screenLastJoint = {
        x: lastJoint.x - camera.x,
        y: lastJoint.y - camera.y
    };
    
    ctx.beginPath();
    ctx.arc(screenLastJoint.x, screenLastJoint.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${210 - ((segments.length-1) * 12)}, 70%, 40%)`;
    ctx.fill();
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw target indicator if moving
    if (player.isMoving && player.targetX !== null && player.targetY !== null) {
        const screenTarget = {
            x: player.targetX - camera.x,
            y: player.targetY - camera.y
        };
        
        // Pulsing effect for target
        const pulseSize = 10 + Math.sin(Date.now() * 0.01) * 5;
        
        ctx.beginPath();
        ctx.arc(screenTarget.x, screenTarget.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.fill();
        
        // Target crosshair
        ctx.beginPath();
        ctx.moveTo(screenTarget.x - 10, screenTarget.y);
        ctx.lineTo(screenTarget.x + 10, screenTarget.y);
        ctx.moveTo(screenTarget.x, screenTarget.y - 10);
        ctx.lineTo(screenTarget.x, screenTarget.y + 10);
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Also draw the current arm target point for debugging
        const screenArmTarget = {
            x: targetPoint.x - camera.x,
            y: targetPoint.y - camera.y
        };
        
        ctx.beginPath();
        ctx.arc(screenArmTarget.x, screenArmTarget.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 255, 100, 0.6)';
        ctx.fill();
    }
}
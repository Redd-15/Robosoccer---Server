import { Room } from "../../model/room";
import { GameConfig } from "./constants";

export class PhysicsEngine {
    
    public updateRoom(room: Room) {
        // 1. Update positions based on velocities
        room.players.forEach(p => {
            p.x += p.x_velocity;
            p.y += p.y_velocity;
            p.x_velocity *= GameConfig.FRICTION; // Apply friction
            p.y_velocity *= GameConfig.FRICTION;
            this.handleWallCollision(p, GameConfig.PLAYER_RADIUS);
        });

        room.ball.x += room.ball.x_velocity;
        room.ball.y += room.ball.y_velocity;
        room.ball.x_velocity *= GameConfig.FRICTION;
        room.ball.y_velocity *= GameConfig.FRICTION;
        this.handleWallCollision(room.ball, GameConfig.BALL_RADIUS);

        // 2. Check collisions between Players and the Ball
        room.players.forEach(p => {
            this.handleCircleCollision(p, room.ball, GameConfig.PLAYER_RADIUS, GameConfig.BALL_RADIUS);
        });

        // 3. (Optional) Check collisions between Players
        for (let i = 0; i < room.players.length; i++) {
            for (let j = i + 1; j < room.players.length; j++) {
                this.handleCircleCollision(room.players[i], room.players[j], GameConfig.PLAYER_RADIUS, GameConfig.PLAYER_RADIUS);
            }
        }
    }

    private handleWallCollision(entity: any, radius: number) {
        if (entity.x - radius < 0) {
            entity.x = radius;
            entity.x_velocity *= -GameConfig.BOUNCE_RESTITUTION;
        } else if (entity.x + radius > GameConfig.FIELD_WIDTH) {
            entity.x = GameConfig.FIELD_WIDTH - radius;
            entity.x_velocity *= -GameConfig.BOUNCE_RESTITUTION;
        }

        if (entity.y - radius < 0) {
            entity.y = radius;
            entity.y_velocity *= -GameConfig.BOUNCE_RESTITUTION;
        } else if (entity.y + radius > GameConfig.FIELD_HEIGHT) {
            entity.y = GameConfig.FIELD_HEIGHT - radius;
            entity.y_velocity *= -GameConfig.BOUNCE_RESTITUTION;
        }
    }

    private handleCircleCollision(c1: any, c2: any, r1: number, r2: number) {
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = r1 + r2;

        if (distance < minDist && distance > 0) {
            // Resolve overlap (push them apart so they don't get stuck)
            const overlap = minDist - distance;
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Move each away by half the overlap
            c1.x -= nx * (overlap / 2);
            c1.y -= ny * (overlap / 2);
            c2.x += nx * (overlap / 2);
            c2.y += ny * (overlap / 2);

            // Calculate simple elastic bounce (treating masses as equal for simplicity)
            const vCollisionX = c2.x_velocity - c1.x_velocity;
            const vCollisionY = c2.y_velocity - c1.y_velocity;
            const speed = vCollisionX * nx + vCollisionY * ny;

            // Only bounce if they are moving towards each other
            if (speed < 0) {
                const bounce = speed * GameConfig.BOUNCE_RESTITUTION;
                c1.x_velocity += nx * bounce;
                c1.y_velocity += ny * bounce;
                c2.x_velocity -= nx * bounce;
                c2.y_velocity -= ny * bounce;
            }
        }
    }
}
// Entities: Player, Enemies, Projectiles, Particles, Pickups and the 3-Eyed Boss

export class Particle {
  constructor(x, y, vx, vy, color, size, life, shape = 'circle', gravity = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.shape = shape;
    this.gravity = gravity;
    this.alpha = 1;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (this.life / this.maxLife), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'spark') {
      ctx.fillRect(this.x, this.y, this.size * 2, this.size);
    } else if (this.shape === 'smoke') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1 + (1 - this.alpha)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class FloatingText {
  constructor(x, y, text, color = '#fbbf24', size = 12) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 1.0;
    this.maxLife = 1.0;
  }

  update(dt) {
    this.y -= 25 * dt;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.font = `bold ${this.size}px 'Press Start 2P', monospace`;
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// -------------------------------------------------------------
// PROJECTILES
// -------------------------------------------------------------
export class Projectile {
  constructor(x, y, vx, vy, radius, damage, color, isPlayer = false, type = 'bullet') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.damage = damage;
    this.color = color;
    this.isPlayer = isPlayer;
    this.type = type;
    this.alive = true;
    this.lifeTime = 4.0;
    this.trailTimer = 0;
  }

  update(dt, particles, groundY, cameraX = null) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifeTime -= dt;

    if (this.type === 'acid') {
      this.vy += 320 * dt; // Gravity for acid pools
      if (this.y >= groundY - 6) {
        this.y = groundY - 6;
        this.vx *= 0.2;
      }
    }

    // Particle trail
    this.trailTimer += dt;
    if (this.trailTimer > 0.04) {
      this.trailTimer = 0;
      if (this.isPlayer) {
        particles.push(new Particle(
          this.x, this.y,
          (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15,
          '#34d399', 3, 0.25, 'circle'
        ));
      } else if (this.type === 'purple') {
        particles.push(new Particle(
          this.x, this.y,
          (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20,
          '#c084fc', 3.5, 0.3, 'circle'
        ));
      } else if (this.type === 'thorn') {
        particles.push(new Particle(
          this.x, this.y,
          -this.vx * 0.1, -this.vy * 0.1,
          '#86efac', 2, 0.2, 'spark'
        ));
      } else if (this.type === 'light_orb') {
        particles.push(new Particle(
          this.x, this.y,
          (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16,
          Math.random() < 0.6 ? '#fde047' : '#f472b6', 3.5, 0.3, 'spark'
        ));
      }
    }

    // Despawn when lifetime ends, out of vertical bounds, or far off-screen from active camera
    if (this.lifeTime <= 0 || this.y < -120 || this.y > groundY + 120) {
      this.alive = false;
    }
    if (cameraX !== null && (this.x < cameraX - 250 || this.x > cameraX + 1300)) {
      this.alive = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    if (this.type === 'bullet') {
      // Pistol tracer bullet
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.radius * 1.8, this.radius, Math.atan2(this.vy, this.vx), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'thorn') {
      // Sharp spine
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.atan2(this.vy, this.vx));
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-this.radius * 2, -2, this.radius * 4, 4);
      ctx.restore();
    } else if (this.type === 'purple') {
      // Demon purple orb
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'acid') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'boss_orb') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'light_orb') {
      // Bola luminosa de la Bruja: resplandor dorado brillante con núcleo blanco puro
      ctx.save();
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

// -------------------------------------------------------------
// PICKUPS
// -------------------------------------------------------------
export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'health', 'rapid', 'fury'
    this.vy = -120;
    this.radius = 14;
    this.alive = true;
    this.timer = 0;
  }

  update(dt, groundY) {
    this.timer += dt * 4;
    this.y += this.vy * dt;
    this.vy += 300 * dt;
    if (this.y > groundY - this.radius) {
      this.y = groundY - this.radius;
      this.vy = 0;
    }
  }

  draw(ctx) {
    ctx.save();
    const bob = Math.sin(this.timer) * 4;
    ctx.translate(this.x, this.y + bob);

    if (this.type === 'health') {
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 12;
      ctx.font = '16px monospace';
      ctx.fillText('💚', -8, 6);
    } else if (this.type === 'rapid') {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.font = '16px monospace';
      ctx.fillText('⚡', -8, 6);
    } else if (this.type === 'fury') {
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.font = '16px monospace';
      ctx.fillText('🔥', -8, 6);
    }
    ctx.restore();
  }
}

// -------------------------------------------------------------
// PLAYER: THE UNDEAD COWBOY
// -------------------------------------------------------------
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 44;
    this.height = 70;
    this.vx = 0;
    this.vy = 0;
    this.speed = 240; // Velocidad del personaje reducida según solicitud para un control más táctico
    this.jumpForce = -470;
    this.isGrounded = false;
    this.jumpCount = 0;
    this.maxJumps = 2; // Jump + Double Jump!
    this.facing = 1; // 1 = right, -1 = left
    this.isCrouching = false;
    
    // Health & Stats
    this.maxHp = 100;
    this.hp = 100;
    this.invulnTime = 0;
    this.fury = 0; // 0 to 100
    
    // Weapon stats
    this.shootCooldown = 0;
    this.rapidFireTimer = 0;
    this.gunToggle = false; // Alternating dual revolvers
    this.aimAngle = 0;
    this.localAimAngle = 0;
    this.hasAimTarget = false;
    this.aimTargetX = 0;
    this.aimTargetY = 0;
    this.customAim = false;

    // Animation state
    this.animTime = 0;
    this.coatWave = 0;
  }

  updateAim(targetX, targetY) {
    if (targetX === null || targetY === null || isNaN(targetX) || isNaN(targetY)) {
      this.hasAimTarget = false;
      this.localAimAngle = 0;
      return;
    }

    this.hasAimTarget = true;
    this.aimTargetX = targetX;
    this.aimTargetY = targetY;

    const shoulderX = this.x + this.facing * 6;
    const shoulderY = this.y - (this.isCrouching ? 6 : 14);

    const dx = targetX - shoulderX;
    const dy = targetY - shoulderY;

    // Orient facing direction based on mouse position
    if (dx > 12) {
      this.facing = 1;
    } else if (dx < -12) {
      this.facing = -1;
    }

    this.aimAngle = Math.atan2(dy, dx);

    // Calculate local arm rotation angle relative to flipped orientation
    if (this.facing === 1) {
      this.localAimAngle = Math.atan2(dy, dx);
    } else {
      this.localAimAngle = Math.atan2(dy, -dx);
    }

    // Natural arm angle clamp (-78 deg to +78 deg)
    const maxClamp = Math.PI * 0.44;
    this.localAimAngle = Math.max(-maxClamp, Math.min(maxClamp, this.localAimAngle));
  }

  update(dt, keys, groundY, soundMgr, particles, projectiles, cameraX = 0) {
    this.animTime += dt;
    this.coatWave = Math.sin(this.animTime * 12);

    if (this.invulnTime > 0) this.invulnTime -= dt;
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    // CONTROLES:
    // Flecha Izquierda / Derecha: Avanzar y retroceder
    let moveDir = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) moveDir -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) moveDir += 1;

    // Flecha Abajo: Bajar / Agacharse
    const downPressed = keys['ArrowDown'] || keys['KeyS'];
    this.isCrouching = downPressed && this.isGrounded;

    // Movement
    if (this.isCrouching) {
      this.vx = moveDir * (this.speed * 0.4); // Slower crawl when ducking
    } else {
      this.vx = moveDir * this.speed;
      if (moveDir !== 0) {
        this.facing = moveDir;
        // Running dust particles
        if (this.isGrounded && Math.random() < 0.3) {
          particles.push(new Particle(
            this.x + (this.facing === 1 ? -15 : 15),
            this.y + this.height * 0.5 - 2,
            -this.facing * (20 + Math.random() * 30),
            -10 - Math.random() * 20,
            'rgba(217, 119, 6, 0.4)', 4, 0.3, 'smoke', 40
          ));
        }
      }
    }

    // Fast fall if pressing down in midair
    if (downPressed && !this.isGrounded) {
      this.vy += 900 * dt; // Fast descent
    }

    // Gravity
    this.vy += 1050 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Ground check
    const currentGround = groundY - (this.isCrouching ? 20 : 35);
    if (this.y >= currentGround) {
      this.y = currentGround;
      this.vy = 0;
      this.isGrounded = true;
      this.jumpCount = 0;
    } else {
      this.isGrounded = false;
    }

    // Boundaries: allow advancing forward infinitely through the desert!
    // Prevent going backwards past the left edge of the camera screen
    const minX = cameraX ? cameraX + 35 : 30;
    if (this.x < minX) this.x = minX;

    // Spectral green flame particles rising from the skull
    if (Math.random() < 0.6) {
      particles.push(new Particle(
        this.x + (Math.random() - 0.5) * 16,
        this.y - (this.isCrouching ? 14 : 32) + (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 12,
        -40 - Math.random() * 30,
        '#34d399', 3.5, 0.4, 'circle'
      ));
    }
  }

  jump(soundMgr, particles) {
    if (this.jumpCount < this.maxJumps) {
      this.vy = this.jumpCount === 0 ? this.jumpForce : this.jumpForce * 0.88;
      this.jumpCount++;
      this.isGrounded = false;
      soundMgr.playJump();

      // Jump dust ring
      for (let i = 0; i < 8; i++) {
        particles.push(new Particle(
          this.x, this.y + 30,
          (Math.random() - 0.5) * 100, -20 - Math.random() * 30,
          'rgba(52, 211, 153, 0.6)', 3, 0.3, 'spark', 50
        ));
      }
      return true;
    }
    return false;
  }

  shoot(soundMgr, projectiles, particles, targetX = null, targetY = null) {
    if (this.shootCooldown > 0) return;

    const isRapid = this.rapidFireTimer > 0;
    this.shootCooldown = isRapid ? 0.08 : 0.16;
    this.gunToggle = !this.gunToggle;

    soundMgr.playGunshot();

    const shoulderY = this.y - (this.isCrouching ? 6 : 14);
    const shoulderX = this.x + this.facing * 6;

    let vx = this.facing * 880;
    let vy = 0;

    const tx = targetX !== null ? targetX : (this.hasAimTarget ? this.aimTargetX : null);
    const ty = targetY !== null ? targetY : (this.hasAimTarget ? this.aimTargetY : null);

    let gunX = this.x + this.facing * 24;
    let gunY = shoulderY;

    if (tx !== null && ty !== null) {
      const dx = tx - shoulderX;
      const dy = ty - shoulderY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        if (dx > 12) this.facing = 1;
        else if (dx < -12) this.facing = -1;

        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * 880;
        vy = Math.sin(angle) * 880;

        // Position muzzle at the tip of the aiming arm (approx 24px along angle)
        gunX = shoulderX + Math.cos(angle) * 24;
        gunY = shoulderY + Math.sin(angle) * 24;
      }
    }

    // Primary bullet (increased speed and range so it travels cleanly across the screen)
    projectiles.push(new Projectile(gunX, gunY, vx, vy, 5, 48, '#34d399', true, 'bullet'));

    // If rapid fire powerup: triple spread
    if (isRapid) {
      const spread1 = Math.atan2(vy, vx) + 0.15;
      const spread2 = Math.atan2(vy, vx) - 0.15;
      projectiles.push(new Projectile(gunX, gunY, Math.cos(spread1) * 880, Math.sin(spread1) * 880, 4, 36, '#a7f3d0', true, 'bullet'));
      projectiles.push(new Projectile(gunX, gunY, Math.cos(spread2) * 880, Math.sin(spread2) * 880, 4, 36, '#a7f3d0', true, 'bullet'));
    }

    // Green muzzle flash
    for (let i = 0; i < 6; i++) {
      particles.push(new Particle(
        gunX, gunY,
        vx * 0.15 + (Math.random() - 0.5) * 80,
        vy * 0.15 + (Math.random() - 0.5) * 80,
        '#6ee7b7', 3.5, 0.15, 'spark'
      ));
    }
  }

  triggerFury(soundMgr, projectiles, particles, floatingTexts) {
    if (this.fury < 100) return false;
    this.fury = 0;
    soundMgr.playSpecialBarrage();

    floatingTexts.push(new FloatingText(this.x - 60, this.y - 60, '¡FURIA ESPECTRAL!', '#ec4899', 14));

    // Radial 360-degree storm of 24 ghost fire bullets
    const bulletsCount = 24;
    for (let i = 0; i < bulletsCount; i++) {
      const angle = (Math.PI * 2 / bulletsCount) * i;
      const speed = 550;
      const bx = Math.cos(angle) * speed;
      const by = Math.sin(angle) * speed;
      projectiles.push(new Projectile(this.x, this.y - 10, bx, by, 7, 95, '#ec4899', true, 'boss_orb'));
    }

    // Explosion ring
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 100 + Math.random() * 250;
      particles.push(new Particle(
        this.x, this.y - 10,
        Math.cos(a) * s, Math.sin(a) * s,
        '#f43f5e', 5, 0.6, 'circle'
      ));
    }
    return true;
  }

  takeDamage(amount, soundMgr, particles) {
    if (this.invulnTime > 0) return false;
    this.hp -= amount;
    this.invulnTime = 1.3; // Much more generous invulnerability time (1.3s)
    soundMgr.playHurt();

    // Damage sparks
    for (let i = 0; i < 12; i++) {
      particles.push(new Particle(
        this.x, this.y,
        (Math.random() - 0.5) * 160,
        -60 - Math.random() * 100,
        '#ef4444', 4, 0.4, 'spark', 150
      ));
    }

    if (this.hp < 0) this.hp = 0;
    return true;
  }

  getHitbox() {
    const h = this.isCrouching ? 38 : 64;
    return {
      x: this.x - 18,
      y: this.y - (h * 0.5),
      width: 36,
      height: h
    };
  }
}

// -------------------------------------------------------------
// ENEMIES
// -------------------------------------------------------------
export class CactusEnemy {
  constructor(x, groundY, aggression = 1.0) {
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - 26;
    this.width = 40;
    this.height = 54;
    this.hp = Math.round(45 * (1 + (aggression - 1) * 0.2));
    this.maxHp = this.hp;
    this.alive = true;
    this.aggression = aggression;
    this.shootTimer = (1.6 + Math.random() * 1.6) / aggression;
    this.animTime = Math.random() * 10;
    this.hitFlash = 0;
    this.points = 150;
    this.type = 'cactus';
  }

  update(dt, player, projectiles, soundMgr) {
    this.animTime += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = (2.6 + Math.random() * 1.2) / this.aggression;
      // Shoot 3 needles in arc towards player
      const dir = player.x < this.x ? -1 : 1;
      const baseAngle = dir === -1 ? Math.PI : 0;
      const angles = [baseAngle - 0.22, baseAngle, baseAngle + 0.22];
      const speed = 210 * (1 + (this.aggression - 1) * 0.25);

      angles.forEach(a => {
        projectiles.push(new Projectile(
          this.x, this.y - 6,
          Math.cos(a) * speed, Math.sin(a) * speed,
          4, 10, '#4ade80', false, 'thorn'
        ));
      });
      soundMgr.playGunshot();
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.alive = false;
  }

  getHitbox() {
    return { x: this.x - 20, y: this.y - 28, width: 40, height: 56 };
  }
}

export class ScorpionEnemy {
  constructor(x, groundY, aggression = 1.0) {
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - 18;
    this.width = 54;
    this.height = 36;
    this.hp = Math.round(55 * (1 + (aggression - 1) * 0.2));
    this.maxHp = this.hp;
    this.alive = true;
    this.aggression = aggression;
    this.speed = 75 * (1 + (aggression - 1) * 0.4); // Más rápido con agresividad
    this.shootTimer = (2.0 + Math.random() * 1.4) / aggression;
    this.hitFlash = 0;
    this.points = 200;
    this.type = 'scorpion';
    this.dir = -1;
  }

  update(dt, player, projectiles, soundMgr) {
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Walk towards player
    this.dir = player.x < this.x ? -1 : 1;
    this.x += this.dir * this.speed * dt;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = (2.8 + Math.random() * 1.2) / this.aggression;
      // Stinger poison acid globe
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vx = (dx / Math.max(1, dist)) * (210 * (1 + (this.aggression - 1) * 0.2));
      const vy = -150; // Parabolic toss

      projectiles.push(new Projectile(
        this.x + this.dir * 18, this.y - 18,
        vx, vy,
        6, 12, '#f97316', false, 'acid'
      ));
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.alive = false;
  }

  getHitbox() {
    return { x: this.x - 26, y: this.y - 20, width: 52, height: 38 };
  }
}

export class GhostWolfEnemy {
  constructor(x, groundY, aggression = 1.0) {
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - 22;
    this.width = 52;
    this.height = 40;
    this.hp = Math.round(45 * (1 + (aggression - 1) * 0.2));
    this.maxHp = this.hp;
    this.alive = true;
    this.aggression = aggression;
    this.speed = 170 * (1 + (aggression - 1) * 0.45); // Embestida más veloz con agresividad
    this.hitFlash = 0;
    this.points = 220;
    this.type = 'wolf';
    this.dir = -1;
    this.trailTimer = 0;
  }

  update(dt, player, projectiles, soundMgr, particles) {
    if (this.hitFlash > 0) this.hitFlash -= dt;

    this.dir = player.x < this.x ? -1 : 1;
    this.x += this.dir * this.speed * dt;

    this.trailTimer += dt;
    if (this.trailTimer > 0.08) {
      this.trailTimer = 0;
      particles.push(new Particle(
        this.x, this.y,
        -this.dir * 30, -5,
        'rgba(56, 189, 248, 0.4)', 4, 0.25, 'smoke'
      ));
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.alive = false;
  }

  getHitbox() {
    return { x: this.x - 26, y: this.y - 20, width: 52, height: 40 };
  }
}

// FLYING MONSTERS (Bat / Gargoyle / Winged Demon Eyeball)
export class FlyingEnemy {
  constructor(x, y, aggression = 1.0) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.width = 46;
    this.height = 42;
    this.hp = Math.round(38 * (1 + (aggression - 1) * 0.2));
    this.maxHp = this.hp;
    this.alive = true;
    this.aggression = aggression;
    this.speed = 95 * (1 + (aggression - 1) * 0.35);
    this.shootTimer = (1.8 + Math.random() * 1.4) / aggression;
    this.hitFlash = 0;
    this.points = 250;
    this.type = 'flying';
    this.sinTimer = Math.random() * 10;
  }

  update(dt, player, projectiles, soundMgr) {
    this.sinTimer += dt * 3.0;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Sine wave flight across the sky
    const dir = player.x < this.x ? -1 : 1;
    this.x += dir * this.speed * dt;
    this.y = this.startY + Math.sin(this.sinTimer) * 30;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = (2.8 + Math.random() * 1.2) / this.aggression;
      // Shoot purple homing orbs towards player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 180 * (1 + (this.aggression - 1) * 0.2);

      projectiles.push(new Projectile(
        this.x, this.y + 10,
        (dx / Math.max(1, dist)) * speed, (dy / Math.max(1, dist)) * speed,
        7, 12, '#c084fc', false, 'purple'
      ));
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.alive = false;
  }

  getHitbox() {
    return { x: this.x - 22, y: this.y - 20, width: 44, height: 40 };
  }
}

// -------------------------------------------------------------
// ZOMBIE ENEMY (RETRO PIXEL ART ZOMBIE INSPIRADO EN LA IMAGEN)
// -------------------------------------------------------------
export class ZombieEnemy {
  constructor(x, groundY, aggression = 1.0) {
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - 30;
    this.width = 46;
    this.height = 60;
    this.hp = Math.round(65 * (1 + (aggression - 1) * 0.25));
    this.maxHp = this.hp;
    this.alive = true;
    this.aggression = aggression;
    this.speed = 80 * (1 + (aggression - 1) * 0.5); // Arrastre más voraz con agresividad
    this.hitFlash = 0;
    this.points = 180;
    this.type = 'zombie';
    this.dir = -1;
    this.animTime = Math.random() * 10;
  }

  update(dt, player, projectiles, soundMgr, particles) {
    this.animTime += dt * 3.5;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Caminar arrastrándose hacia el pistolero
    this.dir = player.x < this.x ? -1 : 1;
    this.x += this.dir * this.speed * dt;

    // Partículas de polvo podrido / arena pútrida al caminar
    if (particles && Math.random() < 0.15) {
      particles.push(new Particle(
        this.x + (Math.random() - 0.5) * 16,
        this.groundY - 4,
        (Math.random() - 0.5) * 20,
        -10 - Math.random() * 15,
        '#4d7c0f', 3, 0.35, 'smoke'
      ));
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.alive = false;
  }

  getHitbox() {
    return { x: this.x - 20, y: this.y - 30, width: 40, height: 60 };
  }
}

// -------------------------------------------------------------
// THE DESERT SCOURGE - 3 EYE BOSS (EL MONSTRUO DE 3 OJOS)
// -------------------------------------------------------------
export class Boss3Eyes {
  constructor(x, groundY) {
    this.x = x;
    this.y = 150; // Towering high in the desert dunes
    this.groundY = groundY;
    this.width = 240;
    this.height = 200;
    this.maxHp = 8000; // Monstruo del Nivel 2 reforzado con 8,000 HP según solicitud
    this.hp = 8000;
    this.alive = true;
    this.active = false;
    this.points = 10000;
    this.type = 'boss';
    this.hitFlash = 0;

    // Boss state machine
    this.state = 'intro'; // 'intro', 'idle', 'eye_lasers', 'energy_orbs', 'arm_slam', 'summon_minions', 'berserk'
    this.stateTimer = 0;
    this.introRise = -200; // Drops/rises into arena
    this.breathTimer = 0;
    this.energyOrbTimer = 0;

    // Laser attack tracking
    this.laserCharging = false;
    this.laserFiring = false;
    this.laserDuration = 0;
    this.targetBeamX = x;

    // Multi-arms articulation angles
    this.armAngles = [0, 0, 0, 0, 0, 0];
  }

  update(dt, player, projectiles, soundMgr, particles, spawnMinionCb) {
    this.breathTimer += dt * 2;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    if (this.state === 'intro') {
      this.introRise += 120 * dt;
      if (this.introRise >= 0) {
        this.introRise = 0;
        this.state = 'idle';
        this.stateTimer = 1.5;
        this.active = true;
        soundMgr.playExplosion(true);
      }
      return;
    }

    // Arm idle sway or gesture based on attack
    if (this.state === 'energy_orbs') {
      // Arms raised high gathering dark energy
      for (let i = 0; i < 6; i++) {
        this.armAngles[i] = -0.7 + Math.sin(this.breathTimer * 4 + i) * 0.25;
      }
    } else {
      for (let i = 0; i < 6; i++) {
        this.armAngles[i] = Math.sin(this.breathTimer + i * 1.2) * 0.35;
      }
    }

    this.stateTimer -= dt;

    // Boss behavior loop
    if (this.state === 'idle') {
      if (this.stateTimer <= 0) {
        const hpPercent = this.hp / this.maxHp;
        const rand = Math.random();

        if (hpPercent < 0.35 && rand < 0.40) {
          // Berserk Rapid Laser Barrage + Orbs
          this.state = 'berserk';
          this.stateTimer = 3.6;
          this.laserCharging = true;
          soundMgr.playLaserBeam();
        } else if (rand < 0.35) {
          // Rayos Láser de los 3 Ojos
          this.state = 'eye_lasers';
          this.stateTimer = 3.5;
          this.laserCharging = true;
          this.targetBeamX = player.x;
          soundMgr.playLaserBeam();
        } else if (rand < 0.70) {
          // Ráfaga Concentrada de Bolas de Energía
          this.state = 'energy_orbs';
          this.stateTimer = 3.2;
          this.energyOrbTimer = 0;
        } else if (rand < 0.88) {
          this.state = 'arm_slam';
          this.stateTimer = 2.4;
        } else {
          this.state = 'summon_minions';
          this.stateTimer = 2.0;
          if (spawnMinionCb) spawnMinionCb();
        }
      }
    } else if (this.state === 'energy_orbs') {
      // RÁFAGA DE BOLAS DE ENERGÍA: Dispara esferas luminosas dirigidas al jugador
      this.energyOrbTimer += dt;
      if (this.stateTimer > 0.4 && this.energyOrbTimer >= 0.28) {
        this.energyOrbTimer = 0;
        if (soundMgr && soundMgr.playLaserBeam) soundMgr.playLaserBeam();

        // 3 Bolas de energía en cono dirigidas hacia el jugador
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
        [-0.22, 0, 0.22].forEach((spread, idx) => {
          const ang = baseAngle + spread;
          const orbSpeed = 330 + idx * 15;
          projectiles.push(new Projectile(
            this.x + (idx - 1) * 35,
            this.y + 10,
            Math.cos(ang) * orbSpeed,
            Math.sin(ang) * orbSpeed,
            9,
            16,
            '#f59e0b',
            false,
            'boss_orb'
          ));
        });

        // Chispas de energía concentrada
        for (let k = 0; k < 6; k++) {
          particles.push(new Particle(
            this.x + (Math.random() - 0.5) * 60,
            this.y + 10,
            (Math.random() - 0.5) * 140,
            (Math.random() - 0.5) * 140,
            '#fbbf24',
            4,
            0.3,
            'spark'
          ));
        }
      }

      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.stateTimer = 1.3;
      }
    } else if (this.state === 'eye_lasers') {
      // 3 Eyes track towards player then blast beams
      this.targetBeamX += (player.x - this.targetBeamX) * 1.8 * dt;
      
      if (this.stateTimer < 2.5 && this.stateTimer > 0.6) {
        this.laserCharging = false;
        this.laserFiring = true;

        // Shoot damaging projectiles along the triple beams
        if (Math.random() < 0.40) {
          const eyeXOffsets = [-50, 0, 50];
          eyeXOffsets.forEach(ox => {
            projectiles.push(new Projectile(
              this.x + ox, this.y - 10,
              (this.targetBeamX + ox - (this.x + ox)) * 0.8, 360,
              8, 16, '#ef4444', false, 'boss_orb'
            ));
          });
        }
      } else if (this.stateTimer <= 0.6) {
        this.laserFiring = false;
        if (this.stateTimer <= 0) {
          this.state = 'idle';
          this.stateTimer = 1.4;
        }
      }
    } else if (this.state === 'arm_slam') {
      // Multi-arms slam down creating ground shockwaves
      if (this.stateTimer < 1.4 && this.stateTimer > 1.2) {
        soundMgr.playExplosion(true);
        // Sand shockwave rings moving left and right across ground
        projectiles.push(new Projectile(this.x, this.groundY - 10, -280, 0, 14, 14, '#d97706', false, 'acid'));
        projectiles.push(new Projectile(this.x, this.groundY - 10, 280, 0, 14, 14, '#d97706', false, 'acid'));

        // Dust explosion
        for (let i = 0; i < 20; i++) {
          particles.push(new Particle(
            this.x + (Math.random() - 0.5) * 80, this.groundY - 5,
            (Math.random() - 0.5) * 220, -50 - Math.random() * 80,
            '#d97706', 5, 0.45, 'smoke'
          ));
        }
      }

      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.stateTimer = 1.2;
      }
    } else if (this.state === 'summon_minions') {
      // Spawn flying minions and orbs
      if (Math.random() < 0.12) {
        projectiles.push(new Projectile(
          this.x + (Math.random() - 0.5) * 100, this.y + 40,
          (Math.random() - 0.5) * 180, 160 + Math.random() * 80,
          7, 12, '#c084fc', false, 'purple'
        ));
      }

      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.stateTimer = 1.2;
      }
    } else if (this.state === 'berserk') {
      // BERSERK: Continuous triple eye laser sweep + energy orbs
      this.targetBeamX = this.x + Math.sin(this.breathTimer * 2.5) * 320;
      this.laserFiring = true;

      if (Math.random() < 0.5) {
        const ox = (Math.random() - 0.5) * 80;
        projectiles.push(new Projectile(
          this.x + ox, this.y,
          (this.targetBeamX - this.x) * 0.85, 380,
          9, 18, '#ef4444', false, 'boss_orb'
        ));
      }

      if (this.stateTimer <= 0) {
        this.laserFiring = false;
        this.state = 'idle';
        this.stateTimer = 1.4;
      }
    }
  }

  takeDamage(amount) {
    if (this.state === 'intro') return;
    this.hp -= amount;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  getHitbox() {
    return {
      x: this.x - 100,
      y: this.y - 70 + this.introRise,
      width: 200,
      height: 160
    };
  }
}

// -------------------------------------------------------------
// LEVEL 2 NUEVO MONSTRUO: LA BRUJA VOLADORA EN ESCOBA
// -------------------------------------------------------------
export class WitchEnemy {
  constructor(x, y, aggression = 1.0) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.width = 60;
    this.height = 54;
    this.hp = Math.round(70 * (1 + (aggression - 1) * 0.25));
    this.maxHp = this.hp;
    this.alive = true;
    this.aggression = aggression;
    this.speed = 110 * (1 + (aggression - 1) * 0.35);
    this.shootTimer = (1.6 + Math.random() * 1.4) / aggression;
    this.hitFlash = 0;
    this.points = 450;
    this.type = 'witch';
    this.floatTimer = Math.random() * 10;
    this.dir = -1;
    this.sparkleTimer = 0;
  }

  update(dt, player, projectiles, soundMgr, particles) {
    this.floatTimer += dt * 3.0;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Movimiento oscilatorio suave persiguiendo la dirección del jugador
    this.dir = player.x < this.x ? -1 : 1;
    this.x += this.dir * this.speed * dt;
    this.y = this.startY + Math.sin(this.floatTimer) * 32;

    // Estela de chispas mágicas de la escoba
    this.sparkleTimer += dt;
    if (this.sparkleTimer > 0.08) {
      this.sparkleTimer = 0;
      particles.push(new Particle(
        this.x - this.dir * 28, this.y + 12 + (Math.random() - 0.5) * 8,
        -this.dir * (20 + Math.random() * 25), (Math.random() - 0.5) * 15,
        Math.random() < 0.6 ? '#fde047' : '#c084fc', 3, 0.35, 'spark'
      ));
    }

    // Disparo de bolas luminosas mágicas
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = (2.2 + Math.random() * 1.0) / this.aggression;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 230 * (1 + (this.aggression - 1) * 0.2);

      projectiles.push(new Projectile(
        this.x + this.dir * 18, this.y + 6,
        (dx / Math.max(1, dist)) * speed, (dy / Math.max(1, dist)) * speed,
        8, 14, '#fef08a', false, 'light_orb'
      ));

      if (soundMgr && soundMgr.playWitchMagic) {
        soundMgr.playWitchMagic();
      } else if (soundMgr && soundMgr.playGunshot) {
        soundMgr.playGunshot();
      }
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.alive = false;
  }

  getHitbox() {
    return { x: this.x - 24, y: this.y - 24, width: 48, height: 48 };
  }
}

// -------------------------------------------------------------
// LEVEL 2 FINAL DEL CAMINO: EL PORTAL DE SALIDA (EXIT PORTAL)
// -------------------------------------------------------------
export class ExitPortal {
  constructor(x, groundY) {
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - 65;
    this.width = 60;
    this.height = 130;
    this.active = true;
    this.animTimer = 0;
  }

  update(dt, particles) {
    this.animTimer += dt;
    // Partículas cósmicas atrayéndose hacia el vórtice
    if (Math.random() < 0.4) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 35;
      particles.push(new Particle(
        this.x + Math.cos(angle) * dist,
        this.y + Math.sin(angle) * dist * 1.4,
        -Math.cos(angle) * 35,
        -Math.sin(angle) * 35,
        Math.random() < 0.5 ? '#38bdf8' : '#a855f7',
        3.5,
        0.5,
        'spark'
      ));
    }
  }

  getHitbox() {
    return {
      x: this.x - 30,
      y: this.groundY - 110,
      width: 60,
      height: 110
    };
  }
}


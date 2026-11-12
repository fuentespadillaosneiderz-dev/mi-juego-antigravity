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
      // =========================================================
      // BOTIQUÍN MÉDICO RETRO (IDÉNTICO A LA PRIMERA IMAGEN)
      // Maletín rojo con asa, compartimento lateral y cruz verde
      // =========================================================
      // Resplandor verde curativo ambiental
      ctx.shadowColor = 'rgba(34, 197, 94, 0.75)';
      ctx.shadowBlur = 14 + Math.sin(this.timer * 4) * 4;

      // 1. Asa superior roja con soportes plateados
      ctx.fillStyle = '#9ca3af'; // Soportes metálicos
      ctx.fillRect(-7, -15, 3, 3);
      ctx.fillRect(4, -15, 3, 3);
      ctx.fillStyle = '#dc2626'; // Asa curvada roja
      ctx.beginPath();
      ctx.roundRect(-8, -17, 16, 4, 2);
      ctx.fill();

      // 2. Cuerpo principal del maletín rojo
      ctx.fillStyle = '#450a0a'; // Borde oscuro pixel
      ctx.beginPath();
      ctx.roundRect(-16, -12, 33, 23, 3);
      ctx.fill();

      ctx.fillStyle = '#dc2626'; // Rojo principal
      ctx.beginPath();
      ctx.roundRect(-15, -11, 24, 21, 2);
      ctx.fill();

      // Brillo superior del maletín
      ctx.fillStyle = '#f87171';
      ctx.fillRect(-14, -10, 22, 2);

      // Bisagras plateadas en el lateral izquierdo
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(-16.5, -8, 2, 4);
      ctx.fillRect(-16.5, 4, 2, 4);

      // 3. Compartimento lateral abierto (derecha: vendas, frasco, sobre)
      ctx.fillStyle = '#7f1d1d'; // Fondo oscuro interior
      ctx.fillRect(9, -11, 7, 21);

      // Rollo de vendas (beige estriado)
      ctx.fillStyle = '#e5d3b3';
      ctx.fillRect(10, -9, 5, 5);
      ctx.fillStyle = '#bfa888';
      ctx.fillRect(10, -7, 5, 1);
      ctx.fillRect(10, -5, 5, 1);

      // Frasco de medicina (vidrio ámbar/marrón con etiqueta verde)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(10, -2, 5, 6);
      ctx.fillStyle = '#e5e7eb'; // Tapa blanca
      ctx.fillRect(11, -3, 3, 1.5);
      ctx.fillStyle = '#22c55e'; // Etiqueta verde
      ctx.fillRect(11, 0, 3, 2);

      // Paquete médico inferior (blanco/gris)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(10, 5, 5, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(11, 6, 3, 1);

      // 4. Cruz Verde Médica Central Brillante
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 10;
      // Borde oscuro de la cruz
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(-8, -4.5, 11, 9);
      ctx.fillRect(-4.5, -8, 9, 11);

      // Relleno verde vibrante de la cruz
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-7, -3.5, 9, 7);
      ctx.fillRect(-3.5, -7, 7, 9);

      // Núcleo verde esmeralda brillante
      ctx.fillStyle = '#86efac';
      ctx.fillRect(-6, -2.5, 7, 5);
      ctx.fillRect(-2.5, -6, 5, 7);

      // 5. Destellos de cruces verdes flotantes '+'
      ctx.shadowBlur = 5;
      ctx.fillStyle = '#4ade80';
      const f1 = Math.sin(this.timer * 4) * 2;
      const f2 = Math.cos(this.timer * 3.5) * 2;
      // Cruz '+' arriba derecha
      ctx.fillRect(15 + f1, -16 + f2, 4, 1.5);
      ctx.fillRect(16.25 + f1, -17.25 + f2, 1.5, 4);
      // Cruz '+' abajo izquierda
      ctx.fillRect(-18 - f2, 9 + f1, 3.5, 1.3);
      ctx.fillRect(-16.9 - f2, 7.9 + f1, 1.3, 3.5);

    } else if (this.type === 'rapid') {
      // =========================================================
      // CALAVERA CON LLAMAS VERDES Y OJOS ROJOS (IDÉNTICA A IMAGEN 2)
      // Potenciador de Disparo Triple / Ráfagas
      // =========================================================
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 16 + Math.sin(this.timer * 5) * 4;

      const flamePulse = Math.sin(this.timer * 8) * 1.5;

      // 1. Llamas Verdes Espectrales detrás de la calavera
      ctx.fillStyle = '#047857'; // Base oscura de la llama
      ctx.beginPath();
      ctx.moveTo(-12, 2);
      ctx.quadraticCurveTo(-16, -6, -12 + flamePulse, -16);
      ctx.quadraticCurveTo(-8, -11, -3, -20 - flamePulse);
      ctx.quadraticCurveTo(0, -13, 3, -23 + flamePulse);
      ctx.quadraticCurveTo(8, -13, 12 - flamePulse, -16);
      ctx.quadraticCurveTo(16, -6, 12, 2);
      ctx.closePath();
      ctx.fill();

      // Llamas verde brillante interior
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(-9, 1);
      ctx.quadraticCurveTo(-12, -5, -9 + flamePulse * 0.7, -13);
      ctx.quadraticCurveTo(-4, -9, 0, -18 - flamePulse * 0.8);
      ctx.quadraticCurveTo(4, -9, 9 - flamePulse * 0.7, -13);
      ctx.quadraticCurveTo(12, -5, 9, 1);
      ctx.closePath();
      ctx.fill();

      // Puntas de llama verde lima
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.moveTo(-4, -4);
      ctx.lineTo(0, -15 - flamePulse);
      ctx.lineTo(4, -4);
      ctx.closePath();
      ctx.fill();

      // 2. Cráneo Óseo de la Calavera
      ctx.fillStyle = '#e2e8f0'; // Hueso base
      ctx.beginPath();
      ctx.ellipse(0, -2, 10, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mandíbula / Maxilar
      ctx.fillRect(-6.5, 3, 13, 6);

      // Sombra inferior de los pómulos
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-8, 1, 2.5, 3);
      ctx.fillRect(5.5, 1, 2.5, 3);

      // Cavidad nasal
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.lineTo(-1.5, 3.5);
      ctx.lineTo(1.5, 3.5);
      ctx.closePath();
      ctx.fill();

      // Dientes de la calavera
      ctx.fillStyle = '#ffffff';
      for (let t = -5; t <= 3.5; t += 2.2) {
        ctx.fillRect(t, 5, 1.6, 3.5);
      }
      ctx.fillStyle = '#334155'; // Separadores oscuros de dientes
      for (let t = -3.2; t <= 3.5; t += 2.2) {
        ctx.fillRect(t, 5, 0.6, 4);
      }

      // 3. Ojos Rojos Demoníacos Brillantes
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;

      // Cuencas oculares oscuras
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(-4.5, -2, 3.2, 2.8, -0.1, 0, Math.PI * 2);
      ctx.ellipse(4.5, -2, 3.2, 2.8, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Iris rojo incandescente
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(-4.5, -2, 2.2, 0, Math.PI * 2);
      ctx.arc(4.5, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo rojo brillante
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(-4.5, -2, 1.2, 0, Math.PI * 2);
      ctx.arc(4.5, -2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Destello pupilar
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-5, -2.5, 1, 1);
      ctx.fillRect(4, -2.5, 1, 1);

      // Chispas de fuego verde flotando
      ctx.fillStyle = '#4ade80';
      ctx.shadowBlur = 6;
      ctx.fillRect(-11 + flamePulse, -13, 1.8, 1.8);
      ctx.fillRect(10 - flamePulse, -16, 1.8, 1.8);

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
    this.isAutoWalking = false;
  }

  updateAim(targetX, targetY) {
    if (this.isAutoWalking || targetX === null || targetY === null || isNaN(targetX) || isNaN(targetY)) {
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
    // If auto-walking (cinematic), player marches forward calmly towards the train
    let moveDir = 0;
    if (this.isAutoWalking) {
      moveDir = 1;
      this.facing = 1;
      this.hasAimTarget = false;
    } else {
      if (keys['ArrowLeft'] || keys['KeyA']) moveDir -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) moveDir += 1;
    }

    // Flecha Abajo: Bajar / Agacharse
    const downPressed = !this.isAutoWalking && (keys['ArrowDown'] || keys['KeyS']);
    this.isCrouching = downPressed && this.isGrounded;

    // Movement
    if (this.isCrouching) {
      this.vx = moveDir * (this.speed * 0.4); // Slower crawl when ducking
    } else {
      this.vx = moveDir * (this.isAutoWalking ? 130 : this.speed);
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
    if (this.isAutoWalking) return false;
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
    if (this.isAutoWalking || this.shootCooldown > 0) return;

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
    this.maxHp = 10000; // Monstruo del Nivel 2 reforzado con 10,000 HP según solicitud
    this.hp = 10000;
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
    if (this.state === 'intro' || this.state === 'writhing') return;
    this.hp -= amount;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.hp = 0;
    }
  }

  updateWrithing(dt, particles) {
    this.breathTimer += dt * 14;
    this.laserCharging = false;
    this.laserFiring = false;

    // Erratic, frantic flailing of all 6 clawed arms
    for (let i = 0; i < 6; i++) {
      this.armAngles[i] = Math.sin(this.breathTimer * 4.5 + i * 2.1) * 0.95;
    }

    // Spew green flames, embers and smoke from body, maw and 3 eyes
    for (let k = 0; k < 5; k++) {
      const offsetX = (Math.random() - 0.5) * 120;
      const offsetY = (Math.random() - 0.5) * 90;
      const vx = (Math.random() - 0.5) * 120;
      const vy = -60 - Math.random() * 150;
      const greenColors = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#a7f3d0'];
      const col = greenColors[Math.floor(Math.random() * greenColors.length)];
      particles.push(new Particle(
        this.x + offsetX,
        this.y + offsetY,
        vx, vy,
        col,
        3 + Math.random() * 5,
        0.5 + Math.random() * 0.5,
        'circle'
      ));
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

// -------------------------------------------------------------
// LEVEL 4 NEW MONSTER: EL ESQUELETO DE FUEGO VERDE Y AURA NEGRA
// (Inspirado en la Imagen 2: esqueleto con cuernos de llama verde,
// aura negra pulsante, escudo con murciélago y garrote con púas)
// -------------------------------------------------------------
export class GreenFlameSkeletonEnemy {
  constructor(x, groundY, aggression = 1.0) {
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - 38;
    this.width = 52;
    this.height = 76;
    this.hp = Math.round(140 * (1 + (aggression - 1) * 0.25));
    this.maxHp = this.hp;
    this.alive = true;
    this.aggression = aggression;
    this.speed = 72 * (1 + (aggression - 1) * 0.35);
    this.hitFlash = 0;
    this.points = 350;
    this.type = 'skeleton';
    this.dir = -1;
    this.animTime = Math.random() * 10;
    this.auraTimer = 0;

    // Garrote slam attack state
    this.slamCooldown = 1.8 + Math.random() * 0.8;
    this.isSlamming = false;
    this.slamTimer = 0;
    this.hasStruck = false;
    this.slamWindupTime = 0.42;
    this.slamTotalTime = 0.85;
  }

  update(dt, player, projectiles, soundMgr, particles) {
    this.animTime += dt * 3.5;
    this.auraTimer += dt * 4;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Fuego verde y aura negra emitiendo partículas continuas
    if (particles && Math.random() < 0.35) {
      // Llamas verdes del cráneo
      particles.push(new Particle(
        this.x + (Math.random() - 0.5) * 20,
        this.y - 32 - Math.random() * 16,
        (Math.random() - 0.5) * 18,
        -25 - Math.random() * 30,
        Math.random() < 0.6 ? '#22c55e' : '#86efac',
        3.5,
        0.35,
        'spark'
      ));
      // Aura negra humeante
      particles.push(new Particle(
        this.x + (Math.random() - 0.5) * 28,
        this.y + (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 12,
        -10 - Math.random() * 15,
        '#050505',
        5.0,
        0.45,
        'smoke'
      ));
    }

    if (this.slamCooldown > 0) {
      this.slamCooldown -= dt;
    }

    const distToPlayer = Math.abs(player.x - this.x);

    // Si está realizando el golpe con su garrote
    if (this.isSlamming) {
      this.slamTimer += dt;

      // Momento del impacto en el suelo
      if (!this.hasStruck && this.slamTimer >= this.slamWindupTime) {
        this.hasStruck = true;
        if (soundMgr && soundMgr.playSkeletonSlam) {
          soundMgr.playSkeletonSlam();
        }

        // Partículas de choque en el suelo de madera del tren
        if (particles) {
          for (let p = 0; p < 18; p++) {
            const spdX = (Math.random() - 0.5) * 160;
            const spdY = -40 - Math.random() * 90;
            particles.push(new Particle(
              this.x + this.dir * 28,
              this.groundY - 2,
              spdX,
              spdY,
              Math.random() < 0.5 ? '#22c55e' : '#e2e8f0',
              3.5,
              0.4,
              'spark'
            ));
          }
        }

        // Daño al jugador si está cerca en el suelo
        const strikeRange = 80;
        if (distToPlayer < strikeRange && player.hp > 0) {
          const isPlayerInFront = (this.dir === -1 && player.x <= this.x) || (this.dir === 1 && player.x >= this.x);
          if (isPlayerInFront && player.invulnTime <= 0) {
            player.hp = Math.max(0, player.hp - 18);
            player.invulnTime = 0.8;
            if (soundMgr && soundMgr.playHit) soundMgr.playHit();
            // Empujón al jugador
            player.vx = this.dir * 260;
            player.vy = -180;
          }
        }
      }

      if (this.slamTimer >= this.slamTotalTime) {
        this.isSlamming = false;
        this.slamTimer = 0;
        this.hasStruck = false;
        this.slamCooldown = (2.0 + Math.random() * 1.0) / this.aggression;
      }
      return;
    }

    // Comportamiento normal: caminar hacia el jugador
    this.dir = player.x < this.x ? -1 : 1;
    this.x += this.dir * this.speed * dt;

    // Iniciar ataque de garrote si está a corta distancia
    if (distToPlayer < 75 && this.slamCooldown <= 0) {
      this.isSlamming = true;
      this.slamTimer = 0;
      this.hasStruck = false;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.alive = false;
  }

  getHitbox() {
    return {
      x: this.x - 22,
      y: this.y - 34,
      width: 44,
      height: 72
    };
  }
}

// -------------------------------------------------------------
// LEVEL 4 MINI GHOST ENEMY (3 FANTASMAS PEQUEÑOS DEL REY FANTASMA)
// (Inspirado en la Imagen 3: fantasmas traviesos que salen de la boca)
// -------------------------------------------------------------
export class MiniGhostEnemy {
  constructor(x, y, targetDir = -1) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.width = 38;
    this.height = 38;
    this.hp = 65;
    this.maxHp = 65;
    this.alive = true;
    this.speed = 145;
    this.points = 180;
    this.type = 'mini_ghost';
    this.hitFlash = 0;
    this.dir = targetDir;
    this.sinTimer = Math.random() * 10;
  }

  update(dt, player, projectiles, soundMgr, particles) {
    this.sinTimer += dt * 4.0;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Volar en trayectoria sinuosa hacia el jugador
    this.dir = player.x < this.x ? -1 : 1;
    this.x += this.dir * this.speed * dt;
    this.y += Math.sin(this.sinTimer) * 45 * dt;

    // Ajuste de altura hacia el torso del jugador
    if (this.y < player.y - 25) this.y += 35 * dt;
    if (this.y > player.y + 25) this.y -= 35 * dt;

    // Estela de fuego blanco y verde
    if (particles && Math.random() < 0.28) {
      particles.push(new Particle(
        this.x - this.dir * 10,
        this.y,
        -this.dir * 25,
        (Math.random() - 0.5) * 15,
        Math.random() < 0.5 ? '#ffffff' : '#34d399',
        3,
        0.3,
        'smoke'
      ));
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.alive = false;
  }

  getHitbox() {
    return {
      x: this.x - 18,
      y: this.y - 18,
      width: 36,
      height: 36
    };
  }
}

// -------------------------------------------------------------
// ENERGY BALL PROJECTILE (Bola de Energía - ataque del Rey Fantasma)
// Homing orb that tracks the player for 5 seconds then vanishes.
// Purple/cyan/red swirling vortex spiral.
// -------------------------------------------------------------
export class EnergyBallProjectile {
  constructor(x, y, player) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.speed = 180;            // ~180px/s medium speed
    this.homingTime = 5.0;       // tracks for 5 seconds then disappears
    this.blindDuration = 5.0;    // blinds player for 5 seconds on hit
    this.damage = 4;             // small amount of damage
    this.alive = true;
    this.age = 0;
    this.spiralAngle = 0;

    // Initial velocity toward player
    const dx = player.x - x;
    const dy = player.y - y;
    const dist = Math.hypot(dx, dy) || 1;
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }

  update(dt, player, particles) {
    if (!this.alive) return;

    this.age += dt;
    this.homingTime -= dt;
    this.spiralAngle += dt * 8;

    // Expired — stop tracking and vanish
    if (this.homingTime <= 0) {
      this.alive = false;
      // Burst particles on expiry
      if (particles) {
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 * i) / 12;
          particles.push(new Particle(
            this.x, this.y,
            Math.cos(a) * 90 + (Math.random() - 0.5) * 30,
            Math.sin(a) * 90 + (Math.random() - 0.5) * 30,
            ['#a855f7', '#22d3ee', '#ef4444'][i % 3],
            3.5, 0.45, 'spark'
          ));
        }
      }
      return;
    }

    // Homing: steer toward the player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const desiredVx = (dx / dist) * this.speed;
    const desiredVy = (dy / dist) * this.speed;
    // Smooth steering (lerp factor per second)
    const steer = 3.0 * dt;
    this.vx += (desiredVx - this.vx) * steer;
    this.vy += (desiredVy - this.vy) * steer;
    // Re-normalize to speed
    const curSpeed = Math.hypot(this.vx, this.vy) || 1;
    this.vx = (this.vx / curSpeed) * this.speed;
    this.vy = (this.vy / curSpeed) * this.speed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Trail particles
    if (particles && Math.random() < 0.6) {
      particles.push(new Particle(
        this.x + (Math.random() - 0.5) * 10,
        this.y + (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        Math.random() < 0.5 ? '#a855f7' : '#22d3ee',
        2.5, 0.3, 'spark'
      ));
    }

    // Collision with player
    const hitDist = Math.hypot(this.x - player.x, this.y - (player.y - 20));
    if (hitDist < this.radius + 16) {
      // Deal small damage
      if (player.invulnTime <= 0) {
        player.hp = Math.max(0, player.hp - this.damage);
        player.invulnTime = 0.5;
        // Blind the player for 5 seconds
        player.blindTimer = this.blindDuration;
      }
      this.alive = false;
      // Impact particles
      if (particles) {
        for (let i = 0; i < 8; i++) {
          particles.push(new Particle(
            this.x, this.y,
            (Math.random() - 0.5) * 120,
            (Math.random() - 0.5) * 120,
            ['#a855f7', '#22d3ee', '#ef4444'][i % 3],
            4, 0.35, 'spark'
          ));
        }
      }
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();

    const cx = this.x;
    const cy = this.y;
    const r = this.radius;

    // Outer glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.8);
    glow.addColorStop(0, 'rgba(168,85,247,0.6)');
    glow.addColorStop(0.5, 'rgba(34,211,238,0.25)');
    glow.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Swirling vortex arms (purple, cyan, red)
    const colors = ['#a855f7', '#22d3ee', '#ef4444'];
    for (let arm = 0; arm < 3; arm++) {
      ctx.strokeStyle = colors[arm];
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      const baseAngle = this.spiralAngle + (Math.PI * 2 * arm) / 3;
      for (let t = 0; t <= 1; t += 0.05) {
        const spiralR = r * t;
        const angle = baseAngle + t * Math.PI * 2.5;
        const px = cx + Math.cos(angle) * spiralR;
        const py = cy + Math.sin(angle) * spiralR;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Bright center core
    ctx.globalAlpha = 1.0;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.45);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.5, '#c084fc');
    core.addColorStop(1, 'rgba(168,85,247,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }
}

// -------------------------------------------------------------
// LEVEL 4 JEFE FINAL: EL REY FANTASMA (THE GHOST KING)
// Reworked: 4-directional movement, teleport every 5s,
// energy ball attacks (homing + blind), mini ghost spawns,
// dust death animation → burning train cinematic.
// -------------------------------------------------------------
export class GhostKingBoss {
  constructor(x, groundY) {
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - 140;
    this.width = 240;
    this.height = 230;
    // DOBLE DE VIDA QUE EL MONSTRUO DE 3 OJOS (10,000 HP x 2 = 20,000 HP)
    this.maxHp = 20000;
    this.hp = 20000;
    this.alive = true;
    this.active = false;
    this.points = 25000;
    this.type = 'ghost_king';
    this.hitFlash = 0;

    // State machine: 'intro' → 'active' → 'teleport' → 'active' → ... → 'dust'
    this.state = 'intro';
    this.stateTimer = 2.2;
    this.facing = -1; // -1 left, 1 right
    this.alpha = 1.0;

    // 4-directional movement
    this.moveDir = { x: 1, y: 0 }; // current movement direction
    this.moveSpeed = 90;            // px/s inside the train
    this.dirChangeTimer = 1.5;      // time until next direction pick

    // Teleport cycle: every 5 seconds
    this.teleportCooldown = 5.0;

    // Energy ball attack
    this.energyBalls = [];          // active EnergyBallProjectile instances
    this.shootCooldown = 2.5;       // seconds between shots
    this.shootTimer = 1.5;          // first shot comes a bit earlier

    // Mini ghost spawns
    this.miniGhosts = [];
    this.miniGhostTimer = 6.0;      // spawn every ~6 seconds
    this.miniGhostCooldown = 6.0;

    // Animation helpers
    this.floatTimer = 0;
    this.mouthOpenRatio = 0.2;
    this.tongueWave = 0;
    this.lanternAngle = 0;

    // Dust death animation
    this.dustTimer = 0;
    this.dustDuration = 3.0;
    this.dustParticlesEmitted = false;
  }

  /** Register externally-spawned mini ghosts so the boss can track them */
  registerMiniGhost(ghost) {
    if (ghost) this.miniGhosts.push(ghost);
  }

  update(dt, player, projectiles, soundMgr, particles, spawnMiniGhostsCb, game) {
    this.floatTimer += dt * 2.2;
    this.tongueWave += dt * 5.0;
    this.lanternAngle = Math.sin(this.floatTimer * 1.5) * 0.25;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Update all energy balls
    for (let i = this.energyBalls.length - 1; i >= 0; i--) {
      const ball = this.energyBalls[i];
      ball.update(dt, player, particles);
      if (!ball.alive) {
        // When energy ball disappears, trigger a teleport
        if (this.state === 'active') {
          this.teleportCooldown = 0; // force teleport on next frame
        }
        this.energyBalls.splice(i, 1);
      }
    }

    // Clean up dead mini ghosts
    this.miniGhosts = this.miniGhosts.filter(g => g && g.alive);

    // ========== STATE: INTRO (2.2s entrance) ==========
    if (this.state === 'intro') {
      this.mouthOpenRatio = 0.3 + Math.sin(this.floatTimer * 3) * 0.2;
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.active = true;
        this.state = 'active';
        this.teleportCooldown = 5.0;
        this.shootTimer = 1.5;
        this.miniGhostTimer = 4.0;
        if (soundMgr && soundMgr.playGhostRoar) soundMgr.playGhostRoar();
      }
      return;
    }

    // ========== STATE: DUST (death animation ~3s) ==========
    if (this.state === 'dust') {
      this.dustTimer += dt;
      // Alpha fades as boss crumbles
      this.alpha = Math.max(0, 1.0 - this.dustTimer / this.dustDuration);

      // Emit dust/crumble particles throughout the animation
      if (particles) {
        const intensity = Math.max(1, Math.floor(8 * (1 - this.dustTimer / this.dustDuration)));
        for (let i = 0; i < intensity; i++) {
          const px = this.x + (Math.random() - 0.5) * this.width * 0.6;
          const py = this.y + (Math.random() - 0.5) * this.height * 0.5;
          particles.push(new Particle(
            px, py,
            (Math.random() - 0.5) * 70,
            -30 - Math.random() * 60,
            Math.random() < 0.5 ? '#9ca3af' : '#6b7280',
            3 + Math.random() * 4,
            0.6 + Math.random() * 0.5,
            'smoke',
            120 // gravity pulls dust down
          ));
        }
      }

      // Final burst and cinematic trigger
      if (this.dustTimer >= this.dustDuration) {
        this.alpha = 0;
        this.alive = false;
        // Cinematic: player jumps off the burning train into haunted forest
        if (game && game.triggerBossCinematic) {
          game.triggerBossCinematic('ghost_king_defeated');
        }
        // Big final dust explosion
        if (particles) {
          for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            particles.push(new Particle(
              this.x, this.y,
              Math.cos(angle) * (80 + Math.random() * 60),
              Math.sin(angle) * (80 + Math.random() * 60),
              ['#9ca3af', '#d1d5db', '#f97316', '#fbbf24'][i % 4],
              4 + Math.random() * 3,
              0.8,
              'spark',
              60
            ));
          }
        }
      }
      return;
    }

    // ========== STATE: TELEPORT (fade out 0.6s, reposition, fade in 0.6s) ==========
    if (this.state === 'teleport') {
      this.stateTimer -= dt;

      if (this.stateTimer > 0.6) {
        // Fading out
        this.alpha = Math.max(0, (this.stateTimer - 0.6) / 0.6);
        if (particles && Math.random() < 0.5) {
          particles.push(new Particle(
            this.x + (Math.random() - 0.5) * 90,
            this.y + (Math.random() - 0.5) * 90,
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 60,
            '#34d399',
            4, 0.4, 'spark'
          ));
        }
      } else {
        // Reposition when fully invisible
        if (this.alpha <= 0.01) {
          this._pickNewPosition(player, game);
        }
        // Fading in
        this.alpha = Math.min(1.0, 1.0 - (this.stateTimer / 0.6));
      }

      if (this.stateTimer <= 0) {
        this.alpha = 1.0;
        this.state = 'active';
        this.teleportCooldown = 5.0;
        this.shootTimer = Math.min(this.shootTimer, 1.0); // shoot shortly after reappearing
        if (soundMgr && soundMgr.playGhostRoar) soundMgr.playGhostRoar();
      }
      return;
    }

    // ========== STATE: ACTIVE ==========
    if (this.state === 'active') {
      // Face the player
      this.facing = player.x < this.x ? -1 : 1;

      // Spectral float
      const baseY = this.groundY - 140;
      this.y = baseY + Math.sin(this.floatTimer) * 14;

      // -- 4-directional movement inside the train --
      this.dirChangeTimer -= dt;
      if (this.dirChangeTimer <= 0) {
        this._pickRandomDirection();
        this.dirChangeTimer = 1.2 + Math.random() * 1.5;
      }
      this.x += this.moveDir.x * this.moveSpeed * dt;
      this.y += this.moveDir.y * this.moveSpeed * 0.5 * dt; // vertical movement is gentler

      // Clamp inside visible area
      if (game) {
        const minX = (game.cameraX || 0) + 80;
        const maxX = (game.cameraX || 0) + 880;
        this.x = Math.max(minX, Math.min(maxX, this.x));
      }
      const minY = this.groundY - 220;
      const maxY = this.groundY - 80;
      this.y = Math.max(minY, Math.min(maxY, this.y));

      // Mouth animation
      this.mouthOpenRatio = 0.3 + Math.sin(this.floatTimer * 2) * 0.15;

      // -- Shoot energy ball --
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = this.shootCooldown;
        const ball = new EnergyBallProjectile(
          this.x + this.facing * 40,
          this.y - 10,
          player
        );
        this.energyBalls.push(ball);
        // Open mouth wide briefly for the shot
        this.mouthOpenRatio = 0.9;
        if (soundMgr && soundMgr.playGhostRoar) soundMgr.playGhostRoar();
      }

      // -- Spawn mini ghosts periodically --
      this.miniGhostTimer -= dt;
      if (this.miniGhostTimer <= 0) {
        this.miniGhostTimer = this.miniGhostCooldown;
        if (spawnMiniGhostsCb) {
          const spawned = spawnMiniGhostsCb(this.x + this.facing * 30, this.y - 10, this.facing);
          if (Array.isArray(spawned)) {
            this.miniGhosts.push(...spawned);
          }
        }
        this.mouthOpenRatio = 1.0;
        if (soundMgr && soundMgr.playMiniGhostChirp) soundMgr.playMiniGhostChirp();
      }

      // -- Teleport cooldown --
      this.teleportCooldown -= dt;
      if (this.teleportCooldown <= 0) {
        this.state = 'teleport';
        this.stateTimer = 1.2; // 0.6s fade out + 0.6s fade in
      }
    }
  }

  /** Pick a new random 4-directional movement */
  _pickRandomDirection() {
    const dirs = [
      { x: 1, y: 0 },   // right
      { x: -1, y: 0 },  // left
      { x: 0, y: -1 },  // up
      { x: 0, y: 1 }    // down
    ];
    this.moveDir = dirs[Math.floor(Math.random() * dirs.length)];
  }

  /** Pick a new position away from current spot */
  _pickNewPosition(player, game) {
    const cameraX = game ? (game.cameraX || 0) : (player.x - 480);
    const arenaLeft = cameraX + 100;
    const arenaRight = cameraX + 860;
    const arenaTop = this.groundY - 220;
    const arenaBottom = this.groundY - 90;

    // Pick a random position in the arena, biased away from current
    let newX, newY, attempts = 0;
    do {
      newX = arenaLeft + Math.random() * (arenaRight - arenaLeft);
      newY = arenaTop + Math.random() * (arenaBottom - arenaTop);
      attempts++;
    } while (Math.hypot(newX - this.x, newY - this.y) < 150 && attempts < 10);

    this.x = newX;
    this.y = newY;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) {
      this.hp = 0;
      // Enter dust death state instead of dying immediately
      this.state = 'dust';
      this.dustTimer = 0;
      this.alpha = 1.0;
      // Remove all energy balls
      this.energyBalls.length = 0;
    }
  }

  getHitbox() {
    return {
      x: this.x - 70,
      y: this.y - 85,
      width: 140,
      height: 170
    };
  }
}

// -------------------------------------------------------------
// FLEEING CIVILIAN / PASSENGER (NIVEL 4 - INTERIOR DEL TREN)
// Personas que aparecen en la Imagen 2 corriendo en la dirección contraria.
// "no los podemos matar": no reciben daño, los proyectiles los atraviesan.
// -------------------------------------------------------------
export class FleeingCivilian {
  constructor(x, groundY) {
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - 35;
    this.width = 38;
    this.height = 64;
    this.vx = -140 - Math.random() * 50; // Corren hacia la izquierda (dirección contraria)
    this.vy = 0;
    this.facing = -1;
    this.animTime = Math.random() * 5;
    this.isCivilian = true;
    this.alive = true;
    this.variant = Math.floor(Math.random() * 3); // 0: Mochilero, 1: Traje verde, 2: Revisor
    this.shoutTimer = 0.8 + Math.random() * 2.0;

    this.shouts = [
      '¡¡¡SÁLVESE QUIEN PUEDA!!! 😱',
      '¡¡¡UN FANTASMA EN EL TREN!!! 👻',
      '¡¡¡CORRAN AL FONDO!!! 🏃‍♂️',
      '¡¡¡EL REY FANTASMA DESPERTÓ!!! 👑',
      '¡¡¡AYUDAAAA!!! 🚂',
      '¡¡¡NO VAYAS HACIA ALLÁ!!! 💀',
      '¡¡¡ESTÁ MALDITO EL TREN!!! 😱'
    ];
  }

  update(dt, cameraX, floatingTexts = null) {
    this.animTime += dt;
    this.x += this.vx * dt;

    // Pequeño bamboleo al correr sobre los tablones
    this.y = this.groundY - 35 + Math.sin(this.animTime * 14) * 2;

    // Grito de pánico ocasional en pantalla
    this.shoutTimer -= dt;
    if (this.shoutTimer <= 0 && floatingTexts && this.x > cameraX && this.x < cameraX + 880) {
      this.shoutTimer = 3.5 + Math.random() * 3.5;
      const text = this.shouts[Math.floor(Math.random() * this.shouts.length)];
      floatingTexts.push(new FloatingText(this.x, this.y - 48, text, '#fef08a', 10.5));
    }

    // Despawn cuando queda atrás a la izquierda
    return this.x > cameraX - 250;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const runCycle = Math.sin(this.animTime * 16);
    const armCycle = Math.cos(this.animTime * 16);

    // Sombra suave en el suelo de madera
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 32, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Piernas animadas en sprint hacia la izquierda
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    // Pierna trasera
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-runCycle * 14, 22);
    ctx.lineTo(-runCycle * 14 - 4, 32);
    ctx.stroke();

    // Pierna delantera
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(runCycle * 14, 22);
    ctx.lineTo(runCycle * 14 - 4, 32);
    ctx.stroke();

    // Zapatos marrones
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-runCycle * 14 - 8, 30, 8, 4);
    ctx.fillRect(runCycle * 14 - 8, 30, 8, 4);

    // Torso y vestimenta según variante de la Imagen 2
    if (this.variant === 0) {
      // Mochilero con chaqueta verde oliva y gran mochila a la espalda
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, -8, 12, 20); // Mochila
      ctx.fillStyle = '#92400e';
      ctx.fillRect(6, -6, 8, 16);
      ctx.fillStyle = '#15803d'; // Chaqueta verde
      ctx.fillRect(-8, -10, 16, 22);
      ctx.fillStyle = '#166534';
      ctx.fillRect(-4, -10, 6, 22);
    } else if (this.variant === 1) {
      // Pasajero de traje verde esmeralda y corbata
      ctx.fillStyle = '#065f46'; // Traje verde
      ctx.fillRect(-8, -10, 16, 22);
      ctx.fillStyle = '#f8fafc'; // Camisa blanca
      ctx.fillRect(-6, -10, 5, 10);
      ctx.fillStyle = '#991b1b'; // Corbata roja
      ctx.fillRect(-5, -6, 3, 10);
    } else {
      // Empleado del tren con chaleco oscuro y placa dorada
      ctx.fillStyle = '#1e1b4b'; // Chaleco oscuro
      ctx.fillRect(-8, -10, 16, 22);
      ctx.fillStyle = '#fde047'; // Placa dorada
      ctx.fillRect(-6, -6, 4, 4);
    }

    // Brazos agitándose de pánico al correr
    ctx.strokeStyle = this.variant === 1 ? '#065f46' : '#15803d';
    ctx.lineWidth = 4;
    // Brazo trasero
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(10 + armCycle * 8, -16 - Math.abs(armCycle) * 6);
    ctx.stroke();
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(10 + armCycle * 8, -16 - Math.abs(armCycle) * 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Brazo delantero
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(-12 - armCycle * 10, -18 - Math.abs(armCycle) * 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-12 - armCycle * 10, -18 - Math.abs(armCycle) * 8, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cabeza y rostro asustado mirando hacia la izquierda
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(-2, -22, 9, 0, Math.PI * 2);
    ctx.fill();

    // Cabello / sombrero
    if (this.variant === 2) {
      // Gorra de maquinista/revisor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, -31, 18, 5);
      ctx.fillRect(-9, -35, 14, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-12, -27, 6, 2); // Visera
    } else {
      // Cabello castaño alborotado
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(-1, -26, 9.5, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
    }

    // Ojo blanco asustado con pupila negra
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -24, 4, 5);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-8, -23, 2, 3);

    // Boca abierta gritando
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-8, -18, 4, 4);

    // Gotita de sudor de miedo
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(2, -26 + Math.sin(this.animTime * 8) * 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}


// High-Fidelity Retro-Arcade Canvas Renderer
// Renders the Parallax Night Desert, Cowboy Skeleton, Monsters, Boss, Lasers and FX

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.groundY = 460;

    // Stars generation
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.groundY - 140),
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 3
      });
    }

    // Tumbleweed
    this.tumbleweeds = [
      { x: 1050, y: this.groundY - 14, size: 16, rot: 0, speed: 120 }
    ];

    // Screen Shake
    this.shakeTime = 0;
    this.shakeIntensity = 0;

    // Level 4 Asset Images
    this.imgTrainInside = new Image();
    this.imgTrainInside.src = './assets/level4_train_inside.jpg';

    this.imgSkeleton = new Image();
    this.imgSkeleton.src = './assets/level4_skeleton.jpg';

    this.imgGhostKing = new Image();
    this.imgGhostKing.src = './assets/level4_ghost_king.jpg';

    this.imgBossDefeated = new Image();
    this.imgBossDefeated.src = './assets/level4_boss_defeated.jpg';

    this.imgTrainExterior = new Image();
    this.imgTrainExterior.src = './assets/level4_ghost_train_exterior.png';
  }

  addScreenShake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeTime = duration;
  }

  updateEnvironment(dt, cameraX = 0) {
    // Tumbleweed update relative to camera view
    this.tumbleweeds.forEach(t => {
      t.x -= t.speed * dt;
      t.rot -= 4 * dt;
      if (t.x < cameraX - 100) {
        t.x = cameraX + this.width + 150 + Math.random() * 250;
        t.y = this.groundY - t.size - Math.random() * 8;
      }
    });

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeIntensity = 0;
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  renderScene(game) {
    const ctx = this.ctx;
    ctx.save();

    // Apply Screen Shake if active
    if (this.shakeTime > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(offsetX, offsetY);
    }

    // 1. Draw Background with Parallax
    if (game.level === 4) {
      this.drawInsideTrainBackground(game.time, game.cameraX);
    } else if (game.level === 3) {
      this.drawGhostTrainBackground(game.time, game.cameraX);
    } else {
      this.drawBackground(game.time, game.cameraX);
    }

    // World Space Translation (All game objects follow cameraX)
    ctx.save();
    ctx.translate(-game.cameraX, 0);

    // 2. Draw Ground / Train Environment
    if (game.level === 4) {
      this.drawInsideTrainCar(game.time, game.cameraX, game.player);
    } else if (game.level === 3) {
      this.drawGhostTrainPlatform(game.time, game.cameraX, game.player, game.roofHoleX);
    } else {
      this.drawRuinsAndForeground(game.time, game.cameraX);
      if (game.ghostTrainWaiting) {
        this.drawGhostTrainArrival(game.ghostTrainX, game.time);
      }
    }

    // 3. Draw Pickups
    game.pickups.forEach(p => p.draw(ctx));

    // 3.5. Draw Exit Portal (Level 2 Finale)
    if (game.portal) {
      this.drawPortal(game.portal, game.time);
    }

    // 4. Draw The 3-Eyed Boss (if active, intro or writhing)
    if (game.boss && (game.boss.active || game.boss.state === 'intro' || game.boss.state === 'writhing')) {
      this.drawBoss(game.boss, game.time);
    }

    // 4.5. Draw The Ghost King Boss (Level 4 Boss)
    if (game.ghostKing && (game.ghostKing.alive || game.ghostKing.state === 'defeated')) {
      this.drawGhostKing(game.ghostKing, game.time, game.player);
    }

    // 5. Draw Enemies
    game.enemies.forEach(e => {
      if (e.type === 'cactus') this.drawCactus(e);
      else if (e.type === 'scorpion') this.drawScorpion(e);
      else if (e.type === 'wolf') this.drawWolf(e, game.time);
      else if (e.type === 'flying') this.drawFlyingEnemy(e, game.time);
      else if (e.type === 'witch') this.drawWitch(e, game.time);
      else if (e.type === 'zombie') this.drawZombie(e, game.time);
      else if (e.type === 'skeleton') this.drawGreenFlameSkeleton(e, game.time);
      else if (e.type === 'mini_ghost') this.drawMiniGhost(e, game.time);
    });

    // 5.5. Draw Fleeing Civilians (Nivel 4: Pasajeros huyendo en pánico hacia la izquierda)
    if (game.civilians && game.civilians.length > 0) {
      game.civilians.forEach(c => c.draw(ctx));
    }

    // 6. Draw Player (Undead Skeleton Cowboy)
    if (game.player.hp > 0) {
      this.drawPlayer(game.player, game.time);
    }

    // 7. Draw Projectiles
    game.projectiles.forEach(p => p.draw(ctx));

    // 8. Draw Boss Lasers (Charging & Beam)
    if (game.boss && game.boss.laserFiring) {
      this.drawBossLaserBeam(game.boss);
    } else if (game.boss && game.boss.laserCharging) {
      this.drawBossLaserCharge(game.boss);
    }

    // 9. Draw Particles
    game.particles.forEach(p => p.draw(ctx));

    // 10. Draw Floating Texts
    game.floatingTexts.forEach(ft => ft.draw(ctx));

    ctx.restore(); // Restore world translation

    // 11. Screen Space HUD overlays for Level 4 and Boss warning
    if (game.level === 4) {
      this.drawLevel4HUDOverlay(game);
    }

    // 12. Draw Mouse Aim Reticle Crosshair (Screen Space)
    if (game.mouse && game.mouse.inside && game.state === 'playing') {
      this.drawCrosshair(game.mouse.x, game.mouse.y);
    }

    ctx.restore(); // Restore screen shake
  }

  drawCrosshair(mx, my) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 6;

    // Outer circle
    ctx.beginPath();
    ctx.arc(mx, my, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Center cross ticks
    ctx.beginPath();
    ctx.moveTo(mx - 15, my);
    ctx.lineTo(mx - 4, my);
    ctx.moveTo(mx + 4, my);
    ctx.lineTo(mx + 15, my);
    ctx.moveTo(mx, my - 15);
    ctx.lineTo(mx, my - 4);
    ctx.moveTo(mx, my + 4);
    ctx.lineTo(mx, my + 15);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.arc(mx, my, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PARALLAX DESERT NIGHT BACKGROUND
  // -------------------------------------------------------------
  drawBackground(time, cameraX) {
    const ctx = this.ctx;

    // Sky Gradient (Dark night with deep blue/purple hues)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#04060c');
    skyGrad.addColorStop(0.4, '#090e1c');
    skyGrad.addColorStop(0.7, '#131b2c');
    skyGrad.addColorStop(1, '#1e241c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Twinkling Stars (Parallax slow drift)
    ctx.fillStyle = '#ffffff';
    this.stars.forEach(s => {
      const starScreenX = ((s.x - cameraX * 0.04) % this.width + this.width) % this.width;
      const alpha = 0.35 + 0.65 * Math.sin(time * s.speed + s.twinkle);
      ctx.globalAlpha = Math.max(0.1, alpha);
      ctx.beginPath();
      ctx.arc(starScreenX, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Mystical Moon with Green Spectral Glow (Slow parallax)
    const moonX = ((800 - cameraX * 0.02) % (this.width + 120) + (this.width + 120)) % (this.width + 120) - 40;
    const moonY = 95;
    
    // Moon Green Ethereal Halo
    const haloGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 110);
    haloGrad.addColorStop(0, 'rgba(52, 211, 153, 0.45)');
    haloGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.15)');
    haloGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 110, 0, Math.PI * 2);
    ctx.fill();

    // Moon Body
    ctx.fillStyle = '#f1f5f9';
    ctx.shadowColor = '#6ee7b7';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Moon craters
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY - 8, 7, 0, Math.PI * 2);
    ctx.arc(moonX + 12, moonY + 6, 9, 0, Math.PI * 2);
    ctx.arc(moonX + 2, moonY - 14, 5, 0, Math.PI * 2);
    ctx.fill();

    // Distant Far Dunes Layer (Dark Purple / Black silhouette with parallax)
    const farDuneOffset = (cameraX * 0.12) % this.width;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, this.groundY - 130);
    for (let x = -this.width; x <= this.width * 2; x += 480) {
      const sx = x - farDuneOffset;
      ctx.bezierCurveTo(sx + 120, this.groundY - 210, sx + 360, this.groundY - 90, sx + 480, this.groundY - 140);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.fill();

    // Midground Dunes Layer (Warm dark olive sand with parallax)
    const midDuneOffset = (cameraX * 0.28) % this.width;
    const midDuneGrad = ctx.createLinearGradient(0, this.groundY - 100, 0, this.groundY);
    midDuneGrad.addColorStop(0, '#1c1917');
    midDuneGrad.addColorStop(1, '#292524');
    ctx.fillStyle = midDuneGrad;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY - 80);
    for (let x = -this.width; x <= this.width * 2; x += 400) {
      const sx = x - midDuneOffset;
      ctx.bezierCurveTo(sx + 120, this.groundY - 120, sx + 280, this.groundY - 50, sx + 400, this.groundY - 90);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.fill();
  }

  // -------------------------------------------------------------
  // RUINS, COLUMNS AND FOREGROUND (SCROLLING IN WORLD SPACE)
  // -------------------------------------------------------------
  drawRuinsAndForeground(time, cameraX) {
    const ctx = this.ctx;

    // Draw procedural landmarks along the journey
    const startSeg = Math.floor((cameraX - 300) / 520);
    const endSeg = Math.ceil((cameraX + this.width + 300) / 520);

    for (let seg = startSeg; seg <= endSeg; seg++) {
      const lx = seg * 520 + 160;
      const variant = Math.abs(seg) % 3;

      if (variant === 0) {
        // Ancient Roman/Desert Pillars & Archway
        ctx.fillStyle = '#1e1c19';
        ctx.fillRect(lx, this.groundY - 160, 26, 160);
        ctx.fillRect(lx - 8, this.groundY - 170, 42, 10);
        ctx.fillRect(lx + 60, this.groundY - 110, 24, 110);
        ctx.fillRect(lx + 52, this.groundY - 120, 40, 10);
        ctx.fillRect(lx - 12, this.groundY - 180, 102, 12);
        // Broken stone on ground
        ctx.fillRect(lx + 105, this.groundY - 20, 22, 20);
      } else if (variant === 1) {
        // Dead Gnarled Desert Joshua Tree & Skull Totem
        ctx.fillStyle = '#171512';
        ctx.beginPath();
        ctx.moveTo(lx, this.groundY);
        ctx.lineTo(lx + 10, this.groundY - 140);
        ctx.lineTo(lx + 35, this.groundY - 175);
        ctx.lineTo(lx + 25, this.groundY - 140);
        ctx.lineTo(lx - 20, this.groundY - 165);
        ctx.lineTo(lx + 15, this.groundY);
        ctx.fill();

        // Skull on stake
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(lx + 70, this.groundY - 60, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#374151';
        ctx.fillRect(lx + 68, this.groundY - 50, 4, 50); // Wooden pole
      } else {
        // Ancient Desert Obelisk and Giant Beast Ribs
        ctx.fillStyle = '#211d18';
        // Obelisk
        ctx.beginPath();
        ctx.moveTo(lx - 14, this.groundY);
        ctx.lineTo(lx - 8, this.groundY - 130);
        ctx.lineTo(lx, this.groundY - 150);
        ctx.lineTo(lx + 8, this.groundY - 130);
        ctx.lineTo(lx + 14, this.groundY);
        ctx.closePath();
        ctx.fill();

        // Beast Bone Rib arches
        ctx.strokeStyle = '#473c2c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(lx + 60, this.groundY, 32, Math.PI, 0);
        ctx.arc(lx + 90, this.groundY, 26, Math.PI, 0);
        ctx.stroke();
      }
    }

    // Continuous Desert Ground Plane in World Space
    const groundLeft = cameraX - 100;
    const groundWidth = this.width + 200;
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    groundGrad.addColorStop(0, '#3f3627');
    groundGrad.addColorStop(0.2, '#2d2417');
    groundGrad.addColorStop(1, '#18130b');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(groundLeft, this.groundY, groundWidth, this.height - this.groundY);

    // Ground Edge Sand Highlight
    ctx.strokeStyle = '#5a4931';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(groundLeft, this.groundY);
    ctx.lineTo(groundLeft + groundWidth, this.groundY);
    ctx.stroke();

    // Ground rocks & pebbles repeating in world space
    ctx.fillStyle = '#221a10';
    const rockStart = Math.floor((cameraX - 100) / 180) * 180;
    for (let rx = rockStart; rx <= cameraX + this.width + 100; rx += 180) {
      ctx.fillRect(rx + 25, this.groundY + 12, 18, 8);
      ctx.fillRect(rx + 90, this.groundY + 26, 24, 10);
      ctx.fillRect(rx + 140, this.groundY + 18, 14, 7);
    }

    // Tumbleweeds in World Space
    this.tumbleweeds.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);
      ctx.strokeStyle = '#78562d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, t.size, 0, Math.PI * 2);
      ctx.arc(-4, 3, t.size * 0.7, 0, Math.PI * 2);
      ctx.arc(3, -2, t.size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // -------------------------------------------------------------
  // PLAYER: UNDEAD SKELETON COWBOY (MATCHING USER REFERENCE ART)
  // -------------------------------------------------------------
  drawPlayer(player, time) {
    const ctx = this.ctx;
    ctx.save();

    // Damage Flash or Invulnerability blink
    if (player.invulnTime > 0 && Math.floor(player.invulnTime * 18) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    ctx.translate(player.x, player.y);
    ctx.scale(player.facing, 1);

    const isCrouch = player.isCrouching;
    const bodyOffsetY = isCrouch ? 14 : 0;

    // 1. DANCING GREEN SPECTRAL FLAME AURA (Behind back & skull)
    ctx.save();
    ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 18;
    for (let i = 0; i < 5; i++) {
      const fx = -6 + Math.sin(time * 10 + i * 1.5) * 6;
      const fy = -28 + bodyOffsetY - i * 6;
      const r = 12 - i * 1.8;
      ctx.beginPath();
      ctx.arc(fx, fy, Math.max(3, r), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. TATTERED DUSTER COAT (Back layer)
    ctx.fillStyle = '#3c2a21'; // Weathered brown leather
    ctx.beginPath();
    ctx.moveTo(-16, -10 + bodyOffsetY);
    ctx.lineTo(10, -10 + bodyOffsetY);
    ctx.lineTo(14, 28 + bodyOffsetY);
    // Tattered bottom wave
    const coatFlutter = Math.sin(time * 14) * 6;
    ctx.lineTo(-24 + coatFlutter, 32 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // 3. LEGS & COWBOY BOOTS
    ctx.fillStyle = '#1c1917'; // Dark pants
    ctx.fillRect(-12, 10 + bodyOffsetY, 9, isCrouch ? 12 : 20);
    ctx.fillRect(3, 10 + bodyOffsetY, 9, isCrouch ? 12 : 20);

    // Weathered Leather Boots with spurs
    ctx.fillStyle = '#6e4526';
    ctx.fillRect(-14, (isCrouch ? 20 : 28) + bodyOffsetY, 12, 10);
    ctx.fillRect(2, (isCrouch ? 20 : 28) + bodyOffsetY, 12, 10);
    // Spur glint
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-16, (isCrouch ? 24 : 32) + bodyOffsetY, 3, 3);
    ctx.fillRect(0, (isCrouch ? 24 : 32) + bodyOffsetY, 3, 3);

    // 4. TORSO: Plaid Shirt & Gun Belt
    ctx.fillStyle = '#2d4a3e'; // Greenish weathered plaid
    ctx.fillRect(-10, -14 + bodyOffsetY, 20, 24);

    // Leather Gun Belt with Silver Buckle
    ctx.fillStyle = '#452c1e';
    ctx.fillRect(-11, 4 + bodyOffsetY, 22, 6);
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(-3, 4 + bodyOffsetY, 6, 6); // Silver Buckle

    // 5. SKELETON SKULL & HOOD
    // Dark Hood under the hat
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(0, -24 + bodyOffsetY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Bone Skull
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -24 + bodyOffsetY, 10, 0, Math.PI * 2);
    ctx.fill();

    // Teeth / Jaw
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-4, -16 + bodyOffsetY, 8, 5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-3, -15 + bodyOffsetY, 1, 3);
    ctx.fillRect(-1, -15 + bodyOffsetY, 1, 3);
    ctx.fillRect(1, -15 + bodyOffsetY, 1, 3);

    // GLOWING RED EYE SOCKETS
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -26 + bodyOffsetY, 4, 4);
    ctx.fillRect(2, -26 + bodyOffsetY, 4, 4);
    
    // Crimson eye pinpoints with glow
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 8;
    ctx.fillRect(-5, -25 + bodyOffsetY, 2, 2);
    ctx.fillRect(3, -25 + bodyOffsetY, 2, 2);
    ctx.shadowBlur = 0;

    // 6. COWBOY HAT (Wide brimmed leather hat)
    ctx.fillStyle = '#452b1b';
    // Hat Crown
    ctx.fillRect(-11, -38 + bodyOffsetY, 22, 12);
    ctx.fillStyle = '#2e1c10';
    ctx.fillRect(-11, -30 + bodyOffsetY, 22, 3); // Hat band
    // Hat Brim (Curved)
    ctx.fillStyle = '#452b1b';
    ctx.beginPath();
    ctx.ellipse(0, -28 + bodyOffsetY, 24, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 7. DUAL REVOLVERS & ARMS (Rotating dynamically according to mouse aim)
    const recoil = player.shootCooldown > 0.08 ? -4 : 0;
    const armAngle = player.localAimAngle || 0;

    ctx.save();
    // Shoulder joint pivot point
    ctx.translate(4, -10 + bodyOffsetY);
    ctx.rotate(armAngle);

    // Coat sleeve
    ctx.fillStyle = '#3c2a21';
    ctx.fillRect(-2, -3, 14, 6);

    // Revolver Body (Steel & Wood handle)
    ctx.fillStyle = '#475569';
    ctx.fillRect(12 + recoil, -4, 14, 5); // Barrel
    ctx.fillRect(8 + recoil, 0, 5, 8); // Grip
    
    // Glowing Green Plasma Cylinder
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.fillRect(11 + recoil, -3, 5, 5);
    ctx.shadowBlur = 0;

    // Second gun held slightly behind / dual stance
    ctx.fillStyle = '#334155';
    ctx.fillRect(8 + recoil, 3, 12, 4);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(7 + recoil, 4, 4, 3);

    // Faint ethereal green laser targeting sight line
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(26 + recoil, -1.5);
    ctx.lineTo(95, -1.5);
    ctx.stroke();

    ctx.restore();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // CACTUS ENEMY (MUTANT CACTUS WITH NEEDLES)
  // -------------------------------------------------------------
  drawCactus(cactus) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cactus.x, cactus.y);

    if (cactus.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#15803d';
    }

    // Main cactus trunk
    ctx.beginPath();
    ctx.roundRect(-12, -26, 24, 52, 10);
    ctx.fill();

    // Side Arms
    ctx.beginPath();
    // Left arm
    ctx.roundRect(-22, -12, 10, 6, 2);
    ctx.roundRect(-22, -22, 6, 14, 2);
    // Right arm
    ctx.roundRect(12, -6, 10, 6, 2);
    ctx.roundRect(16, -16, 6, 14, 2);
    ctx.fill();

    // Spines / Needles
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -18); ctx.lineTo(-16, -20);
    ctx.moveTo(-12, 0); ctx.lineTo(-17, 0);
    ctx.moveTo(12, -18); ctx.lineTo(16, -20);
    ctx.moveTo(12, 6); ctx.lineTo(17, 6);
    ctx.stroke();

    // Angry Red Eyes & Maw
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 6;
    ctx.fillRect(-7, -18, 4, 4);
    ctx.fillRect(3, -18, 4, 4);
    ctx.shadowBlur = 0;

    // Open angry mouth
    ctx.fillStyle = '#052e16';
    ctx.fillRect(-5, -8, 10, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -8, 2, 2); // Fangs
    ctx.fillRect(2, -8, 2, 2);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // SCORPION ENEMY (DESERT SCORPION)
  // -------------------------------------------------------------
  drawScorpion(scorp) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(scorp.x, scorp.y);
    ctx.scale(scorp.dir, 1);

    if (scorp.hitFlash > 0) ctx.fillStyle = '#ffffff';
    else ctx.fillStyle = '#78350f'; // Dark chitin brown

    // Body segments
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Segment lines
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Front Pincers
    ctx.fillStyle = '#92400e';
    ctx.fillRect(12, -6, 12, 4);
    ctx.fillRect(12, 4, 12, 4);
    // Claws
    ctx.beginPath();
    ctx.arc(24, -6, 5, 0, Math.PI);
    ctx.arc(24, 6, 5, 0, Math.PI);
    ctx.fill();

    // Curved Tail & Stinger
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(-26, -18, -14, -28);
    ctx.stroke();

    // Glowing Venomous Stinger Tip
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-14, -28);
    ctx.lineTo(-6, -26);
    ctx.lineTo(-12, -34);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Skittering Legs
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, 6);
      ctx.lineTo(i * 6, 15);
      ctx.stroke();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // SPECTRAL GHOST WOLF
  // -------------------------------------------------------------
  drawWolf(wolf, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(wolf.x, wolf.y);
    ctx.scale(wolf.dir, 1);

    ctx.fillStyle = wolf.hitFlash > 0 ? '#ffffff' : 'rgba(56, 189, 248, 0.85)';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wolf Head & Ears
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(26, -2); // Snout
    ctx.lineTo(18, -16); // Ears
    ctx.lineTo(10, -8);
    ctx.closePath();
    ctx.fill();

    // Glowing Eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, -8, 3, 3);

    // Running legs
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    const legPhase = Math.sin(time * 18);
    ctx.beginPath();
    ctx.moveTo(10, 6); ctx.lineTo(14 + legPhase * 8, 18);
    ctx.moveTo(-10, 6); ctx.lineTo(-14 - legPhase * 8, 18);
    ctx.stroke();

    // Ghostly Tail
    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.quadraticCurveTo(-30, -12 + Math.sin(time * 12) * 6, -34, -4);
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // FLYING ENEMY (MONSTRUO VOLADOR / WINGED DEMON EYE)
  // -------------------------------------------------------------
  drawFlyingEnemy(enemy, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    const flap = Math.sin(enemy.sinTimer * 2.5);

    // Bat / Demon Wings
    ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#581c87';
    ctx.beginPath();
    // Left Wing
    ctx.moveTo(-6, -2);
    ctx.lineTo(-24, -14 + flap * 12);
    ctx.lineTo(-16, 6);
    // Right Wing
    ctx.moveTo(6, -2);
    ctx.lineTo(24, -14 + flap * 12);
    ctx.lineTo(16, 6);
    ctx.fill();

    // Eyeball / Core Body
    ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Red pupil
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupil white glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -3, 3, 3);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // LEVEL 2 NEW ENEMY: LA BRUJA VOLADORA EN ESCOBA
  // (Inspirada fielmente en la imagen de referencia pixel-art retro)
  // -------------------------------------------------------------
  drawWitch(witch, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(witch.x, witch.y);
    ctx.scale(witch.dir, 1);

    const bob = Math.sin(witch.floatTimer) * 3;
    const strawSway = Math.sin(time * 8) * 2;
    const flash = witch.hitFlash > 0;

    // 1. Escoba mágica de madera con cerdas de paja
    ctx.save();
    ctx.translate(0, 10 + bob);
    ctx.rotate(-0.08);

    // Palo de la escoba
    ctx.fillStyle = flash ? '#ffffff' : '#78350f';
    ctx.fillRect(-32, -3, 68, 6);
    ctx.fillStyle = flash ? '#ffffff' : '#92400e';
    ctx.fillRect(-32, -2, 68, 2);

    // Punta frontal redondeada
    ctx.beginPath();
    ctx.arc(36, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cuerda/amarre de las cerdas de la escoba
    ctx.fillStyle = flash ? '#ffffff' : '#b45309';
    ctx.fillRect(-36, -5, 6, 10);
    ctx.fillStyle = flash ? '#ffffff' : '#f59e0b';
    ctx.fillRect(-35, -4, 4, 8);

    // Cerdas de paja abiertas
    ctx.fillStyle = flash ? '#ffffff' : '#d97706';
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(-64, -14 + strawSway);
    ctx.lineTo(-68, -4 + strawSway);
    ctx.lineTo(-70, 6 + strawSway);
    ctx.lineTo(-62, 14 + strawSway);
    ctx.closePath();
    ctx.fill();

    // Líneas de textura de paja
    if (!flash) {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-36, -2); ctx.lineTo(-64, -10 + strawSway);
      ctx.moveTo(-36, 0);  ctx.lineTo(-68, 0 + strawSway);
      ctx.moveTo(-36, 2);  ctx.lineTo(-62, 10 + strawSway);
      ctx.stroke();
    }

    // Chispas mágicas saliendo de la cola de la escoba
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 6;
    for (let s = 0; s < 3; s++) {
      const spx = -68 - s * 6 + Math.sin(time * 12 + s) * 4;
      const spy = (s - 1) * 6 + Math.cos(time * 10 + s) * 3;
      ctx.fillRect(spx, spy, 2.5, 2.5);
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // 2. Vestido / Túnica púrpura con parches (idéntico a la imagen)
    ctx.save();
    ctx.translate(0, bob);

    // Cuerpo de la túnica
    ctx.fillStyle = flash ? '#ffffff' : '#581c87';
    ctx.beginPath();
    ctx.ellipse(-4, 6, 20, 16, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Faldón ondeante de la bruja
    ctx.beginPath();
    ctx.moveTo(-18, 4);
    ctx.lineTo(-30, 16);
    ctx.lineTo(-14, 20);
    ctx.lineTo(8, 16);
    ctx.closePath();
    ctx.fill();

    // Parches cosidos en el vestido
    if (!flash) {
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(-12, 4, 8, 8);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1;
      ctx.strokeRect(-12, 4, 8, 8);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-22, 10, 6, 6);
      ctx.strokeStyle = '#7dd3fc';
      ctx.strokeRect(-22, 10, 6, 6);
    }

    // Botas negras de bruja
    ctx.fillStyle = flash ? '#ffffff' : '#18181b';
    ctx.fillRect(-12, 18, 6, 8);
    ctx.fillRect(-14, 23, 10, 4);
    ctx.fillRect(0, 18, 6, 8);
    ctx.fillRect(-2, 23, 10, 4);

    // 3. Cabeza verde y nariz puntiaguda
    ctx.fillStyle = flash ? '#ffffff' : '#16a34a';
    ctx.beginPath();
    ctx.arc(6, -8, 12, 0, Math.PI * 2);
    ctx.fill();

    // Nariz ganchuda de bruja
    ctx.beginPath();
    ctx.moveTo(14, -10);
    ctx.quadraticCurveTo(26, -6, 24, -2);
    ctx.lineTo(14, -4);
    ctx.closePath();
    ctx.fill();

    // Sonrisa pícara de bruja
    ctx.strokeStyle = flash ? '#ffffff' : '#14532d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, -4, 6, 0.2, Math.PI * 0.8);
    ctx.stroke();

    // Ojos penetrantes
    ctx.fillStyle = flash ? '#ffffff' : '#ffffff';
    ctx.beginPath();
    ctx.ellipse(10, -11, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = flash ? '#ffffff' : '#000000';
    ctx.beginPath();
    ctx.arc(11, -11, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. Cabello oscuro bajo el sombrero
    ctx.fillStyle = flash ? '#ffffff' : '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-14, 2);
    ctx.lineTo(-4, 0);
    ctx.lineTo(0, -10);
    ctx.closePath();
    ctx.fill();

    // 5. Mano verde agarrando la escoba
    ctx.fillStyle = flash ? '#ffffff' : '#16a34a';
    ctx.beginPath();
    ctx.arc(14, 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // 6. Sombrero cónico negro con hebilla
    // Ala ancha
    ctx.fillStyle = flash ? '#ffffff' : '#09090b';
    ctx.beginPath();
    ctx.ellipse(4, -16, 24, 6, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Cinta y hebilla dorada
    ctx.fillStyle = flash ? '#ffffff' : '#7c3aed';
    ctx.fillRect(-2, -22, 14, 5);
    ctx.fillStyle = flash ? '#ffffff' : '#facc15';
    ctx.fillRect(2, -23, 6, 7);
    ctx.fillStyle = flash ? '#ffffff' : '#09090b';
    ctx.fillRect(3.5, -21.5, 3, 4);

    // Cono puntiagudo curvado hacia atrás
    ctx.fillStyle = flash ? '#ffffff' : '#09090b';
    ctx.beginPath();
    ctx.moveTo(-4, -20);
    ctx.lineTo(14, -22);
    ctx.quadraticCurveTo(8, -36, -8, -44);
    ctx.quadraticCurveTo(-2, -32, -4, -20);
    ctx.closePath();
    ctx.fill();

    // Destello en la punta del sombrero
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(-8, -44, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
    ctx.restore();
  }

  // -------------------------------------------------------------
  // ZOMBIE ENEMY (RETRO PIXEL ART ZOMBIE INSPIRADO EN LA IMAGEN)
  // -------------------------------------------------------------
  drawZombie(zombie, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(zombie.x, zombie.y);
    ctx.scale(zombie.dir, 1);

    const flash = zombie.hitFlash > 0;
    const walkBob = Math.sin(zombie.animTime * 2) * 2;
    const legSwing = Math.sin(zombie.animTime * 2) * 6;
    const armWave = Math.sin(zombie.animTime * 2 + 1) * 3;

    // 1. PIERNAS Y PANTALONES ANDRAJOSOS (Gris/Marrón rasgado)
    ctx.fillStyle = flash ? '#ffffff' : '#3f443b';
    // Pierna trasera
    ctx.fillRect(-8 - legSwing * 0.5, 12 + walkBob, 7, 18);
    // Pierna delantera
    ctx.fillRect(1 + legSwing * 0.5, 12 + walkBob, 7, 18);

    // Pies descalzos de zombie verde putrefacto
    ctx.fillStyle = flash ? '#ffffff' : '#5d7d3e';
    ctx.fillRect(-9 - legSwing * 0.5, 28 + walkBob, 10, 4);
    ctx.fillRect(0 + legSwing * 0.5, 28 + walkBob, 10, 4);

    // Rodilla expuesta con carne verde pútrida (como en la referencia)
    ctx.fillStyle = flash ? '#ffffff' : '#6b9247';
    ctx.fillRect(3 + legSwing * 0.5, 18 + walkBob, 4, 4);

    // 2. TORSO Y CAMISA ROTA DESGARRADA (Color canela/beige desgastado)
    ctx.fillStyle = flash ? '#ffffff' : '#9c8e74';
    ctx.beginPath();
    ctx.moveTo(-10, -8 + walkBob);
    ctx.lineTo(10, -8 + walkBob);
    ctx.lineTo(12, 14 + walkBob);
    // Borde inferior andrajoso y dentado
    ctx.lineTo(6, 11 + walkBob);
    ctx.lineTo(0, 15 + walkBob);
    ctx.lineTo(-6, 12 + walkBob);
    ctx.lineTo(-11, 14 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Desgarro en el pecho mostrando piel verde
    ctx.fillStyle = flash ? '#ffffff' : '#527335';
    ctx.fillRect(-2, -2 + walkBob, 5, 6);

    // 3. BRAZOS ESTIRADOS HACIA ADELANTE (Pose clásica de zombie)
    // Brazo trasero
    ctx.fillStyle = flash ? '#ffffff' : '#4a682f';
    ctx.fillRect(2, -6 + walkBob + armWave, 18, 5);
    ctx.fillRect(18, -8 + walkBob + armWave, 6, 6);

    // Manga delantera rasgada
    ctx.fillStyle = flash ? '#ffffff' : '#887a62';
    ctx.fillRect(2, -4 + walkBob - armWave, 6, 6);

    // Brazo delantero estirado
    ctx.fillStyle = flash ? '#ffffff' : '#628941';
    ctx.fillRect(6, -4 + walkBob - armWave, 18, 5);
    // Mano verde extendida con garras
    ctx.fillRect(22, -6 + walkBob - armWave, 6, 7);
    ctx.fillStyle = flash ? '#ffffff' : '#2d421a';
    ctx.fillRect(26, -5 + walkBob - armWave, 2, 2);

    // 4. CABEZA DE ZOMBIE (Piel verde podrida, ojos hundidos y cicatrices)
    ctx.fillStyle = flash ? '#ffffff' : '#6b9247';
    ctx.beginPath();
    ctx.roundRect(-9, -28 + walkBob, 18, 20, 4);
    ctx.fill();

    // Mechones de pelo verde oscuro / cicatrices
    ctx.fillStyle = '#2d3e1d';
    ctx.fillRect(-8, -30 + walkBob, 4, 3);
    ctx.fillRect(-2, -31 + walkBob, 5, 4);
    ctx.fillRect(4, -30 + walkBob, 4, 3);

    // Costuras / puntadas en la frente
    ctx.fillStyle = '#1c2813';
    ctx.fillRect(-4, -26 + walkBob, 8, 1.5);
    ctx.fillRect(-2, -28 + walkBob, 1.5, 4);
    ctx.fillRect(2, -28 + walkBob, 1.5, 4);

    // Cuencas oculares oscuras y hundidas
    ctx.fillStyle = '#182410';
    ctx.fillRect(-6, -21 + walkBob, 5, 5);
    ctx.fillRect(2, -21 + walkBob, 5, 5);

    // Pupilas amarillas brillantes con brillo inquietante
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 4;
    ctx.fillRect(-5, -20 + walkBob, 2.5, 2.5);
    ctx.fillRect(3, -20 + walkBob, 2.5, 2.5);
    ctx.shadowBlur = 0;

    // Boca abierta de par en par mostrando dientes
    ctx.fillStyle = '#111827';
    ctx.fillRect(-3, -13 + walkBob, 8, 4);
    // Dientes descuidados
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-2, -14 + walkBob, 2, 2);
    ctx.fillRect(1, -14 + walkBob, 2, 2);
    ctx.fillRect(3, -12 + walkBob, 2, 2);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // LEVEL 2 FINAL DEL CAMINO: PORTAL MÍSTICO DE SALIDA
  // -------------------------------------------------------------
  drawPortal(portal, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(portal.x, portal.y);

    const pulse = Math.sin(time * 3.5) * 4;
    const rot = time * 2.2;

    // 1. Pedestal de runas en el suelo del desierto
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 68, 48, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Columnas gemelas de piedra arcana
    [-38, 38].forEach(px => {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.fillRect(px - 6, -60, 12, 125);
      ctx.strokeRect(px - 6, -60, 12, 125);

      // Cristales de poder sobre las columnas
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(px, -78);
      ctx.lineTo(px - 7, -60);
      ctx.lineTo(px + 7, -60);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Runas luminosas en las columnas
      ctx.fillStyle = '#a5b4fc';
      for (let gy = -40; gy <= 40; gy += 20) {
        ctx.fillRect(px - 2, gy, 4, 8);
      }
    });

    // 3. Resplandor exterior cósmico
    const outerGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 55 + pulse);
    outerGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    outerGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.45)');
    outerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42 + pulse, 68 + pulse * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Anillos concéntricos giratorios del vórtice
    ctx.save();
    ctx.rotate(rot);
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-rot * 1.3);
    ctx.strokeStyle = '#c084fc';
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 5. Núcleo blanco brillante de teletransporte
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 + pulse * 0.5, 24 + pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 6. Cartel flotante sobre el portal
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.font = "bold 10px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('PORTAL DE SALIDA', 0, -90 + Math.sin(time * 3) * 3);
    ctx.fillStyle = '#38bdf8';
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText('▼ ENTRAR ▼', 0, -74 + Math.sin(time * 3) * 3);
    ctx.restore();
  }

  // -------------------------------------------------------------
  // THE DESERT SCOURGE - 3 EYE BOSS (MATCHING USER REFERENCE ART!)
  // -------------------------------------------------------------
  drawBoss(boss, time) {
    const ctx = this.ctx;
    ctx.save();
    const isWrithing = boss.state === 'writhing';
    const wriggleX = isWrithing ? (Math.random() - 0.5) * 14 : 0;
    const wriggleY = isWrithing ? (Math.random() - 0.5) * 12 : 0;
    ctx.translate(boss.x + wriggleX, boss.y + boss.introRise + wriggleY);

    const breath = Math.sin(boss.breathTimer) * (isWrithing ? 8 : 4);

    // 1. MULTIPLE ARTICULATED CLAWED ARMS (3 on left, 3 on right)
    const armConfigs = [
      { side: -1, y: -40, len: 90, idx: 0 },
      { side: -1, y: -10, len: 105, idx: 1 },
      { side: -1, y: 25, len: 95, idx: 2 },
      { side: 1, y: -40, len: 90, idx: 3 },
      { side: 1, y: -10, len: 105, idx: 4 },
      { side: 1, y: 25, len: 95, idx: 5 }
    ];

    armConfigs.forEach(ac => {
      ctx.save();
      const angle = boss.armAngles[ac.idx];
      ctx.strokeStyle = isWrithing 
        ? (Math.random() < 0.35 ? '#34d399' : (Math.random() < 0.5 ? '#10b981' : '#b49673')) 
        : (boss.hitFlash > 0 ? '#ffffff' : '#b49673'); // Sand beige skin or emerald flash
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(ac.side * 50, ac.y);
      const elbowX = ac.side * (50 + ac.len * 0.55);
      const elbowY = ac.y - 20 + Math.sin(angle) * (isWrithing ? 32 : 20);
      const handX = ac.side * (50 + ac.len);
      const handY = ac.y + 10 + Math.cos(angle) * (isWrithing ? 38 : 25);

      ctx.quadraticCurveTo(elbowX, elbowY, handX, handY);
      ctx.stroke();

      // Sharp Monster Claws
      ctx.fillStyle = isWrithing && Math.random() < 0.4 ? '#34d399' : '#451a03';
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.moveTo(handX, handY);
        ctx.lineTo(handX + ac.side * 14, handY + c * 8);
        ctx.lineTo(handX + ac.side * 4, handY + c * 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });

    // 2. MAIN MASSIVE BODY & HEAD (Sandy Beige Demon Titan, or flashing green/white when writhing)
    if (isWrithing) {
      ctx.fillStyle = Math.random() < 0.4 ? '#34d399' : (Math.random() < 0.3 ? '#ffffff' : '#059669');
      ctx.shadowColor = 'rgba(52, 211, 153, 0.9)';
      ctx.shadowBlur = 35;
    } else {
      ctx.fillStyle = boss.hitFlash > 0 ? '#ffffff' : '#d2b48c'; // Tan / Desert monster skin
      ctx.shadowColor = 'rgba(239, 68, 68, 0.35)';
      ctx.shadowBlur = 20;
    }

    // Muscular bulky torso
    ctx.beginPath();
    ctx.ellipse(0, 40 + breath, 75, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Massive Demonic Head
    ctx.beginPath();
    ctx.ellipse(0, -20 + breath * 0.5, 70, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. CURVED DEMONIC HORNS
    ctx.fillStyle = isWrithing && Math.random() < 0.3 ? '#10b981' : '#451a03';
    // Left Horn
    ctx.beginPath();
    ctx.moveTo(-45, -55 + breath * 0.5);
    ctx.quadraticCurveTo(-90, -110, -50, -125);
    ctx.quadraticCurveTo(-65, -90, -30, -65);
    ctx.closePath();
    ctx.fill();

    // Right Horn
    ctx.beginPath();
    ctx.moveTo(45, -55 + breath * 0.5);
    ctx.quadraticCurveTo(90, -110, 50, -125);
    ctx.quadraticCurveTo(65, -90, 30, -65);
    ctx.closePath();
    ctx.fill();

    // 4. OPEN FANGED MAW (Terrifying razor-sharp teeth)
    ctx.fillStyle = isWrithing ? '#022c22' : '#180d0d'; // Deep dark green or black maw interior
    ctx.beginPath();
    ctx.ellipse(0, 10 + breath * 0.5, 42, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Razor Sharp Fangs (Upper and Lower)
    ctx.fillStyle = isWrithing && Math.random() < 0.4 ? '#6ee7b7' : '#fef08a'; // Yellowed or spectral green sharp teeth
    // Upper teeth
    for (let t = -30; t <= 30; t += 10) {
      ctx.beginPath();
      ctx.moveTo(t - 3, -1);
      ctx.lineTo(t, 10);
      ctx.lineTo(t + 3, -1);
      ctx.closePath();
      ctx.fill();
    }
    // Lower teeth
    for (let t = -25; t <= 25; t += 10) {
      ctx.beginPath();
      ctx.moveTo(t - 3, 21);
      ctx.lineTo(t, 11);
      ctx.lineTo(t + 3, 21);
      ctx.closePath();
      ctx.fill();
    }

    // 5. THE 3 GLOWING EYES (Crimson normally, Glowing Emerald Green when writhing)
    // Positions: Left Eye, Center Forehead Eye, Right Eye
    const eyes = [
      { x: -32, y: -26, radius: 13 },
      { x: 0, y: -45, radius: 15 },
      { x: 32, y: -26, radius: 13 }
    ];

    eyes.forEach((eye, index) => {
      // Eye Socket
      ctx.fillStyle = isWrithing ? '#064e3b' : '#450a0a';
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y + breath * 0.5, eye.radius * 1.2, eye.radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Iris (Emerald Green when writhing)
      ctx.fillStyle = isWrithing ? '#34d399' : '#dc2626';
      ctx.shadowColor = isWrithing ? '#10b981' : '#ef4444';
      ctx.shadowBlur = isWrithing ? 30 : 16;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y + breath * 0.5, eye.radius * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // Slit Vertical Demonic Pupil
      ctx.fillStyle = isWrithing ? (Math.random() < 0.3 ? '#fef08a' : '#000000') : '#000000';
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y + breath * 0.5, 2.5, eye.radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Light Glint
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eye.x - 3, eye.y - 4 + breath * 0.5, 3, 3);
      ctx.shadowBlur = 0;
    });

    ctx.restore();
  }

  // -------------------------------------------------------------
  // BOSS EYE LASERS: CHARGING AND FIRING BEAMS
  // -------------------------------------------------------------
  drawBossLaserCharge(boss) {
    const ctx = this.ctx;
    ctx.save();

    const eyes = [
      { x: boss.x - 32, y: boss.y - 26 },
      { x: boss.x, y: boss.y - 45 },
      { x: boss.x + 32, y: boss.y - 26 }
    ];

    eyes.forEach(eye => {
      // Laser targeting lines to ground
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(eye.x, eye.y);
      ctx.lineTo(boss.targetBeamX, this.groundY);
      ctx.stroke();

      // Charging orb around eye
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, 6 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  drawBossLaserBeam(boss) {
    const ctx = this.ctx;
    ctx.save();

    const eyes = [
      { x: boss.x - 32, y: boss.y - 26 },
      { x: boss.x, y: boss.y - 45 },
      { x: boss.x + 32, y: boss.y - 26 }
    ];

    eyes.forEach(eye => {
      // Outer Laser Beam
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 16 + Math.random() * 6;
      ctx.beginPath();
      ctx.moveTo(eye.x, eye.y);
      ctx.lineTo(boss.targetBeamX, this.groundY);
      ctx.stroke();

      // Inner Hot Core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(eye.x, eye.y);
      ctx.lineTo(boss.targetBeamX, this.groundY);
      ctx.stroke();

      // Impact Ground Explosion Flare
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(boss.targetBeamX, this.groundY, 18 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // =============================================================
  // LEVEL 3: GHOST TRAIN ENVIRONMENT & ROOFTOP SURVIVAL
  // =============================================================

  // 1. High-Speed Ghost Train Night Sky & Crimson Evil Moons (MATCHING USER REFERENCE IMAGE 2: ghost_train_red_sky.jpg!)
  drawGhostTrainBackground(time, cameraX) {
    const ctx = this.ctx;

    // Dark Blood-Red Crimson Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#160205');
    skyGrad.addColorStop(0.3, '#3b0712');
    skyGrad.addColorStop(0.65, '#5f0f1d');
    skyGrad.addColorStop(0.9, '#28050c');
    skyGrad.addColorStop(1, '#0e0104');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Fast Parallax Stars with crimson twinkle
    ctx.fillStyle = '#fecdd3';
    this.stars.forEach(s => {
      const starScreenX = ((s.x - cameraX * 0.15) % this.width + this.width) % this.width;
      const alpha = 0.35 + 0.65 * Math.sin(time * s.speed + s.twinkle);
      ctx.globalAlpha = Math.max(0.15, alpha);
      ctx.beginPath();
      ctx.arc(starScreenX, s.y * 0.8, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Fast Moving Heavy Crimson Storm Clouds
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 240 - (cameraX * 0.45 + time * 70)) % (this.width + 220) + (this.width + 220)) % (this.width + 220) - 100;
      const cy = 35 + i * 32;
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(76, 5, 25, 0.55)' : 'rgba(30, 2, 8, 0.65)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 95, 26, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 45, cy - 8, 75, 30, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 35, cy + 4, 60, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // =========================================================================
    // THE TWO DEMONIC CRIMSON SMILING MOONS WITH SHARP TEETH (ghost_train_red_sky.jpg)
    // =========================================================================

    // MOON 1 (LEFT): Blood Red Moon with sinister jagged grin and sharp teeth
    const m1X = ((270 - cameraX * 0.03) % (this.width + 140) + (this.width + 140)) % (this.width + 140) - 70;
    const m1Y = 90;

    // Moon 1 Fiery Crimson Halo
    const m1Halo = ctx.createRadialGradient(m1X, m1Y, 15, m1X, m1Y, 85);
    m1Halo.addColorStop(0, 'rgba(239, 68, 68, 0.65)');
    m1Halo.addColorStop(0.5, 'rgba(185, 28, 28, 0.3)');
    m1Halo.addColorStop(1, 'transparent');
    ctx.fillStyle = m1Halo;
    ctx.beginPath();
    ctx.arc(m1X, m1Y, 85, 0, Math.PI * 2);
    ctx.fill();

    // Moon 1 Crimson Body
    ctx.fillStyle = '#f87171';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(m1X, m1Y, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Moon 1 Dark Evil Slanted Eyes
    ctx.fillStyle = '#1e0207';
    // Left eye (angry triangular slant)
    ctx.beginPath();
    ctx.moveTo(m1X - 22, m1Y - 12);
    ctx.lineTo(m1X - 6, m1Y - 4);
    ctx.lineTo(m1X - 18, m1Y + 3);
    ctx.closePath();
    ctx.fill();

    // Right eye (angry triangular slant)
    ctx.beginPath();
    ctx.moveTo(m1X + 22, m1Y - 12);
    ctx.lineTo(m1X + 6, m1Y - 4);
    ctx.lineTo(m1X + 18, m1Y + 3);
    ctx.closePath();
    ctx.fill();

    // Moon 1 Huge Sinister Grin with Sharp Pointed Teeth
    ctx.fillStyle = '#1e0207';
    ctx.beginPath();
    ctx.arc(m1X, m1Y + 8, 22, 0.08 * Math.PI, 0.92 * Math.PI, false);
    ctx.quadraticCurveTo(m1X, m1Y + 12, m1X + 21, m1Y + 13);
    ctx.fill();

    // Sharp Teeth (White/cream serrated points)
    ctx.fillStyle = '#ffffff';
    // Top row teeth
    for (let tx = -16; tx <= 16; tx += 4) {
      ctx.beginPath();
      ctx.moveTo(m1X + tx - 2, m1Y + 11);
      ctx.lineTo(m1X + tx + 2, m1Y + 11);
      ctx.lineTo(m1X + tx, m1Y + 18);
      ctx.fill();
    }
    // Bottom row teeth
    for (let tx = -14; tx <= 14; tx += 4) {
      const bottomY = m1Y + 8 + Math.sqrt(Math.max(0, 22 * 22 - tx * tx));
      ctx.beginPath();
      ctx.moveTo(m1X + tx - 2, bottomY);
      ctx.lineTo(m1X + tx + 2, bottomY);
      ctx.lineTo(m1X + tx, bottomY - 6);
      ctx.fill();
    }

    // MOON 2 (RIGHT): Larger Demonic Grinning Moon with Evil Eyes
    const m2X = ((780 - cameraX * 0.03) % (this.width + 140) + (this.width + 140)) % (this.width + 140) - 70;
    const m2Y = 95;

    // Moon 2 Fiery Halo
    const m2Halo = ctx.createRadialGradient(m2X, m2Y, 20, m2X, m2Y, 105);
    m2Halo.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
    m2Halo.addColorStop(0.55, 'rgba(153, 27, 27, 0.35)');
    m2Halo.addColorStop(1, 'transparent');
    ctx.fillStyle = m2Halo;
    ctx.beginPath();
    ctx.arc(m2X, m2Y, 105, 0, Math.PI * 2);
    ctx.fill();

    // Moon 2 Crimson Body
    ctx.fillStyle = '#fca5a5';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(m2X, m2Y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Moon 2 Slanted Demonic Eyes
    ctx.fillStyle = '#1e0207';
    ctx.beginPath();
    ctx.moveTo(m2X - 25, m2Y - 14);
    ctx.lineTo(m2X - 8, m2Y - 4);
    ctx.lineTo(m2X - 20, m2Y + 4);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(m2X + 25, m2Y - 14);
    ctx.lineTo(m2X + 8, m2Y - 4);
    ctx.lineTo(m2X + 20, m2Y + 4);
    ctx.closePath();
    ctx.fill();

    // Glowing pupil dots
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(m2X - 17, m2Y - 7, 4, 4);
    ctx.fillRect(m2X + 13, m2Y - 7, 4, 4);

    // Moon 2 Giant Sinister Tooth-Packed Smile
    ctx.fillStyle = '#1e0207';
    ctx.beginPath();
    ctx.arc(m2X, m2Y + 10, 26, 0.08 * Math.PI, 0.92 * Math.PI, false);
    ctx.quadraticCurveTo(m2X, m2Y + 15, m2X + 25, m2Y + 16);
    ctx.fill();

    // Sharp triangular teeth
    ctx.fillStyle = '#ffffff';
    for (let tx = -20; tx <= 20; tx += 4) {
      ctx.beginPath();
      ctx.moveTo(m2X + tx - 2, m2Y + 14);
      ctx.lineTo(m2X + tx + 2, m2Y + 14);
      ctx.lineTo(m2X + tx, m2Y + 22);
      ctx.fill();
    }
    for (let tx = -18; tx <= 18; tx += 4) {
      const bottomY = m2Y + 10 + Math.sqrt(Math.max(0, 26 * 26 - tx * tx));
      ctx.beginPath();
      ctx.moveTo(m2X + tx - 2, bottomY);
      ctx.lineTo(m2X + tx + 2, bottomY);
      ctx.lineTo(m2X + tx, bottomY - 7);
      ctx.fill();
    }

    // Swarms of Bats Flying Across the Blood-Red Sky
    for (let b = 0; b < 8; b++) {
      const batX = ((b * 160 - (cameraX * 0.55 + time * 150 + b * 45)) % (this.width + 200) + (this.width + 200)) % (this.width + 200) - 50;
      const batY = 50 + Math.sin(time * 6 + b) * 24 + (b % 4) * 22;
      const wingFlap = Math.sin(time * 18 + b * 1.5);

      ctx.fillStyle = '#050102';
      ctx.beginPath();
      ctx.arc(batX, batY, 4, 0, Math.PI * 2);
      ctx.fill();
      // Bat wings
      ctx.beginPath();
      ctx.moveTo(batX, batY);
      ctx.quadraticCurveTo(batX - 8, batY - 9 * wingFlap, batX - 16, batY - 2 * wingFlap);
      ctx.quadraticCurveTo(batX - 8, batY + 3, batX, batY);
      ctx.quadraticCurveTo(batX + 8, batY - 9 * wingFlap, batX + 16, batY - 2 * wingFlap);
      ctx.quadraticCurveTo(batX + 8, batY + 3, batX, batY);
      ctx.fill();
    }

    // Distant Crimson-Tinged Mountains (Parallax speed)
    const mtnOffset = (cameraX * 0.25 + time * 50) % this.width;
    ctx.fillStyle = '#1c0409';
    ctx.beginPath();
    ctx.moveTo(0, 320);
    for (let x = -this.width; x <= this.width * 2; x += 320) {
      const mx = x - mtnOffset;
      ctx.lineTo(mx + 80, 190);
      ctx.lineTo(mx + 170, 250);
      ctx.lineTo(mx + 250, 175);
      ctx.lineTo(mx + 320, 320);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.fill();

    // Midground Dark Thorny Dead Trees & Roots Silhouette (Parallax speed)
    const forestOffset = (cameraX * 0.65 + time * 130) % this.width;
    ctx.fillStyle = '#0a0103';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    for (let x = -this.width; x <= this.width * 2; x += 55) {
      const fx = x - forestOffset;
      const th = 45 + (Math.abs(x) % 30);
      ctx.lineTo(fx, 360);
      ctx.lineTo(fx + 14, 360 - th);
      ctx.lineTo(fx + 28, 360);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.fill();

    // Dark Thorny Tendrils under tracks (from ghost_train_red_sky.jpg)
    ctx.strokeStyle = '#2e040c';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const tx = ((i * 180 - cameraX * 0.7) % (this.width + 100) + (this.width + 100)) % (this.width + 100);
      ctx.beginPath();
      ctx.moveTo(tx, 485);
      ctx.quadraticCurveTo(tx + 25, 470, tx + 50, 495);
      ctx.quadraticCurveTo(tx + 75, 520, tx + 100, 485);
      ctx.stroke();
    }
  }

  // 2. SPEEDING GHOST TRAIN PLATFORM & ROOF (Level 3 Rooftop Gameplay)
  drawGhostTrainPlatform(time, cameraX, player, roofHoleX = null) {
    const ctx = this.ctx;
    const roofY = this.groundY; // 350 px
    const trackY = 490;
    const carWidth = 540;

    // Calculate visible carriage segments relative to cameraX
    const startCar = Math.floor((cameraX - 400) / carWidth);
    const endCar = Math.ceil((cameraX + this.width + 400) / carWidth);

    // Speed particles / Wind lines rushing across screen
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
    ctx.lineWidth = 1.5;
    for (let s = 0; s < 12; s++) {
      const sx = ((s * 95 - (time * 650 + s * 40)) % (this.width + 200) + (this.width + 200)) % (this.width + 200) + cameraX - 100;
      const sy = roofY - 140 + (s * 28) % 180;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 45 - (s % 4) * 20, sy);
      ctx.stroke();
    }
    ctx.restore();

    // SURGING ECTOPLASMIC GREEN SMOKE UNDERNEATH THE TRAIN & TRACKS (Image 1 & 2)
    ctx.save();
    const smokeGrad = ctx.createLinearGradient(0, trackY - 20, 0, this.height);
    smokeGrad.addColorStop(0, 'rgba(52, 211, 153, 0.85)');
    smokeGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.65)');
    smokeGrad.addColorStop(0.7, 'rgba(5, 150, 105, 0.35)');
    smokeGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = smokeGrad;

    ctx.beginPath();
    const waveStart = cameraX - 100;
    const waveEnd = cameraX + this.width + 100;
    ctx.moveTo(waveStart, this.height);
    ctx.lineTo(waveStart, trackY);
    for (let x = waveStart; x <= waveEnd; x += 40) {
      const waveY = trackY + Math.sin(time * 8 + x * 0.04) * 12 + Math.cos(time * 5 + x * 0.08) * 8;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(waveEnd, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // RAILWAY TRACK & TIES (Rushing under wheels)
    ctx.save();
    // Ballast track bed
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cameraX - 100, trackY - 4, this.width + 200, 18);

    // Sleepers (wooden railroad ties scrolling fast)
    const tieSpacing = 28;
    const tieStart = Math.floor((cameraX - 100) / tieSpacing) * tieSpacing;
    ctx.fillStyle = '#334155';
    for (let tx = tieStart; tx <= cameraX + this.width + 100; tx += tieSpacing) {
      ctx.fillRect(tx, trackY - 2, 10, 14);
    }

    // Steel Rails with green neon reflection
    ctx.fillStyle = '#94a3b8';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 8;
    ctx.fillRect(cameraX - 100, trackY - 6, this.width + 200, 4);
    ctx.fillRect(cameraX - 100, trackY + 2, this.width + 200, 3);
    ctx.restore();

    // DRAW EACH TRAIN CARRIAGE
    for (let c = startCar; c <= endCar; c++) {
      const carX = c * carWidth;
      const isLeadEngine = (c % 5 === 4); // Every 5 cars has a giant Skull Locomotive!

      if (isLeadEngine) {
        this.drawSkullLocomotive(carX, roofY, trackY, time);
      } else {
        this.drawTrainCarriage(carX, carWidth, roofY, trackY, time, c);
      }
    }

    // WALKABLE TRAIN ROOF SURFACE (y = roofY = 350)
    ctx.save();
    // Solid metal roof top
    const roofGrad = ctx.createLinearGradient(0, roofY - 6, 0, roofY + 8);
    roofGrad.addColorStop(0, '#57534e');
    roofGrad.addColorStop(0.5, '#292524');
    roofGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = roofGrad;
    ctx.fillRect(cameraX - 100, roofY - 4, this.width + 200, 10);

    // Top metal border line
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cameraX - 100, roofY - 4);
    ctx.lineTo(cameraX + this.width + 100, roofY - 4);
    ctx.stroke();

    // Rivets along the roof edge
    ctx.fillStyle = '#a8a29e';
    const rivetStart = Math.floor((cameraX - 100) / 24) * 24;
    for (let rx = rivetStart; rx <= cameraX + this.width + 100; rx += 24) {
      ctx.beginPath();
      ctx.arc(rx, roofY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Agujero en el techo hecho por una pequeña explosión (Fin Nivel 3 -> Desbloqueo Nivel 4)
    if (roofHoleX !== null && roofHoleX !== undefined) {
      const holeW = 88;
      const bounce = Math.sin(time * 6) * 4;

      ctx.save();
      // Resplandor ectoplásmico verde saliendo desde el interior del tren
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 28 + Math.sin(time * 8) * 8;
      ctx.fillStyle = '#022c22';
      ctx.fillRect(roofHoleX - holeW * 0.5, roofY - 7, holeW, 16);

      // Núcleo verde esmeralda brillante del interior
      ctx.fillStyle = '#10b981';
      ctx.fillRect(roofHoleX - holeW * 0.38, roofY - 4, holeW * 0.76, 11);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(roofHoleX - holeW * 0.22, roofY - 2, holeW * 0.44, 7);

      // Bordes de metal quemados, rotos y rasgados por la detonación
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(roofHoleX - holeW * 0.5 - 8, roofY - 10, 10, 18);
      ctx.fillRect(roofHoleX + holeW * 0.5 - 2, roofY - 10, 10, 18);

      // Humo / Llamaradas verdes ondulantes que emergen del agujero
      for (let f = 0; f < 5; f++) {
        const fx = roofHoleX - 28 + f * 14;
        const fy = roofY - 4 - ((time * 36 + f * 10) % 22);
        const fSize = 3.5 + (f % 3) * 1.5;
        ctx.fillStyle = f % 2 === 0 ? 'rgba(52, 211, 153, 0.65)' : 'rgba(16, 185, 129, 0.45)';
        ctx.beginPath();
        ctx.arc(fx + Math.sin(time * 5 + f) * 5, fy, fSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Indicador luminoso animado de entrada (flecha y texto retro)
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 12;
      ctx.font = "bold 9.5px 'Press Start 2P', monospace";
      ctx.fillText("▼ ¡ENTRA AQUÍ! ▼", roofHoleX - 64, roofY - 24 + bounce);
      ctx.fillStyle = '#6ee7b7';
      ctx.font = "bold 8px 'Press Start 2P', monospace";
      ctx.fillText("👑 DESBLOQUEO NIVEL 4", roofHoleX - 68, roofY - 11 + bounce);
      ctx.restore();
    }
    ctx.restore();
  }

  // Draw Individual Train Carriage (Matching Image 1 & 2!)
  drawTrainCarriage(carX, carWidth, roofY, trackY, time, carIndex) {
    const ctx = this.ctx;
    const bodyHeight = trackY - roofY; // 140 px
    const w = carWidth - 28; // Leave coupler gap

    ctx.save();
    // 1. Carriage Metal Body (Weathered rusted brown/charcoal)
    const bodyGrad = ctx.createLinearGradient(0, roofY, 0, trackY);
    bodyGrad.addColorStop(0, '#44403c');
    bodyGrad.addColorStop(0.5, '#292524');
    bodyGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(carX, roofY, w, bodyHeight);

    // Weathered Rust Patches
    ctx.fillStyle = '#78350f';
    ctx.fillRect(carX + 40, roofY + 20, 60, 35);
    ctx.fillRect(carX + 180, roofY + 50, 75, 45);
    ctx.fillRect(carX + 340, roofY + 15, 80, 40);

    // Metal Vertical Panel Seams & Rivets
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    for (let px = carX + 80; px < carX + w; px += 80) {
      ctx.beginPath();
      ctx.moveTo(px, roofY);
      ctx.lineTo(px, trackY);
      ctx.stroke();
    }

    // 2. Carriage Windows (With Glowing Pumpkins & Ghostly Passengers!)
    const numWindows = 4;
    const winWidth = 48;
    const winHeight = 52;
    const winY = roofY + 28;

    for (let win = 0; win < numWindows; win++) {
      const winX = carX + 50 + win * 105;

      // Window Frame
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(winX, winY, winWidth, winHeight);
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 3;
      ctx.strokeRect(winX, winY, winWidth, winHeight);

      // Window Glow (Glowing Jack-o'-lantern orange or ghostly teal)
      const isPumpkin = (win % 2 === 0);
      if (isPumpkin) {
        // Glowing Jack-o'-lantern Pumpkin in window!
        ctx.fillStyle = '#ea580c';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(winX + winWidth * 0.5, winY + winHeight * 0.65, 14, 0, Math.PI * 2);
        ctx.fill();

        // Pumpkin Face
        ctx.fillStyle = '#451a03';
        ctx.shadowBlur = 0;
        // Eyes
        ctx.fillRect(winX + winWidth * 0.5 - 6, winY + winHeight * 0.6, 4, 3);
        ctx.fillRect(winX + winWidth * 0.5 + 2, winY + winHeight * 0.6, 4, 3);
        // Tooth smile
        ctx.fillRect(winX + winWidth * 0.5 - 5, winY + winHeight * 0.72, 10, 3);
      } else {
        // Ghostly glowing creature silhouette
        ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.fillRect(winX + 4, winY + 4, winWidth - 8, winHeight - 8);

        // Creature purple or teal face
        ctx.fillStyle = win === 1 ? '#c084fc' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(winX + winWidth * 0.5, winY + winHeight * 0.6, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(winX + winWidth * 0.5 - 4, winY + winHeight * 0.56, 3, 3);
        ctx.fillRect(winX + winWidth * 0.5 + 2, winY + winHeight * 0.56, 3, 3);
      }
      ctx.shadowBlur = 0;

      // Spider Web in upper corner (Image 1 reference!)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(winX, winY);
      ctx.lineTo(winX + 16, winY + 16);
      ctx.moveTo(winX + 6, winY);
      ctx.lineTo(winX, winY + 12);
      ctx.stroke();
    }

    // 3. Train Under-Carriage Wheels (Spinning at speed!)
    const wheelY = trackY - 14;
    const wheelRadius = 22;
    const wheelPositions = [carX + 60, carX + 125, carX + w - 125, carX + w - 60];

    wheelPositions.forEach(wx => {
      // Wheel rim
      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = '#57534e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(wx, wheelY, wheelRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spinning spokes
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 2;
      const rot = time * 24;
      for (let a = 0; a < 4; a++) {
        const ang = rot + a * (Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(wx, wheelY);
        ctx.lineTo(wx + Math.cos(ang) * wheelRadius, wheelY + Math.sin(ang) * wheelRadius);
        ctx.stroke();
      }

      // Wheel hub
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.arc(wx, wheelY, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Heavy Coupler Between Carriages
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(carX + w, roofY + 60, 28, 20);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(carX + w, roofY + 70);
    ctx.lineTo(carX + w + 28, roofY + 70);
    ctx.stroke();

    // 5. Boarding Steps at the back of each carriage
    ctx.fillStyle = '#292524';
    ctx.fillRect(carX + 4, trackY - 30, 22, 28);
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2;
    ctx.strokeRect(carX + 4, trackY - 30, 22, 28);

    ctx.restore();
  }

  // Draw Giant Skull Locomotive (Lead Engine at Head of Convoy)
  drawSkullLocomotive(carX, roofY, trackY, time) {
    const ctx = this.ctx;
    const w = 500;
    const bodyHeight = trackY - roofY;

    ctx.save();
    // Boiler body
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(carX, roofY + 20, w, bodyHeight - 20);

    // Cab at rear of engine
    ctx.fillStyle = '#292524';
    ctx.fillRect(carX, roofY, 140, bodyHeight);
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 3;
    ctx.strokeRect(carX, roofY, 140, bodyHeight);

    // Smokestack with Ethereal Green Smoke billowing backwards
    const stackX = carX + 380;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(stackX, roofY - 45, 34, 65);
    ctx.fillRect(stackX - 6, roofY - 52, 46, 12);

    // Puffs of dense green ectoplasmic smoke rushing backwards!
    ctx.save();
    for (let p = 0; p < 8; p++) {
      const smokeAge = (time * 8 + p) % 8;
      const sx = stackX - smokeAge * 60;
      const sy = roofY - 40 - Math.sin(smokeAge * 0.8) * 35;
      const sRadius = 14 + smokeAge * 8;
      const alpha = Math.max(0, 1 - smokeAge / 8);

      const sGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sRadius);
      sGrad.addColorStop(0, `rgba(110, 231, 183, ${alpha * 0.75})`);
      sGrad.addColorStop(0.5, `rgba(16, 185, 129, ${alpha * 0.45})`);
      sGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // GIANT SKULL ON FRONT OF BOILER (Matching Image 1 & 2!)
    const skullX = carX + w - 40;
    const skullY = roofY + 70;
    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 15;

    // Skull Dome
    ctx.beginPath();
    ctx.arc(skullX, skullY, 38, 0, Math.PI * 2);
    ctx.fill();

    // Skull Jaw & Teeth
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(skullX - 22, skullY + 22, 44, 30);

    // Screaming Hollow Eye Sockets with GREEN FIRE
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(skullX - 14, skullY - 4, 11, 0, Math.PI * 2);
    ctx.arc(skullX + 14, skullY - 4, 11, 0, Math.PI * 2);
    ctx.fill();

    // Fire in eyes
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    const fireFlicker = Math.sin(time * 15) * 2;
    ctx.beginPath();
    ctx.arc(skullX - 14, skullY - 4, 5 + fireFlicker, 0, Math.PI * 2);
    ctx.arc(skullX + 14, skullY - 4, 5 + fireFlicker, 0, Math.PI * 2);
    ctx.fill();

    // Screaming Open Mouth with teeth
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(skullX, skullY + 36, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (let t = -10; t <= 10; t += 5) {
      ctx.fillRect(skullX + t, skullY + 26, 3, 5);
      ctx.fillRect(skullX + t, skullY + 41, 3, 5);
    }
    ctx.restore();

    // Cowcatcher / Pilot on front track
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(carX + w - 20, trackY - 6);
    ctx.lineTo(carX + w + 50, trackY - 6);
    ctx.lineTo(carX + w + 10, roofY + 90);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.stroke();

    // Locomotive Wheels (Large driving wheels)
    const bigWheelRadius = 32;
    const bigWheelPositions = [carX + 180, carX + 260, carX + 340];
    bigWheelPositions.forEach(bx => {
      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(bx, trackY - 14, bigWheelRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Connecting drive rod
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      const ang = time * 20;
      const pinX = bx + Math.cos(ang) * 16;
      const pinY = trackY - 14 + Math.sin(ang) * 16;
      ctx.beginPath();
      ctx.arc(pinX, pinY, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // 3. GHOST TRAIN ARRIVAL (In Level 2 Victory Cutscene on Ground)
  drawGhostTrainArrival(trainX, time) {
    const ctx = this.ctx;
    const roofY = this.groundY - 110;
    const trackY = this.groundY;

    ctx.save();
    // Spectral fog rolling on ground
    const fogGrad = ctx.createLinearGradient(0, trackY - 30, 0, trackY + 20);
    fogGrad.addColorStop(0, 'rgba(52, 211, 153, 0.7)');
    fogGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(trainX - 60, trackY - 30, 800, 50);

    // Draw waiting passenger carriage with boarding steps
    this.drawTrainCarriage(trainX, 500, roofY, trackY, time, 0);

    // Boarding stairs highlight
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.font = "bold 10px 'Press Start 2P', monospace";
    ctx.fillText("▲ SUBIR AQUÍ", trainX + 18, roofY - 15);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // LEVEL 4: INTERIOR DEL TREN FANTASMA (IMAGEN 2 - CÍRCULO ROJO)
  // "el ambiente sea como los que esta en la 2 imagen pero solo lo que esta
  // en circulo rojo, lo que esta fuera del circulo solo se vea en ventana"
  // -------------------------------------------------------------
  drawInsideTrainBackground(time, cameraX) {
    const ctx = this.ctx;

    // 1. Cielo nocturno y bosque maldito exterior (visto a través de las ventanas)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#010905');
    skyGrad.addColorStop(0.45, '#041f12');
    skyGrad.addColorStop(1, '#020b06');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Ruinas góticas lejanas en silueta (Parallax suave)
    ctx.save();
    ctx.fillStyle = 'rgba(6, 44, 28, 0.6)';
    const ruinOffset = (cameraX * 0.12) % 360;
    for (let rx = -360; rx <= this.width + 360; rx += 360) {
      const bx = rx - ruinOffset;
      ctx.fillRect(bx + 40, 150, 45, 90);
      ctx.fillRect(bx + 110, 130, 60, 110);
      ctx.fillRect(bx + 140, 105, 20, 25); // Aguja / Torreón
      ctx.fillRect(bx + 200, 160, 80, 80);
    }
    ctx.restore();

    // Siluetas de árboles tenebrosos y ramas retorcidas (Parallax medio)
    ctx.save();
    ctx.fillStyle = 'rgba(2, 22, 14, 0.9)';
    const treeOffset = (cameraX * 0.42) % 240;
    for (let tx = -240; tx <= this.width + 240; tx += 240) {
      const bx = tx - treeOffset;
      // Troncos y ramas nudosas
      ctx.fillRect(bx + 30, 130, 22, 170);
      ctx.beginPath();
      ctx.moveTo(bx + 40, 150);
      ctx.lineTo(bx + 5, 115);
      ctx.lineTo(bx + 15, 110);
      ctx.lineTo(bx + 42, 140);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx + 45, 160);
      ctx.lineTo(bx + 85, 120);
      ctx.lineTo(bx + 75, 115);
      ctx.lineTo(bx + 43, 150);
      ctx.fill();

      // Segundo árbol
      ctx.fillRect(bx + 160, 140, 18, 160);
    }
    ctx.restore();

    // Abismo / Barranco con niebla verde brillante bajo el nivel de las ventanas
    ctx.save();
    const mistGrad = ctx.createLinearGradient(0, 260, 0, this.height);
    mistGrad.addColorStop(0, 'rgba(52, 211, 153, 0.45)');
    mistGrad.addColorStop(0.3, 'rgba(16, 185, 129, 0.25)');
    mistGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 250, this.width, 150);

    // Rayas de velocidad del tren a toda marcha por el exterior
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
    ctx.lineWidth = 1.5;
    for (let s = 0; s < 8; s++) {
      const sx = ((s * 130 - time * 950) % (this.width + 300) + (this.width + 300)) % (this.width + 300) - 100;
      const sy = 160 + (s * 24) % 110;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 70 - (s % 3) * 25, sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // VAGONES INTERIORES: LOS 5 COMPARTIMENTOS DE LA IMAGEN 2 (CÍRCULO ROJO)
  // -------------------------------------------------------------
  drawInsideTrainCar(time, cameraX, player) {
    const ctx = this.ctx;
    const floorY = this.groundY; // 460 px
    const compW = 540; // Ancho de cada compartimento temático

    ctx.save();

    // 1. Suelo de madera maciza con tablones y remaches
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, this.height);
    floorGrad.addColorStop(0, '#241a10');
    floorGrad.addColorStop(0.3, '#171109');
    floorGrad.addColorStop(1, '#090603');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(cameraX - 100, floorY, this.width + 200, this.height - floorY);

    // Líneas de unión de tablones en el piso
    ctx.strokeStyle = '#0f0a05';
    ctx.lineWidth = 2;
    for (let py = floorY + 12; py < this.height; py += 16) {
      ctx.beginPath();
      ctx.moveTo(cameraX - 100, py);
      ctx.lineTo(cameraX + this.width + 100, py);
      ctx.stroke();
    }

    // Clavos de hierro en el suelo
    ctx.fillStyle = '#3f1d0b';
    const nailStart = Math.floor((cameraX - 100) / 45) * 45;
    for (let nx = nailStart; nx <= cameraX + this.width + 100; nx += 45) {
      ctx.fillRect(nx, floorY + 4, 3, 2);
      ctx.fillRect(nx + 18, floorY + 20, 3, 2);
    }

    // 2. Renderizar los 5 Compartimentos Temáticos de la Imagen 2
    const startComp = Math.floor((cameraX - 250) / compW);
    const endComp = Math.ceil((cameraX + this.width + 250) / compW);

    for (let s = startComp; s <= endComp; s++) {
      const compX = s * compW;
      const compIndex = ((s % 5) + 5) % 5; // 0, 1, 2, 3, 4

      // A. ESTRUCTURA DEL VAGÓN: PAREDES Y VENTANAS
      // Techo arqueado superior
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(compX, 0, compW, 115);
      ctx.fillStyle = '#292524';
      ctx.fillRect(compX, 115, compW, 14);

      // Pared sólida debajo de las ventanas (de y=295 a floorY=460)
      ctx.fillStyle = compIndex === 0 ? '#1f152d' : (compIndex === 4 ? '#1e293b' : '#221c17');
      ctx.fillRect(compX, 295, compW, floorY - 295);

      // Moldura y zócalo inferior
      ctx.fillStyle = '#140f0c';
      ctx.fillRect(compX, 295, compW, 8);
      ctx.fillRect(compX, floorY - 14, compW, 14);

      // Pilares de separación entre vagones
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(compX, 0, 24, floorY);
      ctx.fillRect(compX + compW - 24, 0, 24, floorY);
      ctx.fillStyle = '#334155';
      ctx.fillRect(compX + 8, 0, 8, floorY);
      ctx.fillRect(compX + compW - 16, 0, 8, floorY);

      // MARCO DE VENTANAS (El exterior se ve a través del hueco abierto)
      if (compIndex !== 2) {
        // En compartimentos 0, 1, 3, 4: dos grandes ventanas con marcos
        const winW = 160;
        const winH = 150;
        const winY = 135;
        const win1X = compX + 50;
        const win2X = compX + 280;

        // Pared central entre las 2 ventanas
        ctx.fillStyle = compIndex === 0 ? '#261838' : (compIndex === 4 ? '#1e293b' : '#29211b');
        ctx.fillRect(win1X + winW, 125, win2X - (win1X + winW), 170);

        // Marcos exteriores de madera/metal oscuro con remaches
        ctx.strokeStyle = '#110c08';
        ctx.lineWidth = 8;
        ctx.strokeRect(win1X, winY, winW, winH);
        ctx.strokeRect(win2X, winY, winW, winH);

        // Parteluz / Cruz de madera en las ventanas
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Ventana 1
        ctx.moveTo(win1X + winW * 0.5, winY);
        ctx.lineTo(win1X + winW * 0.5, winY + winH);
        ctx.moveTo(win1X, winY + winH * 0.45);
        ctx.lineTo(win1X + winW, winY + winH * 0.45);
        // Ventana 2
        ctx.moveTo(win2X + winW * 0.5, winY);
        ctx.lineTo(win2X + winW * 0.5, winY + winH);
        ctx.moveTo(win2X, winY + winH * 0.45);
        ctx.lineTo(win2X + winW, winY + winH * 0.45);
        ctx.stroke();

        // Reflejo espectral verde en los cristales
        ctx.fillStyle = 'rgba(52, 211, 153, 0.08)';
        ctx.fillRect(win1X + 4, winY + 4, winW - 8, winH - 8);
        ctx.fillRect(win2X + 4, winY + 4, winW - 8, winH - 8);
      }

      // =========================================================
      // B. ELEMENTOS ESPECÍFICOS DE CADA COMPARTIMENTO (IMAGEN 2)
      // =========================================================

      // ---------------------------------------------------------
      // COMPARTIMENTO 0: TAQUILLA / SALÓN PÚRPURA (Círculo Rojo - Izquierda)
      // Mostrador, lámpara púrpura, sillas y huesos
      // ---------------------------------------------------------
      if (compIndex === 0) {
        // Resplandor púrpura en el fondo
        ctx.save();
        ctx.fillStyle = 'rgba(107, 33, 168, 0.26)';
        ctx.fillRect(compX + 24, 125, compW - 48, floorY - 125);

        // Mostrador de madera de servicio / Taquilla a la izquierda
        const deskX = compX + 32;
        const deskY = floorY - 110;
        ctx.fillStyle = '#451a03';
        ctx.fillRect(deskX, deskY, 115, 110);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(deskX - 4, deskY, 123, 12); // Tapa mostrador
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(deskX + 95, deskY - 55, 16, 55); // Marco taquilla

        // Caja registradora / Lámpara de escritorio
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(deskX + 20, deskY - 18, 22, 18);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(deskX + 24, deskY - 24, 14, 6);

        // Silueta del encargado / pasajero dentro de la taquilla
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(deskX + 55, deskY - 32, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(deskX + 40, deskY - 18, 30, 20);
        // Ojos brillantes asustados
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(deskX + 48, deskY - 34, 4, 4);
        ctx.fillRect(deskX + 57, deskY - 34, 4, 4);

        // Llama / Alma colgante púrpura brillante (Imagen 2)
        const lampX = compX + 210;
        const lampY = 165 + Math.sin(time * 3) * 6;
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lampX, 115);
        ctx.lineTo(lampX, lampY - 16);
        ctx.stroke();

        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.ellipse(lampX, lampY, 11, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f3e8ff';
        ctx.beginPath();
        ctx.ellipse(lampX, lampY, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dos sillas antiguas de terciopelo morado
        for (let ch = 0; ch < 2; ch++) {
          const cx = compX + 310 + ch * 95;
          const cy = floorY - 70;
          ctx.fillStyle = '#451a03';
          ctx.fillRect(cx, cy, 38, 70); // Patas y marco
          ctx.fillStyle = '#581c87'; // Respaldo morado
          ctx.fillRect(cx + 4, cy + 4, 30, 36);
          ctx.fillStyle = '#7e22ce'; // Asiento
          ctx.fillRect(cx - 3, cy + 40, 44, 10);
        }

        // Huesos y calavera en el suelo
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(compX + 270, floorY - 8, 22, 6); // Hueso
        ctx.fillRect(compX + 430, floorY - 14, 14, 12); // Calavera
        ctx.restore();
      }

      // ---------------------------------------------------------
      // COMPARTIMENTO 1: SALA DE ESTAR Y REPISA DE CALAVERAS (Círculo Rojo - 2do)
      // Sofá cómodo, repisa superior con 4 calaveras, fantasmas y ojos
      // ---------------------------------------------------------
      else if (compIndex === 1) {
        ctx.save();
        // Repisa superior de madera con hilera de calaveras humanas (Imagen 2)
        const shelfX = compX + 130;
        const shelfY = 165;
        ctx.fillStyle = '#451a03';
        ctx.fillRect(shelfX, shelfY, 210, 8);
        ctx.fillStyle = '#291305';
        ctx.fillRect(shelfX + 15, shelfY + 8, 14, 12); // Soportes
        ctx.fillRect(shelfX + 180, shelfY + 8, 14, 12);

        // 4 Calaveras humanas sobre la repisa
        for (let k = 0; k < 4; k++) {
          const kx = shelfX + 25 + k * 48;
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(kx, shelfY - 10, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(kx - 5, shelfY - 6, 10, 6);
          // Ojos negros huecos
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(kx - 4, shelfY - 11, 3, 3);
          ctx.fillRect(kx + 1, shelfY - 11, 3, 3);
        }

        // Sofá / Sillón marrón acolchado (Imagen 2)
        const sofaX = compX + 180;
        const sofaY = floorY - 75;
        ctx.fillStyle = '#3f1d0b';
        ctx.fillRect(sofaX, sofaY, 110, 50); // Respaldo
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.strokeRect(sofaX, sofaY, 110, 50);
        ctx.fillStyle = '#5c2207';
        ctx.fillRect(sofaX - 8, sofaY + 45, 126, 18); // Cojín
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(sofaX, sofaY + 63, 8, 12); // Patas
        ctx.fillRect(sofaX + 102, sofaY + 63, 8, 12);

        // Mesita de noche con libro y candelabro
        const tableX = compX + 340;
        ctx.fillStyle = '#451a03';
        ctx.fillRect(tableX, floorY - 50, 60, 50);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tableX - 4, floorY - 54, 68, 6);
        // Libros y vela
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(tableX + 10, floorY - 62, 22, 8);
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 10;
        ctx.fillRect(tableX + 40, floorY - 72, 4, 16);
        ctx.shadowBlur = 0;

        // Fantasma pequeño verde flotando en el salón (Imagen 2)
        const ghostX = compX + 310;
        const ghostY = 220 + Math.sin(time * 4) * 8;
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(ghostX, ghostY, 10, Math.PI, 0);
        ctx.lineTo(ghostX + 10, ghostY + 14);
        ctx.lineTo(ghostX + 5, ghostY + 10);
        ctx.lineTo(ghostX, ghostY + 14);
        ctx.lineTo(ghostX - 5, ghostY + 10);
        ctx.lineTo(ghostX - 10, ghostY + 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(ghostX - 6, ghostY + 1, 3, 3);
        ctx.fillRect(ghostX + 2, ghostY + 1, 3, 3);
        ctx.shadowBlur = 0;

        // Ojos amarillos y rojos acechando en las sombras oscuras
        ctx.fillStyle = '#facc15';
        ctx.fillRect(compX + 80, 210, 4, 3);
        ctx.fillRect(compX + 88, 210, 4, 3);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(compX + 440, floorY - 24, 3, 3);
        ctx.fillRect(compX + 446, floorY - 24, 3, 3);
        ctx.restore();
      }

      // ---------------------------------------------------------
      // COMPARTIMENTO 2: PASILLO CENTRAL DE PUERTAS INFINITAS (Círculo Rojo - Centro)
      // Arco metálico, perspectiva infinita de puertas hacia el fondo y runas
      // ---------------------------------------------------------
      else if (compIndex === 2) {
        ctx.save();
        // Pared de acero oscuro
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(compX, 115, compW, floorY - 115);

        // Gran marco de portal arqueado
        const doorW = 200;
        const doorH = 310;
        const doorX = compX + (compW - doorW) * 0.5;
        const doorY = floorY - doorH;

        // Borde exterior remachado
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(doorX - 16, doorY - 16, doorW + 32, doorH + 16);
        ctx.fillStyle = '#334155';
        ctx.fillRect(doorX - 8, doorY - 8, doorW + 16, doorH + 8);

        // Runas místicas verdes brillantes en las jambas de la puerta
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.font = "bold 14px monospace";
        ctx.fillText("᚛", doorX - 6, doorY + 60);
        ctx.fillText("ᚚ", doorX - 6, doorY + 120);
        ctx.fillText("ᚦ", doorX - 6, doorY + 180);
        ctx.fillText("᚜", doorX + doorW - 4, doorY + 60);
        ctx.fillText("ᛏ", doorX + doorW - 4, doorY + 120);
        ctx.fillText("ᚫ", doorX + doorW - 4, doorY + 180);
        ctx.shadowBlur = 0;

        // PERSPECTIVA INFINITA DE PUERTAS (Efecto túnel profundo de la Imagen 2)
        const layers = 5;
        for (let l = 0; l < layers; l++) {
          const factor = l / layers;
          const lw = doorW * (1 - factor * 0.75);
          const lh = doorH * (1 - factor * 0.75);
          const lx = doorX + (doorW - lw) * 0.5;
          const ly = floorY - lh;

          // Color del túnel más oscuro hacia el centro
          ctx.fillStyle = l === layers - 1 ? '#022c22' : (l % 2 === 0 ? '#064e3b' : '#031f16');
          ctx.fillRect(lx, ly, lw, lh);

          // Línea de luz verde en el marco de cada puerta
          ctx.strokeStyle = l === layers - 1 ? '#6ee7b7' : '#10b981';
          ctx.lineWidth = 2;
          ctx.strokeRect(lx, ly, lw, lh);
        }

        // Calavera y fémur en el umbral de entrada
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(doorX + 30, floorY - 14, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(doorX + 50, floorY - 8, 26, 5);
        ctx.restore();
      }

      // ---------------------------------------------------------
      // COMPARTIMENTO 3: CÁMARA OCULTISTA DE ECTOPLASMA Y JAULAS (Círculo Rojo - 4to)
      // Remolino de ectoplasma turquesa, jaulas colgando del techo, pila de calaveras
      // ---------------------------------------------------------
      else if (compIndex === 3) {
        ctx.save();
        // GRAN PILAR DE ECTOPLASMA ARREMOLLINADO (Imagen 2)
        const vortexX = compX + 280;
        const swirlPulse = Math.sin(time * 6) * 15;

        // Resplandor exterior
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 32;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        ctx.ellipse(vortexX, (floorY + 130) * 0.5, 45 + Math.abs(swirlPulse) * 0.5, 140, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cintas ondulantes de energía ectoplásmica verde/cian
        for (let c = 0; c < 4; c++) {
          const cyY = 140 + c * 75;
          const waveX = vortexX + Math.sin(time * 5 + c * 1.5) * 28;
          ctx.strokeStyle = c % 2 === 0 ? '#22d3ee' : '#34d399';
          ctx.lineWidth = 6 + (c % 2) * 3;
          ctx.beginPath();
          ctx.moveTo(vortexX - 15, cyY);
          ctx.bezierCurveTo(waveX + 30, cyY + 25, waveX - 30, cyY + 50, vortexX, cyY + 75);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // JAULAS DE HIERRO COLGANDO DEL TECHO (Imagen 2)
        for (let j = 0; j < 2; j++) {
          const jx = compX + 220 + j * 120;
          const jy = 195 + Math.sin(time * 2.5 + j) * 4;
          // Cadena
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(jx, 115);
          ctx.lineTo(jx, jy - 22);
          ctx.stroke();
          // Cúpula jaula
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(jx, jy - 22, 16, Math.PI, 0);
          ctx.fill();
          // Barrotes de hierro
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          for (let b = -14; b <= 14; b += 7) {
            ctx.beginPath();
            ctx.moveTo(jx + b, jy - 22);
            ctx.lineTo(jx + b, jy + 18);
            ctx.stroke();
          }
          // Base
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(jx - 18, jy + 18, 36, 5);
        }

        // PILA DE CALAVERAS Y HUESOS EN EL SUELO (Imagen 2)
        const pileX = compX + 90;
        ctx.fillStyle = '#cbd5e1';
        // Base de calaveras
        for (let sk = 0; sk < 5; sk++) {
          ctx.beginPath();
          ctx.arc(pileX + sk * 14, floorY - 8, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        // Fila 2
        for (let sk = 0; sk < 4; sk++) {
          ctx.beginPath();
          ctx.arc(pileX + 7 + sk * 14, floorY - 20, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        // Fila 3 y pico
        ctx.beginPath();
        ctx.arc(pileX + 21, floorY - 32, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pileX + 35, floorY - 32, 7, 0, Math.PI * 2);
        ctx.fill();
        // Ojos de las calaveras
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(pileX + 19, floorY - 33, 2, 2);
        ctx.fillRect(pileX + 23, floorY - 33, 2, 2);
        ctx.fillRect(pileX + 33, floorY - 33, 2, 2);
        ctx.fillRect(pileX + 37, floorY - 33, 2, 2);
        ctx.restore();
      }

      // ---------------------------------------------------------
      // COMPARTIMENTO 4: ARMERÍA TÁCTICA, RADAR Y CELDA DE PRISIÓN (Círculo Rojo - Derecha)
      // Soporte con 3 cuchillos, terminal holográfica con mapa radar, puerta de celda con candado
      // ---------------------------------------------------------
      else if (compIndex === 4) {
        ctx.save();
        // Pared blindada de placas de acero
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(compX + 24, 125, compW - 48, floorY - 125);
        // Remaches de acero
        ctx.fillStyle = '#475569';
        for (let ry = 135; ry < floorY; ry += 35) {
          ctx.fillRect(compX + 32, ry, 4, 4);
          ctx.fillRect(compX + 170, ry, 4, 4);
          ctx.fillRect(compX + 330, ry, 4, 4);
        }

        // SOPORTE DE ARMAS CON 3 CUCHILLOS / MACHETES (Imagen 2)
        const rackX = compX + 50;
        const rackY = 175;
        // Panel de madera del armero
        ctx.fillStyle = '#451a03';
        ctx.fillRect(rackX, rackY, 95, 80);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.strokeRect(rackX, rackY, 95, 80);

        // 3 Cuchillos montados en vertical
        for (let k = 0; k < 3; k++) {
          const kx = rackX + 18 + k * 28;
          // Mango negro
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(kx - 3, rackY + 10, 6, 18);
          // Guarda dorada
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(kx - 6, rackY + 28, 12, 4);
          // Hoja de acero plateada brillante
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(kx - 4, rackY + 32);
          ctx.lineTo(kx + 4, rackY + 32);
          ctx.lineTo(kx + 4, rackY + 68);
          ctx.lineTo(kx, rackY + 75); // Punta
          ctx.lineTo(kx - 4, rackY + 68);
          ctx.closePath();
          ctx.fill();
        }

        // TERMINAL HOLOGRÁFICA / RADAR TÁCTICO CON MAPA (Imagen 2)
        const consoleX = compX + 175;
        const consoleY = floorY - 110;
        // Pedestal metálico
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(consoleX + 35, consoleY + 45, 30, 65);
        // Pantalla angular
        ctx.fillStyle = '#022c22';
        ctx.fillRect(consoleX, consoleY, 100, 48);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(consoleX, consoleY, 100, 48);

        // Rejilla de mapa radar en verde neón brillante
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        // Líneas de cuadrícula
        for (let gx = consoleX + 12; gx < consoleX + 90; gx += 15) {
          ctx.beginPath();
          ctx.moveTo(gx, consoleY + 4);
          ctx.lineTo(gx, consoleY + 44);
          ctx.stroke();
        }
        for (let gy = consoleY + 10; gy < consoleY + 42; gy += 10) {
          ctx.beginPath();
          ctx.moveTo(consoleX + 4, gy);
          ctx.lineTo(consoleX + 96, gy);
          ctx.stroke();
        }
        // Barrido de radar y puntos intermitentes
        const radarAngle = (time * 3) % (Math.PI * 2);
        ctx.beginPath();
        ctx.arc(consoleX + 50, consoleY + 24, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(consoleX + 50, consoleY + 24);
        ctx.lineTo(consoleX + 50 + Math.cos(radarAngle) * 18, consoleY + 24 + Math.sin(radarAngle) * 18);
        ctx.stroke();
        // Blip rojo de objetivo
        ctx.fillStyle = Math.sin(time * 8) > 0 ? '#ef4444' : '#22c55e';
        ctx.fillRect(consoleX + 62, consoleY + 16, 4, 4);
        ctx.shadowBlur = 0;

        // PUERTA DE CELDA DE PRISIÓN CON CANDADO PESADO (Imagen 2)
        const jailX = compX + 360;
        const jailY = floorY - 260;
        const jailW = 140;
        const jailH = 260;
        // Marco de arco de piedra/acero
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(jailX - 10, jailY - 10, jailW + 20, jailH + 10);
        // Fondo oscuro de la celda
        ctx.fillStyle = '#020617';
        ctx.fillRect(jailX, jailY, jailW, jailH);

        // Barrotes gruesos de hierro
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 6;
        for (let b = 15; b < jailW; b += 22) {
          ctx.beginPath();
          ctx.moveTo(jailX + b, jailY);
          ctx.lineTo(jailX + b, jailY + jailH);
          ctx.stroke();
        }
        // Travesaños horizontales
        ctx.fillStyle = '#334155';
        ctx.fillRect(jailX, jailY + 80, jailW, 14);
        ctx.fillRect(jailX, jailY + 180, jailW, 14);

        // Candado gigante de hierro con ojo de cerradura (Imagen 2)
        const lockX = jailX + jailW * 0.5;
        const lockY = jailY + 140;
        // Aro
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(lockX, lockY - 8, 12, Math.PI, 0);
        ctx.stroke();
        // Cuerpo candado
        ctx.fillStyle = '#64748b';
        ctx.fillRect(lockX - 14, lockY - 6, 28, 22);
        ctx.fillStyle = '#020617'; // Ojo cerradura
        ctx.beginPath();
        ctx.arc(lockX, lockY + 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(lockX - 1.5, lockY + 4, 3, 6);

        ctx.restore();
      }

      // Lámpara de techo vintage oscilante con el traqueteo del convoy
      const ceilLampX = compX + compW * 0.5;
      const swingAngle = Math.sin(time * 2.6 + s * 0.7) * 0.1;
      ctx.save();
      ctx.translate(ceilLampX, 50);
      ctx.rotate(swingAngle);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 42);
      ctx.stroke();
      // Campana
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-14, 52);
      ctx.lineTo(14, 52);
      ctx.lineTo(7, 42);
      ctx.lineTo(-7, 42);
      ctx.closePath();
      ctx.fill();
      // Foco con luz verde esmeralda
      ctx.fillStyle = '#86efac';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 54, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // LEVEL 4 ENEMY: EL ESQUELETO DE FUEGO VERDE Y AURA NEGRA
  // (Matching Image 2: Skeleton with green flame horns, black aura,
  // heavy spiked mace/garrote and bat shield)
  // -------------------------------------------------------------
  drawGreenFlameSkeleton(skeleton, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(skeleton.x, skeleton.y);

    if (skeleton.dir === 1) {
      ctx.scale(-1, 1);
    }

    // Flash white on hit
    if (skeleton.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-22, -36, 44, 74);
      ctx.restore();
      return;
    }

    const flamePulse = Math.sin(time * 12) * 2;
    const walkBob = Math.sin(skeleton.animTime * 6) * 3;

    // 1. Densa AURA NEGRA espectral pulsante detrás del esqueleto (Image 2)
    ctx.save();
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#050705';
    ctx.beginPath();
    ctx.ellipse(0, 0 + walkBob, 28, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. LLAMAS VERDES ESPECTRALES en cráneo y hombros (Image 2)
    ctx.save();
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 18;

    // Fuego verde oscuro base
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(-14, -22 + walkBob);
    ctx.quadraticCurveTo(-22, -42 - flamePulse, -12, -48 - flamePulse);
    ctx.quadraticCurveTo(-4, -38, 0, -56 - flamePulse);
    ctx.quadraticCurveTo(4, -38, 12, -48 + flamePulse);
    ctx.quadraticCurveTo(22, -42, 14, -22 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Fuego verde esmeralda brillante central
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(-9, -24 + walkBob);
    ctx.quadraticCurveTo(-14, -38, -6, -44 - flamePulse);
    ctx.quadraticCurveTo(0, -32, 0, -50 - flamePulse);
    ctx.quadraticCurveTo(0, -32, 6, -44 + flamePulse);
    ctx.quadraticCurveTo(14, -38, 9, -24 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Puntas amarillas/lima brillantes
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.arc(0, -42 - flamePulse, 3.5, 0, Math.PI * 2);
    ctx.arc(-8, -38 - flamePulse, 2.5, 0, Math.PI * 2);
    ctx.arc(8, -38 + flamePulse, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. CUERPO ÓSEO DEL ESQUELETO (Cráneo, costillas, pelvis y piernas)
    ctx.fillStyle = '#e2e8f0'; // Hueso puro

    // Cráneo
    ctx.beginPath();
    ctx.ellipse(0, -22 + walkBob, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Maxilar inferior
    ctx.fillRect(-7, -14 + walkBob, 14, 6);

    // Ojos Verdes Resplandecientes (Image 2)
    ctx.save();
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(-4, -23 + walkBob, 2.8, 0, Math.PI * 2);
    ctx.arc(4, -23 + walkBob, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Dientes amenazantes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-5, -12 + walkBob, 10, 2);

    // Columna y Costillas
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-3, -8 + walkBob, 6, 22); // Columna
    for (let r = -4; r <= 8; r += 4) {
      ctx.fillRect(-12, r + walkBob, 24, 2.5); // Costillas
    }
    // Pelvis
    ctx.fillRect(-10, 14 + walkBob, 20, 6);

    // Piernas óseas animadas
    const legSwing = Math.sin(skeleton.animTime * 6) * 12;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3.5;
    // Pierna izquierda
    ctx.beginPath();
    ctx.moveTo(-6, 20 + walkBob);
    ctx.lineTo(-7 + legSwing, 36);
    ctx.stroke();
    // Pierna derecha
    ctx.beginPath();
    ctx.moveTo(6, 20 + walkBob);
    ctx.lineTo(7 - legSwing, 36);
    ctx.stroke();

    // 4. ESCUDO CON CRESTA DE MURCIÉLAGO (Brazo izquierdo)
    ctx.save();
    ctx.translate(14, 2 + walkBob);
    // Borde de hierro del escudo
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-4, -18);
    ctx.lineTo(16, -18);
    ctx.lineTo(14, 12);
    ctx.lineTo(6, 24);
    ctx.lineTo(-4, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Símbolo de murciélago en el escudo (Image 2)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(6, -2);
    ctx.lineTo(-1, -8);
    ctx.lineTo(2, 4);
    ctx.lineTo(6, -1);
    ctx.lineTo(10, 4);
    ctx.lineTo(13, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5. GRAN GARROTE / MAZO CON PÚAS Y CALAVERAS (Brazo derecho)
    ctx.save();
    let clubAngle = 0.35;
    if (skeleton.isSlamming) {
      if (skeleton.slamTimer < skeleton.slamWindupTime) {
        // Carga hacia atrás levantando el mazo en alto
        const windRatio = skeleton.slamTimer / skeleton.slamWindupTime;
        clubAngle = 0.35 - windRatio * 1.6; // Levanta hacia arriba/atrás
      } else {
        // Golpe violento hacia abajo contra el suelo
        clubAngle = 1.15;
      }
    }

    ctx.translate(-12, 0 + walkBob);
    ctx.rotate(clubAngle);

    // Mango de madera oscura/hierro
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-3, -28, 6, 44);

    // Cabeza del garrote con calaveras y púas afiladas (Image 2)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, -42, 20, 16);
    // Púas de hierro
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-10, -36);
    ctx.lineTo(-17, -34);
    ctx.lineTo(-10, -32);
    ctx.moveTo(10, -36);
    ctx.lineTo(17, -34);
    ctx.lineTo(10, -32);
    ctx.moveTo(-2, -42);
    ctx.lineTo(0, -49);
    ctx.lineTo(2, -42);
    ctx.fill();

    // Calavera tallada en el mazo
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -34, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -35, 1.5, 1.5);
    ctx.fillRect(1, -35, 1.5, 1.5);

    // Llamas verdes emanando del garrote
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -34, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // LEVEL 4 MINI GHOST ENEMY (3 Fantasmas Pequeños)
  // -------------------------------------------------------------
  drawMiniGhost(ghost, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(ghost.x, ghost.y);

    if (ghost.dir === 1) {
      ctx.scale(-1, 1);
    }

    if (ghost.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Resplandor espectral
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 16;

    // Cuerpo blanco ectoplásmico
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -4, 16, Math.PI, 0, false);
    // Cola ondulante
    const wave = Math.sin(ghost.sinTimer * 2) * 4;
    ctx.quadraticCurveTo(16, 12, 10 + wave, 16);
    ctx.quadraticCurveTo(0, 10, -10 + wave, 16);
    ctx.quadraticCurveTo(-16, 12, -16, -4);
    ctx.closePath();
    ctx.fill();

    // Manitas fantasmales
    ctx.beginPath();
    ctx.ellipse(-14, 0, 5, 3, -0.4, 0, Math.PI * 2);
    ctx.ellipse(14, 0, 5, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Cara de fantasma travieso (ojos oscuros y boca riendo)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-5, -6, 3, 4.5, 0, 0, Math.PI * 2);
    ctx.ellipse(5, -6, 3, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brillo blanco en pupilas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -8, 2, 2);
    ctx.fillRect(4, -8, 2, 2);

    // Boca abierta
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(0, 1, 4.5, 0, Math.PI);
    ctx.fill();

    // Lengua rosada/verde
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-1.5, 2, 3, 2.5);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // LEVEL 4 JEFE FINAL: EL REY FANTASMA (THE GHOST KING)
  // (Matching Image 3: Colossal ghost, lantern, teeth, tongue, suction)
  // (Matching Image 4: Defeated stone/cracked ghost with spiral eyes)
  // -------------------------------------------------------------
  drawGhostKing(boss, time, player) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.globalAlpha = boss.alpha !== undefined ? boss.alpha : 1.0;

    if (boss.facing === 1) {
      ctx.scale(-1, 1);
    }

    const isDefeated = boss.state === 'defeated';

    // 1. DIBUJAR VÓRTICE DE SUCCIÓN VORAZ (Si está en fase de aspiración)
    if (boss.isSuctionActive && !isDefeated) {
      ctx.save();
      const mouthTargetX = -20;
      const mouthTargetY = 5;

      // Cono de succión voraz hacia las fauces del Rey Fantasma
      const coneGrad = ctx.createRadialGradient(
        mouthTargetX, mouthTargetY, 20,
        mouthTargetX - 340, mouthTargetY, 380
      );
      coneGrad.addColorStop(0, 'rgba(52, 211, 153, 0.85)');
      coneGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.45)');
      coneGrad.addColorStop(0.8, 'rgba(5, 150, 105, 0.2)');
      coneGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coneGrad;

      ctx.beginPath();
      ctx.moveTo(mouthTargetX, mouthTargetY - 25);
      ctx.lineTo(mouthTargetX - 420, mouthTargetY - 140);
      ctx.lineTo(mouthTargetX - 420, mouthTargetY + 140);
      ctx.lineTo(mouthTargetX, mouthTargetY + 25);
      ctx.closePath();
      ctx.fill();

      // Líneas de torbellino / vórtice espiral
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 2.5;
      for (let ring = 1; ring <= 4; ring++) {
        const ringDist = ring * 85;
        const ringWave = (time * 12 + ring * 2) % 360;
        ctx.beginPath();
        ctx.ellipse(
          mouthTargetX - ringDist,
          mouthTargetY,
          18,
          ringDist * 0.4,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. FUEGO VERDE ESPECTRAL RADIANDO DEL CUERPO (Image 3)
    if (!isDefeated) {
      ctx.save();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 32;
      const flamePulse = Math.sin(time * 8) * 4;

      ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.beginPath();
      ctx.arc(0, -35, 88 + flamePulse, Math.PI * 0.9, Math.PI * 0.1, false);
      ctx.quadraticCurveTo(95, 75, 45, 115);
      ctx.quadraticCurveTo(0, 85, -45, 115);
      ctx.quadraticCurveTo(-95, 75, -88 - flamePulse, -35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. CUERPO ESPECTRAL DEL REY FANTASMA
    ctx.save();
    if (isDefeated) {
      // Estado Derrotado: Blanco cenizo / gris piedra agrietado (Image 4)
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
    } else {
      // Estado Normal: Blanco níveo espectral
      ctx.fillStyle = boss.hitFlash > 0 ? '#ffffff' : '#f1f5f9';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 20;
    }

    // Silueta de la cabeza y manto del fantasma
    ctx.beginPath();
    ctx.arc(0, -35, 82, Math.PI * 0.92, Math.PI * 0.08, false);
    // Manto rasgado inferior
    ctx.quadraticCurveTo(88, 65, 42, 105);
    ctx.quadraticCurveTo(0, 80, -42, 105);
    ctx.quadraticCurveTo(-88, 65, -82, -35);
    ctx.closePath();
    ctx.fill();
    if (isDefeated) ctx.stroke();
    ctx.restore();

    // 4. OJOS DEL REY FANTASMA
    ctx.save();
    if (isDefeated) {
      // Ojos derrotados en espiral (Image 4)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      // Ojo izquierdo en espiral
      ctx.beginPath();
      ctx.arc(-34, -48, 12, 0, Math.PI * 2.5);
      ctx.stroke();
      // Ojo derecho con cruz
      ctx.beginPath();
      ctx.moveTo(24, -58);
      ctx.lineTo(44, -38);
      ctx.moveTo(44, -58);
      ctx.lineTo(24, -38);
      ctx.stroke();
    } else {
      // Ojos demoníacos negros profundos con iris blanco (Image 3)
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.ellipse(-34, -48, 18, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(34, -48, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupilas redondas blancas
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-34, -48, 7, 0, Math.PI * 2);
      ctx.arc(34, -48, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-34, -48, 3, 0, Math.PI * 2);
      ctx.arc(34, -48, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. ENORME BOCA, DIENTES Y LENGUA VERDE
    const openH = 26 + boss.mouthOpenRatio * 44; // Altura dinámica de la boca

    ctx.save();
    // Cavidad bucal negra abisal
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(0, 8, 56, openH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isDefeated ? '#475569' : '#047857';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Gran lengua verde saliendo de las fauces (Image 3)
    if (!isDefeated) {
      const tongueSway = Math.sin(boss.tongueWave) * 8;
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(-16, 12);
      ctx.quadraticCurveTo(-20 + tongueSway, openH + 20, 0 + tongueSway, openH + 34);
      ctx.quadraticCurveTo(20 + tongueSway, openH + 20, 16, 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Dientes puntiagudos en hilera superior e inferior
    ctx.fillStyle = '#f8fafc';
    // Dientes superiores
    for (let t = -44; t <= 44; t += 11) {
      ctx.beginPath();
      ctx.moveTo(t - 4, 8 - openH * 0.85);
      ctx.lineTo(t + 4, 8 - openH * 0.85);
      ctx.lineTo(t, 8 - openH * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    // Dientes inferiores
    for (let t = -42; t <= 42; t += 11) {
      ctx.beginPath();
      ctx.moveTo(t - 4, 8 + openH * 0.85);
      ctx.lineTo(t + 4, 8 + openH * 0.85);
      ctx.lineTo(t, 8 + openH * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 6. LINTERNA DE HIERRO VERDE SOSTENIDA EN LA MANO IZQUIERDA (Image 3)
    ctx.save();
    ctx.translate(92, -10);
    ctx.rotate(boss.lanternAngle);

    // Brazo fantasmal sosteniendo la linterna
    ctx.fillStyle = isDefeated ? '#cbd5e1' : '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(-14, 0, 16, 10, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Cadena y asa de la linterna
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 20);
    ctx.stroke();

    // Armazón de la linterna
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12, 20, 24, 6);
    ctx.fillRect(-12, 48, 24, 6);
    ctx.strokeRect(-12, 26, 24, 22);

    // Fuego verde brillante dentro de la linterna
    if (!isDefeated) {
      ctx.fillStyle = '#4ade80';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 37, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Linterna apagada rota (Image 4)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, 30, 16, 14);
    }
    ctx.restore();

    // 7. MAZO DE CADENAS Y ENGRANAJES EN LA OTRA MANO (Image 3)
    ctx.save();
    ctx.translate(-85, -15);
    ctx.fillStyle = isDefeated ? '#cbd5e1' : '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(10, 5, 16, 10, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Cadena con calaveras colgando
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-20, 42);
    ctx.stroke();

    // Engranaje con calavera
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-22, 52, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(-22, 52, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 8. SI ESTÁ DERROTADO: GRIETAS DE PIEDRA EMITIENDO POLVO (Image 4)
    if (isDefeated) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      // Grietas en la frente
      ctx.beginPath();
      ctx.moveTo(-15, -95);
      ctx.lineTo(0, -75);
      ctx.lineTo(15, -82);
      ctx.moveTo(0, -75);
      ctx.lineTo(-5, -55);
      ctx.stroke();

      // Grietas en el cuerpo
      ctx.beginPath();
      ctx.moveTo(40, -10);
      ctx.lineTo(65, 20);
      ctx.lineTo(55, 45);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Level 4 HUD Indicator & Vacuum Warning Banner
  drawLevel4HUDOverlay(game) {
    const ctx = this.ctx;

    // Cartel de Peligro Máximo: Succión Voraz del Rey Fantasma
    if (game.ghostKing && game.ghostKing.isSuctionActive) {
      ctx.save();
      const alphaPulse = 0.8 + Math.sin(game.time * 12) * 0.2;
      ctx.fillStyle = `rgba(185, 28, 28, ${alphaPulse * 0.9})`;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 24;

      const barW = 760;
      const barH = 54;
      const barX = (this.width - barW) * 0.5;
      const barY = 90;

      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.font = "bold 13px 'Press Start 2P', monospace";
      ctx.textAlign = 'center';
      ctx.fillText("⚠️ ¡¡¡SUCCIÓN VORAZ DEL REY FANTASMA!!! ⚠️", this.width * 0.5, barY + 22);

      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 10px 'Press Start 2P', monospace";
      ctx.fillText("¡MUEVETE AL LADO OPUESTO! &bull; ¡¡¡NO SALTES O SERÁS DEVORADO!!!", this.width * 0.5, barY + 42);
      ctx.restore();
    }
  }
}

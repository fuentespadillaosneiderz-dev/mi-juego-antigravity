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

    // 1. Draw Night Desert Background with Parallax
    this.drawBackground(game.time, game.cameraX);

    // World Space Translation (All game objects follow cameraX)
    ctx.save();
    ctx.translate(-game.cameraX, 0);

    // 2. Draw Ground & Scrolling Ruins Landmarks
    this.drawRuinsAndForeground(game.time, game.cameraX);

    // 3. Draw Pickups
    game.pickups.forEach(p => p.draw(ctx));

    // 3.5. Draw Exit Portal (Level 2 Finale)
    if (game.portal) {
      this.drawPortal(game.portal, game.time);
    }

    // 4. Draw The 3-Eyed Boss (if active or intro)
    if (game.boss && (game.boss.active || game.boss.state === 'intro')) {
      this.drawBoss(game.boss, game.time);
    }

    // 5. Draw Enemies
    game.enemies.forEach(e => {
      if (e.type === 'cactus') this.drawCactus(e);
      else if (e.type === 'scorpion') this.drawScorpion(e);
      else if (e.type === 'wolf') this.drawWolf(e, game.time);
      else if (e.type === 'flying') this.drawFlyingEnemy(e, game.time);
      else if (e.type === 'witch') this.drawWitch(e, game.time);
      else if (e.type === 'zombie') this.drawZombie(e, game.time);
    });

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

    // 11. Draw Mouse Aim Reticle Crosshair (Screen Space)
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
    ctx.translate(boss.x, boss.y + boss.introRise);

    const breath = Math.sin(boss.breathTimer) * 4;

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
      ctx.strokeStyle = boss.hitFlash > 0 ? '#ffffff' : '#b49673'; // Sand beige skin
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(ac.side * 50, ac.y);
      const elbowX = ac.side * (50 + ac.len * 0.55);
      const elbowY = ac.y - 20 + Math.sin(angle) * 20;
      const handX = ac.side * (50 + ac.len);
      const handY = ac.y + 10 + Math.cos(angle) * 25;

      ctx.quadraticCurveTo(elbowX, elbowY, handX, handY);
      ctx.stroke();

      // Sharp Monster Claws
      ctx.fillStyle = '#451a03';
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

    // 2. MAIN MASSIVE BODY & HEAD (Sandy Beige Demon Titan)
    ctx.fillStyle = boss.hitFlash > 0 ? '#ffffff' : '#d2b48c'; // Tan / Desert monster skin
    ctx.shadowColor = 'rgba(239, 68, 68, 0.35)';
    ctx.shadowBlur = 20;

    // Muscular bulky torso
    ctx.beginPath();
    ctx.ellipse(0, 40 + breath, 75, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Massive Demonic Head
    ctx.beginPath();
    ctx.ellipse(0, -20 + breath * 0.5, 70, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. CURVED DEMONIC HORNS
    ctx.fillStyle = '#451a03';
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
    ctx.fillStyle = '#180d0d'; // Deep dark maw interior
    ctx.beginPath();
    ctx.ellipse(0, 10 + breath * 0.5, 42, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Razor Sharp Fangs (Upper and Lower)
    ctx.fillStyle = '#fef08a'; // Yellowed sharp teeth
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

    // 5. THE 3 GLOWING CRIMSON EYES
    // Positions: Left Eye, Center Forehead Eye, Right Eye
    const eyes = [
      { x: -32, y: -26, radius: 13 },
      { x: 0, y: -45, radius: 15 },
      { x: 32, y: -26, radius: 13 }
    ];

    eyes.forEach((eye, index) => {
      // Eye Socket
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y + breath * 0.5, eye.radius * 1.2, eye.radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Crimson Iris
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y + breath * 0.5, eye.radius * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // Slit Vertical Demonic Pupil
      ctx.fillStyle = '#000000';
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
}

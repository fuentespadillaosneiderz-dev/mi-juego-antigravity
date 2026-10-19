// Main Game Engine & Controller
import { Player, CactusEnemy, ScorpionEnemy, GhostWolfEnemy, FlyingEnemy, Boss3Eyes, WitchEnemy, ExitPortal, Pickup, FloatingText, Particle } from './entities.js';
import { GameRenderer } from './renderer.js';
import { soundManager } from './audio.js';
import { TitleScreenManager } from './titleScreen.js';

class DesertGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new GameRenderer(this.canvas);
    this.groundY = this.renderer.groundY;

    // Game state
    this.state = 'menu'; // 'menu', 'playing', 'paused', 'gameover', 'victory'
    this.time = 0;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('desert_revenant_highscore') || '0', 10);
    this.kills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.cameraX = 0;
    this.bossArenaCam = 0;

    // Entities
    this.player = new Player(200, this.groundY - 35);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.boss = null;

    // Spawning system
    this.spawnTimer = 1.0;
    this.flyingSpawnTimer = 3.5;

    // Controls
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false, inside: false };
    this.autoFire = true;
    this.autoFireTimer = 0;

    // Level progression & Level 2 features
    this.level = 1;
    this.level2BannerTimer = null;
    this.witchSpawnTimer = 3.5;
    this.portal = null;
    this.portalX = 0;
    this.level2StartX = 0;

    this.bossWarningTimer = null;

    // DOM UI elements
    this.initDOMElements();
    this.initEventListeners();

    // The Night Hunter Title Screen & Second Screen Manager
    this.titleScreenManager = new TitleScreenManager(this);

    // Start Loop
    this.lastTimestamp = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  initDOMElements() {
    this.ui = {
      levelCounter: document.getElementById('level-counter'),
      distanceCounter: document.getElementById('distance-counter'),
      hpFill: document.getElementById('hp-bar-fill'),
      hpText: document.getElementById('hp-text'),
      hearts: document.querySelectorAll('#hearts-display .heart'),
      furyFill: document.getElementById('fury-bar-fill'),
      furyText: document.getElementById('fury-text'),
      bossGoalTitle: document.getElementById('boss-goal-title'),
      bossProgressFill: document.getElementById('boss-progress-fill'),
      bossProgressText: document.getElementById('boss-progress-text'),
      score: document.getElementById('score-counter'),
      highScore: document.getElementById('highscore-counter'),
      comboDisplay: document.getElementById('combo-display'),
      comboNumber: document.getElementById('combo-number'),
      
      bossHud: document.getElementById('boss-hud'),
      bossHpFill: document.getElementById('boss-health-fill'),
      bossHpGhost: document.getElementById('boss-health-ghost'),
      bossHpText: document.getElementById('boss-health-text'),
      bossWarning: document.getElementById('boss-warning-banner'),
      level2Banner: document.getElementById('level2-banner'),

      startScreen: document.getElementById('screen-title'),
      secondScreen: document.getElementById('screen-second'),
      gameOverScreen: document.getElementById('game-over-screen'),
      victoryScreen: document.getElementById('victory-screen'),
      pauseModal: document.getElementById('pause-modal'),
      crtOverlay: document.getElementById('crt-overlay'),

      finalScore: document.getElementById('final-score'),
      finalKills: document.getElementById('final-kills'),
      finalMaxCombo: document.getElementById('final-max-combo'),
      victoryScore: document.getElementById('victory-score'),

      btnAutoFire: document.getElementById('btn-autofire'),
      autoFireState: document.getElementById('autofire-state'),
      btnSound: document.getElementById('btn-sound'),
      soundState: document.getElementById('sound-state'),
      btnCrt: document.getElementById('btn-crt'),
      crtState: document.getElementById('crt-state'),
      btnPause: document.getElementById('btn-pause')
    };

    this.ui.highScore.textContent = String(this.highScore).padStart(5, '0');
  }

  initEventListeners() {
    // Keyboard Listeners
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling with arrows & space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      this.keys[e.code] = true;

      // Jump trigger on press (ArrowUp or W)
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && this.state === 'playing') {
        this.player.jump(soundManager, this.particles);
      }

      // Shoot on Space
      if (e.code === 'Space' && this.state === 'playing') {
        this.player.shoot(soundManager, this.projectiles, this.particles);
      }

      // Special Fury on KeyC
      if (e.code === 'KeyC' && this.state === 'playing') {
        this.player.triggerFury(soundManager, this.projectiles, this.particles, this.floatingTexts);
      }

      // Pause on Escape or P
      if ((e.code === 'KeyP' || e.code === 'Escape') && (this.state === 'playing' || this.state === 'paused')) {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse Listeners on Canvas
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
      this.mouse.inside = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.inside = false;
      this.mouse.isDown = false;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      soundManager.init();
      if (e.button === 0) { // Left click: shoot
        this.mouse.isDown = true;
        if (this.state === 'playing') {
          this.player.shoot(soundManager, this.projectiles, this.particles, this.mouse.x + this.cameraX, this.mouse.y);
        }
      } else if (e.button === 2) { // Right click: Special Fury
        e.preventDefault();
        if (this.state === 'playing') {
          this.player.triggerFury(soundManager, this.projectiles, this.particles, this.floatingTexts);
        }
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch Controls on Screen
    this.initTouchControls();

    // UI Buttons
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) btnStart.addEventListener('click', () => this.startGame());
    document.getElementById('btn-restart')?.addEventListener('click', () => this.startGame());
    document.getElementById('btn-victory-restart')?.addEventListener('click', () => this.startGame());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.togglePause());
    document.getElementById('btn-quit')?.addEventListener('click', () => this.startGame());

    this.ui.btnPause.addEventListener('click', () => this.togglePause());

    this.ui.btnAutoFire.addEventListener('click', () => {
      this.autoFire = !this.autoFire;
      this.ui.autoFireState.textContent = this.autoFire ? 'ON' : 'OFF';
      this.ui.btnAutoFire.style.borderColor = this.autoFire ? '#10b981' : '#64748b';
    });

    this.ui.btnSound.addEventListener('click', () => {
      const enabled = soundManager.toggleSound();
      this.ui.soundState.textContent = enabled ? 'ON' : 'OFF';
      this.ui.btnSound.style.borderColor = enabled ? '#10b981' : '#ef4444';
      if (enabled && this.state === 'playing') {
        soundManager.startMusic();
      } else {
        soundManager.stopMusic();
      }
    });

    this.ui.btnCrt.addEventListener('click', () => {
      this.ui.crtOverlay.classList.toggle('active');
      const active = this.ui.crtOverlay.classList.contains('active');
      this.ui.crtState.textContent = active ? 'ON' : 'OFF';
    });
  }

  initTouchControls() {
    const bindTouch = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        soundManager.init();
        if (onDown) onDown();
      }, { passive: false });

      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (onUp) onUp();
      }, { passive: false });
    };

    bindTouch('touch-left', () => this.keys['ArrowLeft'] = true, () => this.keys['ArrowLeft'] = false);
    bindTouch('touch-right', () => this.keys['ArrowRight'] = true, () => this.keys['ArrowRight'] = false);
    bindTouch('touch-down', () => this.keys['ArrowDown'] = true, () => this.keys['ArrowDown'] = false);
    bindTouch('touch-up', () => {
      if (this.state === 'playing') this.player.jump(soundManager, this.particles);
    }, null);

    bindTouch('touch-jump', () => {
      if (this.state === 'playing') this.player.jump(soundManager, this.particles);
    }, null);

    bindTouch('touch-shoot', () => {
      if (this.state === 'playing') this.player.shoot(soundManager, this.projectiles, this.particles);
    }, null);

    bindTouch('touch-special', () => {
      if (this.state === 'playing') this.player.triggerFury(soundManager, this.projectiles, this.particles, this.floatingTexts);
    }, null);
  }

  startGame() {
    soundManager.init();
    soundManager.setBossMode(false);
    soundManager.startMusic();

    this.state = 'playing';
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.cameraX = 0;
    this.bossArenaCam = 0;

    // Reset Player
    this.player = new Player(200, this.groundY - 35);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.boss = null;

    // Reset Level 1 state
    this.level = 1;
    this.portal = null;
    this.portalX = 0;
    this.level2StartX = 0;
    this.witchSpawnTimer = 3.5;

    // Hide Modals and reset warnings
    if (this.bossWarningTimer) {
      clearTimeout(this.bossWarningTimer);
      this.bossWarningTimer = null;
    }
    if (this.level2BannerTimer) {
      clearTimeout(this.level2BannerTimer);
      this.level2BannerTimer = null;
    }
    if (this.ui.startScreen) this.ui.startScreen.classList.add('hidden');
    if (this.ui.secondScreen) this.ui.secondScreen.classList.add('hidden');
    if (this.titleScreenManager) this.titleScreenManager.activeScreen = 'game';
    this.ui.gameOverScreen.classList.add('hidden');
    this.ui.victoryScreen.classList.add('hidden');
    this.ui.pauseModal.classList.add('hidden');
    this.ui.bossHud.classList.add('hidden');
    this.ui.bossWarning.classList.add('hidden');
    if (this.ui.level2Banner) this.ui.level2Banner.classList.add('hidden');

    this.updateHUD();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.ui.pauseModal.classList.remove('hidden');
      soundManager.stopMusic();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.ui.pauseModal.classList.add('hidden');
      soundManager.startMusic();
    }
  }

  // -------------------------------------------------------------
  // GAME LOOP
  // -------------------------------------------------------------
  gameLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    if (this.state === 'playing') {
      this.update(dt);
    }

    this.renderer.clear();
    this.renderer.renderScene(this);

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  update(dt) {
    this.time += dt;

    // Combo timer decay
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.ui.comboDisplay.classList.add('hidden');
      }
    }

    // Camera follow progression: moves right as player walks and advances through desert
    if (this.boss && this.boss.alive) {
      const targetCam = this.bossArenaCam;
      this.cameraX += (targetCam - this.cameraX) * 5.0 * dt;
    } else {
      const targetCam = Math.max(0, this.player.x - 240);
      this.cameraX += (targetCam - this.cameraX) * 7.0 * dt;
    }

    // Auto-fire handling: if mouse is pressed, aim at cursor; otherwise shoot straight in facing direction
    if (this.autoFire || this.mouse.isDown) {
      this.autoFireTimer += dt;
      const rate = this.player.rapidFireTimer > 0 ? 0.08 : 0.16;
      if (this.autoFireTimer >= rate) {
        this.autoFireTimer = 0;
        const targetX = this.mouse.isDown && this.mouse.inside ? this.mouse.x + this.cameraX : null;
        const targetY = this.mouse.isDown && this.mouse.inside ? this.mouse.y : null;
        this.player.shoot(soundManager, this.projectiles, this.particles, targetX, targetY);
      }
    }

    // 1. Update Player (passing cameraX for boundary constraints)
    this.player.update(dt, this.keys, this.groundY, soundManager, this.particles, this.projectiles, this.cameraX);

    // 2. Update Pickups
    this.pickups.forEach(p => p.update(dt, this.groundY));
    this.pickups = this.pickups.filter(p => p.alive && p.x > this.cameraX - 200);

    // Check Pickup collisions
    const pHit = this.player.getHitbox();
    this.pickups.forEach(p => {
      const dx = p.x - (pHit.x + pHit.width * 0.5);
      const dy = p.y - (pHit.y + pHit.height * 0.5);
      if (Math.sqrt(dx * dx + dy * dy) < p.radius + 24) {
        p.alive = false;
        soundManager.playPickup();
        if (p.type === 'health') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
          this.floatingTexts.push(new FloatingText(p.x, p.y, '+35 HP 💚', '#4ade80'));
        } else if (p.type === 'rapid') {
          this.player.rapidFireTimer = 8.0;
          this.floatingTexts.push(new FloatingText(p.x, p.y, '¡AMETRALLADORA! ⚡', '#f59e0b'));
        } else if (p.type === 'fury') {
          this.player.fury = 100;
          this.floatingTexts.push(new FloatingText(p.x, p.y, '¡FURIA MÁXIMA! 🔥', '#ec4899'));
        }
      }
    });

    // 3. Spawning Monsters (Ground + Flying)
    this.handleEnemySpawning(dt);

    // 4. Update Enemies
    this.enemies.forEach(e => {
      e.update(dt, this.player, this.projectiles, soundManager, this.particles);
    });
    // Remove dead enemies and those left far behind the scrolling camera
    this.enemies = this.enemies.filter(e => e.alive && e.x > this.cameraX - 350);

    // 5. Boss Trigger at 5000 PTS
    if (this.score >= 5000 && !this.bossSpawned) {
      this.triggerBossSpawn();
    }

    // Update Boss
    if (this.boss) {
      this.boss.update(dt, this.player, this.projectiles, soundManager, this.particles, () => {
        // Boss summon minion callback
        this.enemies.push(new FlyingEnemy(this.cameraX + 960 + 40, 120 + Math.random() * 80));
      });

      if (this.boss.hp <= 0 && !this.bossDefeated) {
        this.handleBossVictory();
      }
    }

    // 5.5 Update Exit Portal (Level 2 Finale)
    if (this.portal) {
      this.portal.update(dt, this.particles);

      // Check if Player touches the Exit Portal at the end of the road
      const pHit = this.player.getHitbox();
      const portHit = this.portal.getHitbox();
      if (this.rectIntersect(pHit.x, pHit.y, pHit.width, pHit.height, portHit.x, portHit.y, portHit.width, portHit.height)) {
        this.handlePortalVictory();
        return;
      }
    }

    // 6. Update Projectiles (pass cameraX so bullets fly cleanly without disappearing)
    this.projectiles.forEach(p => p.update(dt, this.particles, this.groundY, this.cameraX));
    this.projectiles = this.projectiles.filter(p => p.alive && p.x > this.cameraX - 250 && p.x < this.cameraX + 1350);

    // 7. Check Collisions (Player Bullets vs Enemies/Boss, Enemy Attacks vs Player)
    this.checkCollisions();

    // 8. Update Particles & Floating Text
    this.particles = this.particles.filter(p => p.update(dt));
    this.floatingTexts = this.floatingTexts.filter(ft => ft.update(dt));

    // 9. Update Environment relative to camera
    this.renderer.updateEnvironment(dt, this.cameraX);

    // 10. Check Game Over
    if (this.player.hp <= 0) {
      this.handleGameOver();
    }

    // 11. Update HUD Elements
    this.updateHUD();
  }

  // -------------------------------------------------------------
  // ENEMY SPAWNING LOGIC (SCROLLING DESERT ENCOUNTERS)
  // -------------------------------------------------------------
  handleEnemySpawning(dt) {
    if (this.bossSpawned && this.boss && this.boss.alive) {
      return;
    }

    // Ground Enemies Spawning (Cactus, Scorpion, Wolf)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(1.4, 3.2 - (this.score / 5000) * 1.2);

      const spawnRight = Math.random() < 0.85;
      const spawnX = spawnRight ? this.cameraX + 960 + 60 + Math.random() * 120 : this.cameraX - 50;
      const rand = Math.random();

      if (rand < 0.45) {
        this.enemies.push(new CactusEnemy(spawnX, this.groundY));
      } else if (rand < 0.78) {
        this.enemies.push(new ScorpionEnemy(spawnX, this.groundY));
      } else {
        this.enemies.push(new GhostWolfEnemy(spawnX, this.groundY));
      }
    }

    // MONSTRUOS VOLADORES (Flying Bats / Demon Eyes)
    // Requirement: "que aparescan moustro voladores"
    this.flyingSpawnTimer -= dt;
    if (this.flyingSpawnTimer <= 0) {
      this.flyingSpawnTimer = Math.max(2.8, 5.0 - (this.score / 5000) * 1.5);
      const spawnX = this.cameraX + 960 + 50 + Math.random() * 100;
      const spawnY = 80 + Math.random() * 140;
      this.enemies.push(new FlyingEnemy(spawnX, spawnY));
    }

    // NIVEL 2 NUEVO MONSTRUO: LA BRUJA VOLADORA EN ESCOBA
    if (this.level === 2) {
      this.witchSpawnTimer -= dt;
      if (this.witchSpawnTimer <= 0) {
        this.witchSpawnTimer = 3.2 + Math.random() * 2.5;
        const spawnX = this.cameraX + 960 + 70 + Math.random() * 120;
        const spawnY = 90 + Math.random() * 120;
        this.enemies.push(new WitchEnemy(spawnX, spawnY));
      }
    }
  }

  // -------------------------------------------------------------
  // BOSS EVENT: AT 5000 POINTS
  // -------------------------------------------------------------
  triggerBossSpawn() {
    this.bossSpawned = true;
    soundManager.playBossSiren();
    this.renderer.addScreenShake(12, 1.5);

    // Lock camera into the boss sanctuary arena
    this.bossArenaCam = this.cameraX;

    // Show warning banner (desaparece en 4.5 segundos)
    this.ui.bossWarning.classList.remove('hidden');
    if (this.bossWarningTimer) {
      clearTimeout(this.bossWarningTimer);
    }
    this.bossWarningTimer = setTimeout(() => {
      this.ui.bossWarning.classList.add('hidden');
      this.bossWarningTimer = null;
    }, 4500);

    // Switch music to intense boss battle synth
    soundManager.setBossMode(true);

    // Show Boss HUD
    this.ui.bossHud.classList.remove('hidden');

    // Create 3-Eyed Boss ahead of player in current view
    this.boss = new Boss3Eyes(this.cameraX + 580, this.groundY);
  }

  handleBossVictory() {
    this.bossDefeated = true;
    soundManager.playExplosion(true);
    this.renderer.addScreenShake(20, 3.0);

    // Spawn massive celebration fireworks particles
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 100 + Math.random() * 350;
      this.particles.push(new Particle(
        this.boss.x, this.boss.y,
        Math.cos(a) * s, Math.sin(a) * s,
        Math.random() < 0.5 ? '#facc15' : '#ef4444', 6, 1.2, 'circle'
      ));
    }

    this.score += this.boss.points;
    this.updateHighScore();
    this.sendScoreToBackend();

    // DESBLOQUEAR NIVEL 2 TRAS DERROTAR AL MONSTRUO DE 3 OJOS
    this.level = 2;
    this.level2StartX = this.player.x;
    // Final del camino donde se ubica el Portal de Salida (aprox 260m)
    this.portalX = this.level2StartX + 2600;
    this.portal = new ExitPortal(this.portalX, this.groundY);

    // Ocultar barra de salud del jefe y volver a música ambiental
    this.ui.bossHud.classList.add('hidden');
    soundManager.setBossMode(false);

    // Notificación flotante
    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 70,
      '✨ ¡NIVEL 2 DESBLOQUEADO! 🧙‍♀️',
      '#c084fc',
      16
    ));

    // Mostrar cartel de Nivel 2 Desbloqueado durante 4.8 segundos
    if (this.ui.level2Banner) {
      this.ui.level2Banner.classList.remove('hidden');
      if (this.level2BannerTimer) clearTimeout(this.level2BannerTimer);
      this.level2BannerTimer = setTimeout(() => {
        this.ui.level2Banner.classList.add('hidden');
        this.level2BannerTimer = null;
      }, 4800);
    }
  }

  handlePortalVictory() {
    if (this.state === 'victory') return;
    this.state = 'victory';
    soundManager.playPortalWarp();
    this.renderer.addScreenShake(20, 2.5);

    // Ráfaga cósmica de partículas en el portal
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 120 + Math.random() * 320;
      this.particles.push(new Particle(
        this.portal.x, this.portal.y,
        Math.cos(a) * s, Math.sin(a) * s,
        Math.random() < 0.5 ? '#38bdf8' : '#a855f7', 6, 1.4, 'spark'
      ));
    }

    this.score += 5000; // Bonus por completar el camino y cruzar el portal
    this.updateHighScore();
    this.sendScoreToBackend();

    setTimeout(() => {
      this.ui.victoryScore.textContent = this.score;
      this.ui.victoryScreen.classList.remove('hidden');
      soundManager.stopMusic();
    }, 1200);
  }

  handleGameOver() {
    this.state = 'gameover';
    this.updateHighScore();
    this.sendScoreToBackend();
    soundManager.stopMusic();
    this.renderer.addScreenShake(15, 0.8);

    this.ui.finalScore.textContent = this.score;
    this.ui.finalKills.textContent = this.kills;
    this.ui.finalMaxCombo.textContent = `x${this.maxCombo}`;
    this.ui.gameOverScreen.classList.remove('hidden');
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('desert_revenant_highscore', this.highScore.toString());
      this.ui.highScore.textContent = String(this.highScore).padStart(5, '0');
    }
  }

  sendScoreToBackend() {
    try {
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: 'Pistolero Espectral',
          score: this.score,
          kills: this.kills,
          max_combo: this.maxCombo
        })
      }).catch(() => {
        // Ignorar si se ejecuta solo en frontend estático sin backend activo
      });
    } catch (e) {
      // Ignorar errores de red
    }
  }

  // -------------------------------------------------------------
  // COLLISION DETECTION & HIT HANDLING
  // -------------------------------------------------------------
  checkCollisions() {
    const pHit = this.player.getHitbox();

    // 1. Player Projectiles vs Enemies
    this.projectiles.filter(p => p.isPlayer && p.alive).forEach(proj => {
      // Check normal enemies
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const eHit = enemy.getHitbox();
        if (this.rectIntersect(proj.x - proj.radius, proj.y - proj.radius, proj.radius * 2, proj.radius * 2,
                               eHit.x, eHit.y, eHit.width, eHit.height)) {
          proj.alive = false;
          enemy.takeDamage(proj.damage);
          soundManager.playHit();

          // Hit spark particles
          for (let i = 0; i < 4; i++) {
            this.particles.push(new Particle(
              proj.x, proj.y,
              (Math.random() - 0.5) * 80, -20 - Math.random() * 60,
              '#34d399', 3, 0.2, 'spark'
            ));
          }

          // Enemy Death
          if (!enemy.alive) {
            this.handleEnemyKilled(enemy);
          }
          break;
        }
      }

      // Check Boss
      if (this.boss && this.boss.alive && proj.alive) {
        const bHit = this.boss.getHitbox();
        if (this.rectIntersect(proj.x - proj.radius, proj.y - proj.radius, proj.radius * 2, proj.radius * 2,
                               bHit.x, bHit.y, bHit.width, bHit.height)) {
          proj.alive = false;
          this.boss.takeDamage(proj.damage);
          soundManager.playHit();
          this.renderer.addScreenShake(3, 0.08);

          // Boss hit blood/sand burst
          for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle(
              proj.x, proj.y,
              (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120,
              '#ef4444', 4, 0.3, 'circle'
            ));
          }
        }
      }
    });

    // 2. Enemy Projectiles vs Player
    this.projectiles.filter(p => !p.isPlayer && p.alive).forEach(proj => {
      if (this.rectIntersect(proj.x - proj.radius, proj.y - proj.radius, proj.radius * 2, proj.radius * 2,
                             pHit.x, pHit.y, pHit.width, pHit.height)) {
        proj.alive = false;
        if (this.player.takeDamage(proj.damage, soundManager, this.particles)) {
          this.renderer.addScreenShake(7, 0.2);
          this.combo = 0;
          this.ui.comboDisplay.classList.add('hidden');
        }
      }
    });

    // 3. Enemy Body Contact vs Player
    this.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      const eHit = enemy.getHitbox();
      if (this.rectIntersect(pHit.x, pHit.y, pHit.width, pHit.height,
                             eHit.x, eHit.y, eHit.width, eHit.height)) {
        if (this.player.takeDamage(20, soundManager, this.particles)) {
          this.renderer.addScreenShake(8, 0.25);
          this.combo = 0;
          this.ui.comboDisplay.classList.add('hidden');
        }
      }
    });
  }

  handleEnemyKilled(enemy) {
    this.kills++;
    this.combo++;
    this.comboTimer = 3.2;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Show combo badge
    if (this.combo >= 2) {
      this.ui.comboDisplay.classList.remove('hidden');
      this.ui.comboNumber.textContent = `x${this.combo}`;
    }

    const earnedPoints = enemy.points * (1 + Math.min(this.combo * 0.15, 2.0));
    this.score += Math.round(earnedPoints);

    // Charge fury (+10% for faster special access)
    this.player.fury = Math.min(100, this.player.fury + 10);

    soundManager.playExplosion(false);

    // Floating Points
    this.floatingTexts.push(new FloatingText(
      enemy.x, enemy.y - 15,
      `+${Math.round(earnedPoints)}`,
      '#facc15'
    ));

    // Death gore & sand puff
    const color = enemy.type === 'cactus' ? '#22c55e' : (enemy.type === 'wolf' ? '#38bdf8' : (enemy.type === 'flying' ? '#c084fc' : (enemy.type === 'witch' ? '#a855f7' : '#b45309')));
    for (let i = 0; i < 18; i++) {
      this.particles.push(new Particle(
        enemy.x, enemy.y,
        (Math.random() - 0.5) * 160, -30 - Math.random() * 80,
        color, 4, 0.45, 'circle', 200
      ));
    }
    if (enemy.type === 'witch') {
      for (let i = 0; i < 16; i++) {
        this.particles.push(new Particle(
          enemy.x, enemy.y,
          (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160,
          '#fde047', 3.5, 0.5, 'spark'
        ));
      }
    }

    // Chance to drop Pickup (increased to 38% for more healing and powerups)
    if (Math.random() < 0.38) {
      const pTypes = ['health', 'health', 'rapid', 'fury'];
      const chosen = pTypes[Math.floor(Math.random() * pTypes.length)];
      this.pickups.push(new Pickup(enemy.x, enemy.y, chosen));
    }
  }

  rectIntersect(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
    return !(r2x > r1x + r1w || 
             r2x + r2w < r1x || 
             r2y > r1y + r1h || 
             r2y + r2h < r1y);
  }

  // -------------------------------------------------------------
  // HUD UPDATES
  // -------------------------------------------------------------
  updateHUD() {
    // Distance Traveled
    if (this.ui.distanceCounter) {
      const distMeters = Math.max(0, Math.floor((this.player.x - 200) / 10));
      this.ui.distanceCounter.textContent = `${distMeters} m`;
    }

    // Player HP
    const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    this.ui.hpFill.style.width = `${hpPercent}%`;
    this.ui.hpText.textContent = `${Math.ceil(this.player.hp)} / 100`;

    // Skull Hearts (5 hearts for 100 HP)
    const activeHearts = Math.ceil(this.player.hp / 20);
    this.ui.hearts.forEach((heart, idx) => {
      if (idx < activeHearts) {
        heart.classList.remove('lost');
      } else {
        heart.classList.add('lost');
      }
    });

    // Fury meter
    this.ui.furyFill.style.width = `${this.player.fury}%`;
    this.ui.furyText.textContent = this.player.fury >= 100 ? '¡LISTA [C]!' : `${Math.floor(this.player.fury)}%`;

    // Score & HighScore
    this.ui.score.textContent = String(this.score).padStart(5, '0');

    // Level Counter
    if (this.ui.levelCounter) {
      this.ui.levelCounter.textContent = this.level;
    }

    // Boss Progress Bar (Level 1) or Portal Progress Bar (Level 2)
    if (this.level === 1) {
      if (this.ui.bossGoalTitle) {
        this.ui.bossGoalTitle.textContent = 'INVOCACIÓN DEL JEFE (5000 PTS)';
      }
      if (!this.bossSpawned) {
        const prog = Math.min(100, (this.score / 5000) * 100);
        this.ui.bossProgressFill.style.width = `${prog}%`;
        this.ui.bossProgressText.textContent = `${Math.min(5000, this.score)} / 5000 PTS`;
      } else {
        this.ui.bossProgressFill.style.width = '100%';
        this.ui.bossProgressText.textContent = '¡¡¡JEFE EN COMBATE!!!';
      }
    } else {
      // NIVEL 2: CAMINO HACIA EL PORTAL DE SALIDA
      if (this.ui.bossGoalTitle) {
        this.ui.bossGoalTitle.textContent = '🌀 FINAL DEL CAMINO: PORTAL DE SALIDA 🌀';
      }
      const totalDist = Math.max(1, this.portalX - this.level2StartX);
      const currentDist = Math.max(0, this.player.x - this.level2StartX);
      const prog = Math.min(100, Math.max(0, (currentDist / totalDist) * 100));
      const remainingMeters = Math.max(0, Math.round((this.portalX - this.player.x) / 10));
      this.ui.bossProgressFill.style.width = `${prog}%`;
      this.ui.bossProgressText.textContent = remainingMeters <= 0 ? '¡¡¡CRUZA EL PORTAL!!!' : `${remainingMeters} m AL PORTAL`;
    }

    // Boss HP Bar
    if (this.boss && this.boss.alive) {
      const bossHpPercent = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
      this.ui.bossHpFill.style.width = `${bossHpPercent}%`;
      this.ui.bossHpText.textContent = `${Math.ceil(this.boss.hp)} / ${this.boss.maxHp} HP`;
    }
  }
}

// Initialize on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  new DesertGame();
});

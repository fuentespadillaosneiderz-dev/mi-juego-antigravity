// Main Game Engine & Controller
import { Player, CactusEnemy, ScorpionEnemy, GhostWolfEnemy, FlyingEnemy, Boss3Eyes, WitchEnemy, ZombieEnemy, GreenFlameSkeletonEnemy, MiniGhostEnemy, GhostKingBoss, ExitPortal, Pickup, FloatingText, Particle, FleeingCivilian } from './entities.js';
import { GameRenderer } from './renderer.js';
import { soundManager } from './audio.js';
import { TitleScreenManager } from './titleScreen.js';

class DesertGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new GameRenderer(this.canvas);
    this.groundY = this.renderer.groundY;

    // Game state
    this.state = 'menu'; // 'menu', 'playing', 'paused', 'gameover', 'victory', 'cinematic_roof_explosion', 'cinematic_ghost_king_defeat'
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
    this.civilians = [];
    this.civilianSpawnTimer = 1.0;
    this.projectiles = [];
    this.particles = [];
    this.pickups = [
      new Pickup(380, this.groundY - 14, 'health'),
      new Pickup(490, this.groundY - 14, 'rapid')
    ];
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
    this.portalX = 15200; // Recorrido del Nivel 1: exactamente 1,500 metros (15,000 px desde x=200)
    this.level2StartX = 0;
    this.level2StartScore = 0;
    this.zombieAnnounced = false;
    this.witchAnnounced = false;
    this.lastDistance10m = 0;

    this.bossWarningTimer = null;

    // LEVEL 3 & GHOST TRAIN PROPERTIES
    this.ghostTrainWaiting = false;
    this.ghostTrainX = 0;
    this.level3TotalTime = 240; // 4 minutos = 240 segundos de supervivencia
    this.level3TimeRemaining = 240;
    this.level3TickTimer = 0;
    this.level3ChugTimer = 0;
    this.level3DangerTimer = null;
    this.bossWrithingTimer = 0;
    this.bossWaitTimer = 0;

    // LEVEL 4 PROPERTIES (Inside Ghost Train & Ghost King Boss)
    this.level4StartX = 0;
    this.level4GoalDistance = 2000;
    this.ghostKing = null;
    this.ghostKingSpawned = false;
    this.ghostKingDefeated = false;
    this.roofHoleX = null;
    this.roofExplosionTimer = 0;
    this.playerJumpingIntoHole = false;
    this.level4DangerTimer = null;
    this.ghostKingWarningTimer = null;
    this.ghostKingDefeatTimer = 0;

    // Periodo de gracia de 10 segundos al iniciar cualquier nivel
    this.levelStartGraceTimer = 10.0;

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
      distanceBoxContainer: document.getElementById('distance-box-container'),
      pathTrackerGroup: document.getElementById('path-tracker-group'),
      skullClockWidget: document.getElementById('skull-clock-widget'),
      skullClockDigits: document.getElementById('skull-clock-digits'),
      skullClockFill: document.getElementById('skull-clock-fill'),

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
      level3DangerBanner: document.getElementById('level3-danger-banner'),
      level4DangerBanner: document.getElementById('level4-danger-banner'),
      ghostKingWarning: document.getElementById('ghost-king-warning-banner'),

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

      // Shoot on Space (towards mouse if inside canvas)
      if (e.code === 'Space' && this.state === 'playing') {
        const targetX = this.mouse.inside ? this.mouse.x + this.cameraX : null;
        const targetY = this.mouse.inside ? this.mouse.y : null;
        this.player.shoot(soundManager, this.projectiles, this.particles, targetX, targetY);
      }

      // Special Fury on KeyC
      if (e.code === 'KeyC' && this.state === 'playing') {
        this.player.triggerFury(soundManager, this.projectiles, this.particles, this.floatingTexts);
      }

      // Pause on Escape or P
      if ((e.code === 'KeyP' || e.code === 'Escape') && (this.state === 'playing' || this.state === 'paused')) {
        this.togglePause();
      }

      // Testing shortcut: KeyK o KeyN en Nivel 3 activa inmediatamente la explosión en el techo
      if ((e.code === 'KeyN' || e.code === 'KeyK') && this.state === 'playing' && this.level === 3) {
        this.level3TimeRemaining = 0.1;
        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 70, '💥 ¡DETONANDO AGUJERO EN EL TECHO! 🚂', '#f97316', 16));
      }

      // Shortcut KeyB: invocar Rey Fantasma inmediatamente en Nivel 4
      if (e.code === 'KeyB' && this.state === 'playing' && this.level === 4 && !this.ghostKingSpawned) {
        this.triggerGhostKingSpawn();
        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 70, '👑 ¡EL REY FANTASMA DESPIERTA! 💀', '#c084fc', 16));
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse Listeners on Canvas (Real-time aiming and clicking)
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
      this.mouse.inside = true;

      if (this.state === 'playing') {
        this.player.updateAim(this.mouse.x + this.cameraX, this.mouse.y);
      }
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
          this.player.updateAim(this.mouse.x + this.cameraX, this.mouse.y);
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

    if (this.ui.skullClockWidget) {
      this.ui.skullClockWidget.addEventListener('click', () => {
        if (this.level === 3 && this.state === 'playing') {
          this.level3TimeRemaining = 5;
          this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 70, '⚡ CRONÓMETRO: 5 SEGUNDOS (TEST)', '#facc15', 15));
        }
      });
    }
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
    if (this.titleScreenManager) this.titleScreenManager.hideAllScreens();
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
    this.pickups = [
      new Pickup(380, this.groundY - 14, 'health'),
      new Pickup(490, this.groundY - 14, 'rapid')
    ];
    this.floatingTexts = [];
    this.boss = null;

    // Reset Level 1 state: portal a los 1500 metros (15200 px)
    this.level = 1;
    this.groundY = 460;
    this.renderer.groundY = 460;
    this.portalX = 15200;
    this.portal = new ExitPortal(this.portalX, this.groundY);
    this.level2StartX = 0;
    this.level2StartScore = 0;
    this.zombieAnnounced = false;
    this.witchAnnounced = false;
    this.lastDistance10m = 0;
    this.witchSpawnTimer = 3.5;

    this.ghostTrainWaiting = false;
    this.ghostTrainX = 0;
    this.level3TotalTime = 240;
    this.level3TimeRemaining = 240;
    this.level3TickTimer = 0;
    this.level3ChugTimer = 0;
    this.bossWrithingTimer = 0;
    this.bossWaitTimer = 0;

    // Hide Modals and reset warnings
    if (this.bossWarningTimer) {
      clearTimeout(this.bossWarningTimer);
      this.bossWarningTimer = null;
    }
    if (this.level2BannerTimer) {
      clearTimeout(this.level2BannerTimer);
      this.level2BannerTimer = null;
    }
    if (this.level3DangerTimer) {
      clearTimeout(this.level3DangerTimer);
      this.level3DangerTimer = null;
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
    if (this.ui.level3DangerBanner) this.ui.level3DangerBanner.classList.add('hidden');
    if (this.ui.skullClockWidget) this.ui.skullClockWidget.classList.add('hidden');
    if (this.ui.pathTrackerGroup) this.ui.pathTrackerGroup.classList.remove('hidden');

    // Al comenzar nivel, 10 segundos de gracia antes de que aparezcan los primeros monstruos
    this.levelStartGraceTimer = 10.0;
    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 70,
      '⏳ ¡PREPÁRATE! MONSTRUOS EN 10 SEGUNDOS ⏳',
      '#38bdf8',
      16
    ));

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

    if (this.state === 'playing' || this.state === 'cinematic_train_arrival' || this.state === 'cinematic_boss_death' || this.state === 'cinematic_boss_wait' || this.state === 'cinematic_roof_explosion' || this.state === 'cinematic_ghost_king_defeat') {
      this.update(dt);
    }

    this.renderer.clear();
    this.renderer.renderScene(this);

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  update(dt) {
    // -----------------------------------------------------------
    // CINEMATIC: ROOF EXPLOSION & ENTERING TUNNEL / CAR (LEVEL 3 -> 4)
    // Cuando se supera el nivel 3, dejan de aparecer monstruos.
    // En el techo del tren se abre un agujero hecho por una pequeña explosión.
    // El personaje salta y entra dentro del tren, que entra al túnel.
    // -----------------------------------------------------------
    if (this.state === 'cinematic_roof_explosion') {
      this.time += dt;
      this.roofExplosionTimer = (this.roofExplosionTimer || 0) + dt;

      // Asegurar que no queden monstruos ni proyectiles
      this.enemies = [];
      this.projectiles = [];

      // Fase 1 (0 a 0.7s): Pequeña explosión en el techo frente al jugador
      if (this.roofExplosionTimer < 0.7) {
        if (Math.random() < 0.6) {
          this.particles.push(new Particle(
            this.roofHoleX + (Math.random() - 0.5) * 35,
            350,
            (Math.random() - 0.5) * 140,
            -60 - Math.random() * 120,
            Math.random() < 0.5 ? '#34d399' : '#f97316',
            4, 0.45, 'spark', 200
          ));
        }
      } else if (this.roofExplosionTimer >= 0.7 && !this.playerJumpingIntoHole) {
        // Fase 2: El personaje salta hacia el agujero
        this.playerJumpingIntoHole = true;
        this.player.isAutoWalking = true;
        this.player.facing = 1;
        this.player.vy = -330; // Salto parabólico hacia el agujero
        this.player.vx = 140;
      }

      // Si el personaje está sobre el agujero, permitir que caiga dentro del vagón (groundY = 520)
      const isOverHole = Math.abs(this.player.x - this.roofHoleX) < 45;
      const effectiveGround = (isOverHole && this.player.y >= 300) ? 520 : this.groundY;

      this.player.update(dt, this.keys, effectiveGround, soundManager, this.particles, this.projectiles, this.cameraX);

      const targetCam = Math.max(0, this.player.x - 240);
      this.cameraX += (targetCam - this.cameraX) * 5.0 * dt;

      this.particles = this.particles.filter(p => p.update(dt));
      this.floatingTexts = this.floatingTexts.filter(ft => ft.update(dt));
      this.renderer.updateEnvironment(dt, this.cameraX);

      // Fase 3: Cuando el personaje alcanza el agujero y desciende dentro del tren
      const reachedHole = (this.playerJumpingIntoHole || isOverHole) && (this.player.y >= 335 || (this.player.x >= this.roofHoleX - 10 && this.roofExplosionTimer >= 1.5));
      if (reachedHole || this.roofExplosionTimer >= 2.4) {
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isAutoWalking = false;
        this.playerJumpingIntoHole = false;
        soundManager.playTunnelRumble();
        soundManager.playTrainWhistle();
        soundManager.playSpookyTransition();
        this.titleScreenManager.showLevel4Transition();
      }
      return;
    }

    // -----------------------------------------------------------
    // CINEMATIC: GHOST KING DEFEAT (LEVEL 4 VICTORY)
    // El fantasma se agrieta y la pantalla se oscurece lentamente
    // -----------------------------------------------------------
    if (this.state === 'cinematic_ghost_king_defeat') {
      this.time += dt;
      this.ghostKingDefeatTimer = (this.ghostKingDefeatTimer || 0) + dt;

      if (this.ghostKing) {
        this.ghostKing.state = 'defeated';
        if (Math.random() < 0.35) {
          this.particles.push(new Particle(
            this.ghostKing.x + (Math.random() - 0.5) * 100,
            this.ghostKing.y + (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 30,
            -15 - Math.random() * 25,
            '#e2e8f0', 3, 0.45, 'smoke'
          ));
        }
      }

      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isAutoWalking = false;
      this.autoFire = false;
      this.player.update(dt, {}, this.groundY, soundManager, this.particles, this.projectiles, this.cameraX);

      this.particles = this.particles.filter(p => p.update(dt));
      this.floatingTexts = this.floatingTexts.filter(ft => ft.update(dt));
      this.renderer.updateEnvironment(dt, this.cameraX);

      if (this.ghostKingDefeatTimer >= 2.8) {
        this.titleScreenManager.showTrainExplosionCinematic();
      }
      return;
    }

    // -----------------------------------------------------------
    // CINEMATIC: BOSS DEATH - WRITHING AGONY BEFORE GREEN EXPLOSION
    // El monstruo de 3 ojos se retuerce convulsivamente
    // El personaje se queda completamente quieto mirando
    // -----------------------------------------------------------
    if (this.state === 'cinematic_boss_death') {
      this.time += dt;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isAutoWalking = false;
      if (this.boss) {
        this.player.facing = this.boss.x > this.player.x ? 1 : -1;
      }
      this.autoFire = false;

      // Actualizar postura del personaje quieto mirando
      this.player.update(dt, {}, this.groundY, soundManager, this.particles, this.projectiles, this.cameraX);

      // Cámara suave encuadrando al jugador y al jefe retorciéndose
      if (this.boss) {
        const targetCam = Math.max(0, (this.player.x + this.boss.x) / 2 - 460);
        this.cameraX += (targetCam - this.cameraX) * 4.0 * dt;
      }

      // El monstruo de 3 ojos se retuerce en agonía expulsando chispas y humo verde
      if (this.boss) {
        this.boss.updateWrithing(dt, this.particles);
      }

      this.particles = this.particles.filter(p => p.update(dt));
      this.floatingTexts = this.floatingTexts.filter(ft => ft.update(dt));
      this.renderer.updateEnvironment(dt, this.cameraX);

      this.bossWrithingTimer -= dt;
      if (this.bossWrithingTimer <= 0) {
        this.triggerBossGreenExplosion();
      }
      return;
    }

    // -----------------------------------------------------------
    // CINEMATIC: POST-EXPLOSION - 5 SEGUNDOS QUIETO MIRANDO
    // Cuando el monstruo explota, el personaje espera 5 segundos
    // quieto observando el humo y las llamas verdes disiparse
    // -----------------------------------------------------------
    if (this.state === 'cinematic_boss_wait') {
      this.time += dt;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isAutoWalking = false;
      this.player.facing = 1;
      this.autoFire = false;

      // El personaje sigue quieto mirando
      this.player.update(dt, {}, this.groundY, soundManager, this.particles, this.projectiles, this.cameraX);

      this.particles = this.particles.filter(p => p.update(dt));
      this.floatingTexts = this.floatingTexts.filter(ft => ft.update(dt));
      this.renderer.updateEnvironment(dt, this.cameraX);

      this.bossWaitTimer -= dt;
      if (this.bossWaitTimer <= 0) {
        // Al terminar los 5 segundos, se mueve para subirse al tren fantasma
        this.triggerGhostTrainArrivalCutscene();
      }
      return;
    }

    // -----------------------------------------------------------
    // CINEMATIC: PLAYER AUTO-WALKING TO BOARD GHOST TRAIN
    // -----------------------------------------------------------
    if (this.state === 'cinematic_train_arrival') {
      this.time += dt;
      this.player.isAutoWalking = true;
      this.player.facing = 1;
      this.player.update(dt, this.keys, this.groundY, soundManager, this.particles, this.projectiles, this.cameraX);

      const targetCam = Math.max(0, this.player.x - 240);
      this.cameraX += (targetCam - this.cameraX) * 5.0 * dt;

      this.particles = this.particles.filter(p => p.update(dt));
      this.floatingTexts = this.floatingTexts.filter(ft => ft.update(dt));
      this.renderer.updateEnvironment(dt, this.cameraX);

      // When the skeleton gunslinger reaches the carriage boarding steps (ghostTrainX + 18)
      if (this.player.x >= this.ghostTrainX + 18) {
        this.player.vx = 0;
        this.player.isAutoWalking = false;
        this.titleScreenManager.showBoardingCinematic();
      }
      return;
    }

    this.time += dt;

    // LEVEL 3 ROOFTOP SURVIVAL & 4-MINUTE CLOCK COUNTDOWN
    if (this.level === 3) {
      this.groundY = 350; // Lock ground on top of the ghost train roof
      this.renderer.groundY = 350;

      // 4 Minutes Survival countdown
      this.level3TimeRemaining -= dt;
      if (this.level3TimeRemaining <= 0) {
        this.level3TimeRemaining = 0;
        this.triggerRoofExplosionCutscene();
        return;
      }

      // Skull clock tick sound every second
      this.level3TickTimer += dt;
      if (this.level3TickTimer >= 1.0) {
        this.level3TickTimer = 0;
        soundManager.playClockTick();
      }

      // Periodic Ghost Train chugging sound
      this.level3ChugTimer += dt;
      if (this.level3ChugTimer >= 4.0) {
        this.level3ChugTimer = 0;
        soundManager.playTrainChug();
      }
    }

    // Combo timer decay
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.ui.comboDisplay.classList.add('hidden');
      }
    }

    // Camera follow progression: moves right as player walks and advances through desert / train
    if (this.boss && this.boss.alive) {
      const targetCam = this.bossArenaCam;
      this.cameraX += (targetCam - this.cameraX) * 5.0 * dt;
    } else {
      const targetCam = Math.max(0, this.player.x - 240);
      this.cameraX += (targetCam - this.cameraX) * 7.0 * dt;
    }

    // Update Player aim direction with mouse coordinates
    if (this.mouse.inside) {
      this.player.updateAim(this.mouse.x + this.cameraX, this.mouse.y);
    }

    // Avance de recorrido: cada 10 metros recorridos otorga +20 puntos
    const current10m = Math.floor((this.player.x - 200) / 100);
    if (current10m > this.lastDistance10m) {
      const diff = current10m - this.lastDistance10m;
      this.score += diff * 20;
      this.lastDistance10m = current10m;
    }

    // Auto-fire handling: if mouse is pressed or autofire on, aim directly at cursor
    // En Nivel 4: Si el Rey Fantasma está succionando con su enorme boca, NO podemos disparar
    const canShoot = !(this.ghostKing && this.ghostKing.alive && this.ghostKing.isSuctionActive);
    if (canShoot && (this.autoFire || this.mouse.isDown)) {
      this.autoFireTimer += dt;
      const rate = this.player.rapidFireTimer > 0 ? 0.08 : 0.16;
      if (this.autoFireTimer >= rate) {
        this.autoFireTimer = 0;
        const targetX = this.mouse.inside ? this.mouse.x + this.cameraX : null;
        const targetY = this.mouse.inside ? this.mouse.y : null;
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
          this.floatingTexts.push(new FloatingText(p.x, p.y, '+35 HP 🧰 BOTIQUÍN', '#4ade80'));
        } else if (p.type === 'rapid') {
          this.player.rapidFireTimer = 8.0;
          this.floatingTexts.push(new FloatingText(p.x, p.y, '¡CALAVERA DE TRIPLE FUEGO! 💀🔥', '#34d399'));
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

    // 5. Boss Trigger: LEVEL 2 at 2000m & LEVEL 4 at 2000m
    if (this.level === 2 && !this.bossSpawned) {
      const level2MetersWalked = Math.max(0, Math.floor((this.player.x - this.level2StartX) / 10));
      if (level2MetersWalked >= 2000) {
        this.triggerBossSpawn();
      }
    } else if (this.level === 4 && !this.ghostKingSpawned) {
      const level4MetersWalked = Math.max(0, Math.floor((this.player.x - this.level4StartX) / 10));
      if (level4MetersWalked >= 2000) {
        this.triggerGhostKingSpawn();
      }
    }

    // Update Boss (Only active in Level 2)
    if (this.boss && this.level === 2 && this.state === 'playing') {
      if (this.boss.state !== 'writhing') {
        this.boss.update(dt, this.player, this.projectiles, soundManager, this.particles, () => {
          // Boss summon minion callback
          this.enemies.push(new FlyingEnemy(this.cameraX + 960 + 40, 120 + Math.random() * 80));
        });

        if (this.boss.hp <= 0 && !this.bossDefeated && this.state !== 'cinematic_boss_death' && this.state !== 'cinematic_boss_wait') {
          this.startBossDeathCinematic();
        }
      }
    }

    // Update Ghost King Boss (Level 4: El Rey Fantasma)
    if (this.ghostKing && this.level === 4 && this.state === 'playing') {
      this.ghostKing.update(dt, this.player, this.cameraX, soundManager, this.particles, (spawnCount) => {
        // Invocación de los 3 fantasmas pequeños
        for (let i = 0; i < spawnCount; i++) {
          const spawnSide = this.ghostKing.side === 1 ? -1 : 1;
          const gx = spawnSide === 1 ? this.cameraX + 960 - 70 - i * 50 : this.cameraX + 70 + i * 50;
          const gy = 180 + (i % 2) * 60;
          const miniGhost = new MiniGhostEnemy(gx, gy, 1.2);
          this.enemies.push(miniGhost);
          this.ghostKing.registerMiniGhost(miniGhost);
        }
      });

      if (this.ghostKing.hp <= 0 && !this.ghostKingDefeated && this.state !== 'cinematic_ghost_king_defeat') {
        this.startGhostKingDefeatCinematic();
      }
    }

    // 5.5 Update Exit Portal (Level 1 Portal leading to Level 2)
    if (this.portal && this.level === 1) {
      this.portal.update(dt, this.particles);

      const portHit = this.portal.getHitbox();
      if (this.rectIntersect(pHit.x, pHit.y, pHit.width, pHit.height, portHit.x, portHit.y, portHit.width, portHit.height)) {
        this.handlePortalToLevel2();
      }
    }

    // 6. Update Projectiles
    this.projectiles.forEach(p => p.update(dt, this.particles, this.groundY, this.cameraX));
    this.projectiles = this.projectiles.filter(p => p.alive && p.x > this.cameraX - 250 && p.x < this.cameraX + 1350);

    // 6.5. Update Fleeing Civilians (Nivel 4: Pasajeros asustados)
    if (this.civilians && this.civilians.length > 0) {
      this.civilians = this.civilians.filter(c => c.update(dt, this.cameraX, this.floatingTexts));
    }

    // 7. Check Collisions
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
  // ENEMY SPAWNING LOGIC (SCROLLING DESERT & GHOST TRAIN HORDE)
  // -------------------------------------------------------------
  handleEnemySpawning(dt) {
    // Si estamos luchando contra el Jefe de Nivel 2 o el Rey Fantasma de Nivel 4, DEJAN de aparecer monstruos comunes
    if ((this.bossSpawned && this.boss && this.boss.alive) || 
        (this.level === 4 && this.ghostKingSpawned && this.ghostKing && this.ghostKing.alive)) {
      return;
    }

    // -----------------------------------------------------------
    // DEMORA DE 10 SEGUNDOS AL INICIAR CUALQUIER NIVEL
    // "ahora cada vez que comiences un nivel los monstruos no aparecerán enseguida, tendrán 10 segundos en aparecer"
    // -----------------------------------------------------------
    if (this.levelStartGraceTimer > 0) {
      this.levelStartGraceTimer -= dt;
      return;
    }

    // -----------------------------------------------------------
    // LEVEL 4: INTERIOR DEL TREN FANTASMA (VAGÓN MALDITO)
    // "solo apareceran los moutras que caminan y no los que buelan"
    // Aparece el nuevo Esqueleto con fuego verde y aura negra con garrote
    // Pasajeros civiles corriendo en la dirección contraria huyendo
    // -----------------------------------------------------------
    if (this.level === 4) {
      // Generar Pasajeros Civiles huyendo en pánico hacia la izquierda (dirección contraria)
      this.civilianSpawnTimer = (this.civilianSpawnTimer || 1.0) - dt;
      if (this.civilianSpawnTimer <= 0) {
        this.civilianSpawnTimer = 2.4 + Math.random() * 2.6;
        const spawnX = this.cameraX + 960 + 50 + Math.random() * 80;
        this.civilians.push(new FleeingCivilian(spawnX, this.groundY));
      }

      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 1.0 + Math.random() * 0.8;
        const spawnRight = Math.random() < 0.6;
        const sx = spawnRight ? this.cameraX + 960 + 40 : this.cameraX - 40;
        const roll = Math.random();

        // Mayor probabilidad del nuevo Esqueleto de Fuego Verde (45%)
        if (roll < 0.45) {
          this.enemies.push(new GreenFlameSkeletonEnemy(sx, this.groundY, 1.3));
        } else if (roll < 0.70) {
          this.enemies.push(new ZombieEnemy(sx, this.groundY, 1.8));
        } else if (roll < 0.88) {
          this.enemies.push(new GhostWolfEnemy(sx, this.groundY, 1.7));
        } else {
          this.enemies.push(new ScorpionEnemy(sx, this.groundY, 1.5));
        }
      }
      return; // ¡NO se ejecutan generadores de enemigos voladores en el Nivel 4!
    }

    // -----------------------------------------------------------
    // LEVEL 3: MASSIVE MONSTER HORDE ON GHOST TRAIN ROOF
    // Monstruos aparecen por todas partes. JEFE DE 3 OJOS NO PUEDE APARECER.
    // -----------------------------------------------------------
    if (this.level === 3) {
      // 1. Swarming Flying Bats & Demon Eyes swooping from both flanks
      this.flyingSpawnTimer -= dt;
      if (this.flyingSpawnTimer <= 0) {
        this.flyingSpawnTimer = 0.8 + Math.random() * 0.7;
        const spawnRight = Math.random() < 0.55;
        const fx = spawnRight ? this.cameraX + 960 + 50 : this.cameraX - 60;
        const fy = 60 + Math.random() * 160;
        this.enemies.push(new FlyingEnemy(fx, fy, 2.0));
      }

      // 2. Flying Witches in Brooms launching magic orbs across the train
      this.witchSpawnTimer -= dt;
      if (this.witchSpawnTimer <= 0) {
        this.witchSpawnTimer = 2.2 + Math.random() * 1.5;
        const spawnRight = Math.random() < 0.6;
        const wx = spawnRight ? this.cameraX + 960 + 60 : this.cameraX - 60;
        const wy = 80 + Math.random() * 110;
        this.enemies.push(new WitchEnemy(wx, wy, 1.8));
      }

      // 3. Ground / Rooftop Leap Attackers (Zombies, wolves, scorpions)
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 0.8 + Math.random() * 0.6;
        const spawnRight = Math.random() < 0.55;
        const rx = spawnRight ? this.cameraX + 960 + 40 : this.cameraX - 40;
        const rand = Math.random();
        if (rand < 0.5) {
          this.enemies.push(new ZombieEnemy(rx, this.groundY, 2.2));
        } else if (rand < 0.8) {
          this.enemies.push(new GhostWolfEnemy(rx, this.groundY, 2.4));
        } else {
          this.enemies.push(new ScorpionEnemy(rx, this.groundY, 2.0));
        }
      }
      return;
    }

    // Calcular distancia recorrida en el nivel actual para escalar la agresividad de los monstruos
    const distMeters = this.level === 1 
      ? Math.max(0, Math.floor((this.player.x - 200) / 10))
      : Math.max(0, Math.floor((this.player.x - this.level2StartX) / 10));
    const goalMeters = this.level === 1 ? 1500 : 2000;
    const progressRatio = Math.min(2.0, distMeters / goalMeters);
    const aggression = 1.0 + progressRatio * 1.5;

    // Ground Enemies Spawning (Cactus, Scorpion, Wolf, and Zombies at 1000 pts in Level 1)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.75, (2.6 - progressRatio * 1.3) / (1 + (aggression - 1) * 0.35));

      const spawnRight = Math.random() < 0.82;
      const spawnX = spawnRight ? this.cameraX + 960 + 60 + Math.random() * 120 : this.cameraX - 50;
      const rand = Math.random();

      // En el Nivel 1 al tener 1000 puntos, aparecen los ZOMBIES
      if (this.level === 1 && this.score >= 1000) {
        if (!this.zombieAnnounced) {
          this.zombieAnnounced = true;
          this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 70, '🧟 ¡HORDA ZOMBIE DESPERTADA (1000 PTS)!', '#84cc16', 15));
        }

        if (rand < 0.25) {
          this.enemies.push(new CactusEnemy(spawnX, this.groundY, aggression));
        } else if (rand < 0.45) {
          this.enemies.push(new ScorpionEnemy(spawnX, this.groundY, aggression));
        } else if (rand < 0.65) {
          this.enemies.push(new GhostWolfEnemy(spawnX, this.groundY, aggression));
        } else {
          this.enemies.push(new ZombieEnemy(spawnX, this.groundY, aggression));
        }
      } else {
        if (rand < 0.40) {
          this.enemies.push(new CactusEnemy(spawnX, this.groundY, aggression));
        } else if (rand < 0.72) {
          this.enemies.push(new ScorpionEnemy(spawnX, this.groundY, aggression));
        } else {
          this.enemies.push(new GhostWolfEnemy(spawnX, this.groundY, aggression));
        }
      }

      if (aggression > 1.4 && Math.random() < 0.35) {
        const flankX = spawnRight ? this.cameraX - 60 : this.cameraX + 960 + 80;
        if (Math.random() < 0.5) {
          this.enemies.push(new GhostWolfEnemy(flankX, this.groundY, aggression));
        } else {
          this.enemies.push(new ScorpionEnemy(flankX, this.groundY, aggression));
        }
      }
    }

    // MONSTRUOS VOLADORES (Flying Bats / Demon Eyes)
    this.flyingSpawnTimer -= dt;
    if (this.flyingSpawnTimer <= 0) {
      this.flyingSpawnTimer = Math.max(1.6, (4.4 - progressRatio * 1.8) / (1 + (aggression - 1) * 0.35));
      const spawnX = this.cameraX + 960 + 50 + Math.random() * 100;
      const spawnY = 80 + Math.random() * 140;
      this.enemies.push(new FlyingEnemy(spawnX, spawnY, aggression));
    }

    // NIVEL 2: LA BRUJA VOLADORA APARECE AL TENER 1000 PUNTOS
    if (this.level === 2) {
      const lvl2Score = this.score - this.level2StartScore;
      if (lvl2Score >= 1000) {
        if (!this.witchAnnounced) {
          this.witchAnnounced = true;
          this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 70, '🧙‍♀️ ¡BRUJAS EN ESCOBA LIBERADAS (1000 PTS)!', '#facc15', 15));
        }
        this.witchSpawnTimer -= dt;
        if (this.witchSpawnTimer <= 0) {
          this.witchSpawnTimer = Math.max(1.8, (3.0 + Math.random() * 2.0) / aggression);
          const spawnX = this.cameraX + 960 + 70 + Math.random() * 120;
          const spawnY = 90 + Math.random() * 120;
          this.enemies.push(new WitchEnemy(spawnX, spawnY, aggression));
        }
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

  handlePortalToLevel2() {
    soundManager.playPortalWarp();
    this.renderer.addScreenShake(20, 2.0);

    // Cosmic portal particles
    for (let i = 0; i < 85; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 100 + Math.random() * 340;
      this.particles.push(new Particle(
        this.player.x, this.player.y,
        Math.cos(a) * s, Math.sin(a) * s,
        Math.random() < 0.5 ? '#38bdf8' : '#a855f7', 5, 1.2, 'spark'
      ));
    }

    // Floating text notification
    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 70,
      '🌀 ¡PORTAL COMPLETADO! CARGANDO NIVEL 2 🌀',
      '#38bdf8',
      16
    ));

    // Show Level 2 Interstitial Screen (Imagen oficial con LEVEL 2 - PRESS BUTTON 1)
    if (this.titleScreenManager) {
      this.titleScreenManager.showLevel2Transition();
    } else {
      this.startLevel2();
    }
  }

  startLevel2(fresh = false) {
    if (this.titleScreenManager) this.titleScreenManager.hideAllScreens();
    this.level = 2;
    this.state = 'playing';
    this.groundY = 460;
    this.renderer.groundY = 460;

    if (fresh || !this.player) {
      this.player = new Player(200, this.groundY - 35);
      this.player.hp = this.player.maxHp;
      this.player.fury = 0;
      this.cameraX = 0;
      this.level2StartX = 200;
      this.level2StartScore = 0;
      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.pickups = [];
      this.floatingTexts = [];
    } else {
      this.level2StartX = this.player.x;
      this.level2StartScore = this.score;
    }

    this.boss = null;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.witchAnnounced = false;
    this.portal = null; // Close portal once traversed
    this.autoFire = true;

    soundManager.setBossMode(false);
    soundManager.startMusic();

    // 10 segundos de gracia al comenzar Nivel 2
    this.levelStartGraceTimer = 10.0;

    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 70,
      '🧙‍♀️ ¡NIVEL 2: 2000 METROS &bull; MONSTRUO A LOS 2000M! 👁️',
      '#f59e0b',
      16
    ));

    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 95,
      '⏳ ¡PREPÁRATE! MONSTRUOS EN 10 SEGUNDOS ⏳',
      '#38bdf8',
      16
    ));

    // Show Level 2 Banner for 4.8 seconds
    if (this.ui.level2Banner) {
      this.ui.level2Banner.classList.remove('hidden');
      if (this.level2BannerTimer) clearTimeout(this.level2BannerTimer);
      this.level2BannerTimer = setTimeout(() => {
        this.ui.level2Banner.classList.add('hidden');
        this.level2BannerTimer = null;
      }, 4800);
    }
  }

  startBossDeathCinematic() {
    this.state = 'cinematic_boss_death';
    this.bossWrithingTimer = 3.5;
    this.autoFire = false;

    if (this.boss) {
      this.boss.state = 'writhing';
      this.boss.laserCharging = false;
      this.boss.laserFiring = false;
      this.boss.hitFlash = 0;
    }

    // El personaje se queda completamente quieto mirando
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isAutoWalking = false;
    if (this.boss) {
      this.player.facing = this.boss.x > this.player.x ? 1 : -1;
    }

    // Despejar enemigos y proyectiles para que el jugador observe seguro
    this.enemies = [];
    this.projectiles = this.projectiles.filter(p => p.isPlayer);

    // Ocultar HUD del jefe y detener música de combate
    if (this.ui.bossHud) this.ui.bossHud.classList.add('hidden');
    soundManager.setBossMode(false);

    // Temblor de pantalla inicial por la agonía del monstruo
    this.renderer.addScreenShake(12, 3.5);

    this.floatingTexts.push(new FloatingText(
      this.boss ? this.boss.x : this.player.x + 250,
      (this.boss ? this.boss.y : 150) - 80,
      '¡¡¡EL MONSTRUO DE 3 OJOS SE RETUERCE EN AGONÍA!!!',
      '#34d399',
      18
    ));
  }

  triggerBossGreenExplosion() {
    soundManager.playExplosion(true);
    this.renderer.addScreenShake(32, 2.5);

    const bx = this.boss ? this.boss.x : this.player.x + 350;
    const by = this.boss ? this.boss.y : 150;

    // Gran explosión de llamas verdes: más de 220 partículas en tonos esmeralda, jade, lima y menta
    const greenFlames = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#a7f3d0', '#22c55e', '#fef08a'];
    for (let i = 0; i < 220; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 480;
      const col = greenFlames[Math.floor(Math.random() * greenFlames.length)];
      const size = 4 + Math.random() * 8;
      const life = 1.2 + Math.random() * 1.6;
      this.particles.push(new Particle(
        bx + (Math.random() - 0.5) * 40,
        by + (Math.random() - 0.5) * 40,
        Math.cos(a) * speed,
        Math.sin(a) * speed,
        col,
        size,
        life,
        'circle'
      ));
    }

    // Columnas ascendentes de fuego verde
    for (let f = 0; f < 45; f++) {
      const col = greenFlames[Math.floor(Math.random() * greenFlames.length)];
      this.particles.push(new Particle(
        bx + (Math.random() - 0.5) * 80,
        by + 40 + (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 120,
        -180 - Math.random() * 220,
        col,
        6 + Math.random() * 6,
        1.8 + Math.random() * 1.0,
        'circle'
      ));
    }

    if (this.boss) {
      this.score += this.boss.points;
      this.updateHighScore();
      this.sendScoreToBackend();
      this.boss.alive = false;
      this.boss.active = false;
      this.boss.exploded = true;
    }
    this.bossDefeated = true;

    this.floatingTexts.push(new FloatingText(
      bx, by - 60,
      '💥 ¡¡¡EXPLOSIÓN DE LLAMAS VERDES!!! 💥',
      '#34d399',
      20
    ));

    // Tras la explosión, el personaje espera 5 segundos quieto mirando
    this.state = 'cinematic_boss_wait';
    this.bossWaitTimer = 5.0;
  }

  triggerGhostTrainArrivalCutscene() {
    this.state = 'cinematic_train_arrival';
    this.ghostTrainWaiting = true;
    this.ghostTrainX = Math.max(this.player.x + 320, this.cameraX + 460);
    this.player.isAutoWalking = true;
    this.player.facing = 1;
    this.autoFire = false;
    soundManager.playTrainWhistle();

    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 75,
      '🚂 ¡EL TREN FANTASMA HA LLEGADO! 🚂',
      '#34d399',
      18
    ));
  }

  startLevel3() {
    if (this.titleScreenManager) this.titleScreenManager.hideAllScreens();
    this.level = 3;
    this.state = 'playing';
    this.groundY = 350; // Train roof platform height
    this.renderer.groundY = 350;
    this.player.y = 350 - 35;
    this.player.x = 220;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isAutoWalking = false;
    this.player.hp = this.player.maxHp;
    this.autoFire = true;

    // Ensure 3-eyed boss NEVER appears in Level 3
    this.boss = null;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.ghostTrainWaiting = false;

    // 4 Minutes Survival Goal: 240 seconds
    this.level3TotalTime = 240;
    this.level3TimeRemaining = 240;
    this.level3ChugTimer = 0;
    this.level3TickTimer = 0;

    // Clear previous enemies and bullets
    this.enemies = [];
    this.projectiles = [];

    // UI Updates: Switch from path tracker to Skull Survival Clock
    if (this.ui.levelCounter) this.ui.levelCounter.textContent = '3';
    if (this.ui.pathTrackerGroup) this.ui.pathTrackerGroup.classList.add('hidden');
    if (this.ui.skullClockWidget) this.ui.skullClockWidget.classList.remove('hidden');
    if (this.ui.bossHud) this.ui.bossHud.classList.add('hidden');

    // Danger Alert Banner for Level 3 Monster Horde
    if (this.ui.level3DangerBanner) {
      this.ui.level3DangerBanner.classList.remove('hidden');
      soundManager.playDangerAlarm();
      soundManager.playTrainWhistle();
      this.renderer.addScreenShake(24, 2.5);

      if (this.level3DangerTimer) clearTimeout(this.level3DangerTimer);
      this.level3DangerTimer = setTimeout(() => {
        if (this.ui.level3DangerBanner) this.ui.level3DangerBanner.classList.add('hidden');
        this.level3DangerTimer = null;
      }, 4800);
    }

    soundManager.startMusic();
    soundManager.playTrainChug();

    // 10 segundos de gracia al comenzar Nivel 3 en el techo del tren
    this.levelStartGraceTimer = 10.0;

    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 70,
      '🚂 ¡NIVEL 3: EL TECHO DEL TREN FANTASMA! 💀',
      '#34d399',
      18
    ));

    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 95,
      '⏳ ¡PREPÁRATE! LA HORDA APARECE EN 10 SEGUNDOS ⏳',
      '#38bdf8',
      16
    ));
  }

  triggerRoofExplosionCutscene() {
    this.state = 'cinematic_roof_explosion';
    this.roofExplosionTimer = 0;
    this.playerJumpingIntoHole = false;
    this.enemies = [];
    this.projectiles = [];
    this.roofHoleX = Math.round(this.player.x + 130);
    this.renderer.roofHoleX = this.roofHoleX;

    soundManager.playRoofExplosion();
    soundManager.playTrainWhistle();
    this.renderer.addScreenShake(24, 2.2);

    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 70,
      '💥 ¡EXPLOSIÓN EN EL TECHO! ¡SALTA AL AGUJERO! 🚂',
      '#f97316',
      18
    ));
  }

  startLevel4(instantBoss = false) {
    if (this.titleScreenManager) this.titleScreenManager.hideAllScreens();
    this.level = 4;
    this.state = 'playing';
    this.groundY = 460; // Wooden carriage floor
    this.renderer.groundY = 460;

    // Reset player position and full HP
    this.player = new Player(200, this.groundY - 35);
    this.player.hp = this.player.maxHp;
    this.player.fury = 0;
    this.player.isAutoWalking = false;
    this.player.vx = 0;
    this.player.vy = 0;
    this.autoFire = true;

    this.cameraX = 0;
    this.level4StartX = 200;
    this.ghostKing = null;
    this.ghostKingSpawned = false;
    this.ghostKingDefeated = false;
    this.roofHoleX = null;
    this.renderer.roofHoleX = null;

    this.enemies = [];
    this.civilians = [];
    this.civilianSpawnTimer = 0.8;
    this.projectiles = [];
    this.particles = [];
    this.pickups = [];
    this.floatingTexts = [];

    // UI Updates: Switch to Level 4 tracker
    if (this.ui.levelCounter) this.ui.levelCounter.textContent = '4';
    if (this.ui.skullClockWidget) this.ui.skullClockWidget.classList.add('hidden');
    if (this.ui.pathTrackerGroup) this.ui.pathTrackerGroup.classList.remove('hidden');
    if (this.ui.bossHud) this.ui.bossHud.classList.add('hidden');

    // Danger Alert Banner for Level 4
    if (this.ui.level4DangerBanner) {
      this.ui.level4DangerBanner.classList.remove('hidden');
      soundManager.playDangerAlarm();
      soundManager.playTunnelRumble();
      this.renderer.addScreenShake(20, 2.0);

      if (this.level4DangerTimer) clearTimeout(this.level4DangerTimer);
      this.level4DangerTimer = setTimeout(() => {
        if (this.ui.level4DangerBanner) this.ui.level4DangerBanner.classList.add('hidden');
        this.level4DangerTimer = null;
      }, 4800);
    }

    soundManager.startMusic();
    soundManager.playTunnelRumble();

    // 10 segundos de gracia al comenzar Nivel 4 dentro del tren
    this.levelStartGraceTimer = 10.0;

    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 70,
      '👻 ¡NIVEL 4: EL INTERIOR DEL TREN FANTASMA! (2000 m) 🚂',
      '#10b981',
      18
    ));

    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 95,
      '⏳ ¡PREPÁRATE! MONSTRUOS EN 10 SEGUNDOS ⏳',
      '#38bdf8',
      16
    ));

    this.updateHUD();

    if (instantBoss) {
      setTimeout(() => {
        this.triggerGhostKingSpawn();
      }, 400);
    }
  }

  triggerGhostKingSpawn() {
    this.ghostKingSpawned = true;
    this.enemies = []; // Monstruos comunes dejan de aparecer durante el combate
    this.projectiles = [];

    soundManager.playGhostRoar();
    soundManager.playBossSiren();
    this.renderer.addScreenShake(26, 2.5);

    // Warning Banner for Ghost King
    if (this.ui.ghostKingWarning) {
      this.ui.ghostKingWarning.classList.remove('hidden');
      if (this.ghostKingWarningTimer) clearTimeout(this.ghostKingWarningTimer);
      this.ghostKingWarningTimer = setTimeout(() => {
        if (this.ui.ghostKingWarning) this.ui.ghostKingWarning.classList.add('hidden');
        this.ghostKingWarningTimer = null;
      }, 4500);
    }

    // Switch music to intense boss mode
    soundManager.setBossMode(true);

    // Show and configure Boss HUD for Ghost King (20,000 HP)
    if (this.ui.bossHud) {
      this.ui.bossHud.classList.remove('hidden');
      const bossTitleEl = document.querySelector('#boss-hud .boss-title');
      if (bossTitleEl) {
        bossTitleEl.textContent = '👑 EL REY FANTASMA DEL TREN MALDITO 👑';
      }
      if (this.ui.bossHpFill) this.ui.bossHpFill.style.width = '100%';
      if (this.ui.bossHpGhost) this.ui.bossHpGhost.style.width = '100%';
      if (this.ui.bossHpText) this.ui.bossHpText.textContent = '20000 / 20000 HP';
    }

    // Create Ghost King Boss at the right side of the carriage (ahead of player)
    this.ghostKing = new GhostKingBoss(this.cameraX + 780, this.groundY);
  }

  startGhostKingDefeatCinematic() {
    this.ghostKingDefeated = true;
    this.state = 'cinematic_ghost_king_defeat';
    this.ghostKingDefeatTimer = 0;
    if (this.ghostKing) {
      this.ghostKing.state = 'defeated';
    }

    this.score += 25000;
    this.updateHighScore();
    this.sendScoreToBackend();

    soundManager.stopMusic();
    soundManager.playGhostRoar();
    this.renderer.addScreenShake(30, 3.0);

    const gx = this.ghostKing ? this.ghostKing.x : this.player.x + 250;
    this.floatingTexts.push(new FloatingText(
      gx, 220,
      '💀 ¡¡¡EL REY FANTASMA HA SIDO DESTRUIDO!!! 👑',
      '#34d399',
      24
    ));
  }

  handleFinalVictory() {
    this.state = 'victory';
    this.updateHighScore();
    this.sendScoreToBackend();
    soundManager.stopMusic();
    soundManager.playTrainDetonation();
    this.renderer.addScreenShake(28, 2.8);

    // Customize Victory Screen for complete game triumph
    this.ui.victoryScore.textContent = this.score;
    const victoryTitle = document.querySelector('#victory-screen .victory-title');
    const victorySub = document.querySelector('#victory-screen .victory-sub');
    const victoryText = document.querySelector('#victory-screen .victory-text');

    if (victoryTitle) victoryTitle.textContent = '¡¡¡VICTORIA DEFINITIVA SOBRE EL TREN FANTASMA!!!';
    if (victorySub) victorySub.textContent = '¡EL REY FANTASMA FUE DESTRUIDO Y ESCAPASTE DE LA EXPLOSIÓN!';
    if (victoryText) {
      victoryText.textContent = '¡Hazaña legendaria completada! Superaste el desierto, venciste al Monstruo de 3 Ojos, sobreviviste 4 minutos en el techo del convoy, entraste al vagón interior, derrotaste al temible Rey Fantasma y saltaste al desierto mientras el Tren Fantasma detonaba por completo.';
    }

    this.ui.victoryScreen.classList.remove('hidden');

    // Massive victory fireworks
    for (let i = 0; i < 180; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 100 + Math.random() * 500;
      this.particles.push(new Particle(
        this.player.x, this.player.y - 40,
        Math.cos(a) * s, Math.sin(a) * s,
        Math.random() < 0.5 ? '#34d399' : '#10b981', 6, 2.0, 'circle'
      ));
    }
  }

  handleGameOver() {
    this.state = 'gameover';
    this.updateHighScore();
    this.sendScoreToBackend();
    soundManager.stopMusic();
    soundManager.playPlayerDeath();
    this.renderer.addScreenShake(18, 1.2);

    // Update Death level and labels
    const lvlNumEl = document.getElementById('gameover-level-num');
    if (lvlNumEl) lvlNumEl.textContent = this.level;
    const contLvlEl = document.getElementById('gameover-continue-lvl-text');
    if (contLvlEl) contLvlEl.textContent = this.level;

    if (this.ui.finalScore) this.ui.finalScore.textContent = this.score;
    if (this.ui.finalKills) this.ui.finalKills.textContent = this.kills;
    if (this.ui.finalMaxCombo) this.ui.finalMaxCombo.textContent = `x${this.maxCombo}`;

    if (this.ui.gameOverScreen) {
      this.ui.gameOverScreen.classList.remove('hidden');
      this.ui.gameOverScreen.classList.add('active');
    }

    if (this.titleScreenManager) {
      this.titleScreenManager.activeScreen = 'gameover';
    }
  }

  // Checkpoint & Level Respawn System
  continueAtCurrentLevel() {
    soundManager.init();
    soundManager.playMenuSelect();
    if (this.ui.gameOverScreen) {
      this.ui.gameOverScreen.classList.remove('active');
      this.ui.gameOverScreen.classList.add('hidden');
    }
    if (this.titleScreenManager) this.titleScreenManager.activeScreen = 'game';

    if (this.level === 1) {
      this.startGame();
    } else if (this.level === 2) {
      this.respawnLevel2();
    } else if (this.level === 3) {
      this.startLevel3();
    } else if (this.level === 4) {
      this.startLevel4();
    }
  }

  saveAndExitToTitle() {
    soundManager.init();
    soundManager.playMenuSelect();
    // Guardar checkpoint en localStorage
    const checkpoint = {
      level: this.level,
      score: this.score,
      kills: this.kills,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('desert_revenant_checkpoint', JSON.stringify(checkpoint));
    } catch (e) {
      console.warn('Could not save checkpoint', e);
    }

    if (this.ui.gameOverScreen) {
      this.ui.gameOverScreen.classList.remove('active');
      this.ui.gameOverScreen.classList.add('hidden');
    }
    if (this.titleScreenManager) {
      this.titleScreenManager.goToTitleScreen();
    }
  }

  restartFromBeginning() {
    soundManager.init();
    soundManager.playMenuSelect();
    if (this.ui.gameOverScreen) {
      this.ui.gameOverScreen.classList.remove('active');
      this.ui.gameOverScreen.classList.add('hidden');
    }
    if (this.titleScreenManager) this.titleScreenManager.activeScreen = 'game';
    this.startGame();
  }

  resumeSavedCheckpoint() {
    soundManager.init();
    soundManager.playMenuSelect();
    try {
      const data = localStorage.getItem('desert_revenant_checkpoint');
      if (data) {
        const cp = JSON.parse(data);
        if (this.ui.startScreen) this.ui.startScreen.classList.add('hidden');
        if (this.titleScreenManager) this.titleScreenManager.activeScreen = 'game';

        if (cp.level === 4) {
          this.score = cp.score || 0;
          this.kills = cp.kills || 0;
          this.startLevel4();
        } else if (cp.level === 3) {
          this.score = cp.score || 0;
          this.kills = cp.kills || 0;
          this.startLevel3();
        } else if (cp.level === 2) {
          this.score = cp.score || 0;
          this.kills = cp.kills || 0;
          this.respawnLevel2();
        } else {
          this.startGame();
        }
        return;
      }
    } catch (e) {
      console.warn(e);
    }
    this.startGame();
  }

  respawnLevel2() {
    soundManager.init();
    soundManager.setBossMode(false);
    soundManager.startMusic();

    this.state = 'playing';
    this.level = 2;
    this.groundY = 460;
    this.renderer.groundY = 460;

    // Reset player position and full HP
    this.player = new Player(200, this.groundY - 35);
    this.player.hp = this.player.maxHp;
    this.player.fury = 0;
    this.player.isAutoWalking = false;
    this.player.vx = 0;
    this.player.vy = 0;

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.boss = null;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.cameraX = 0;
    this.bossArenaCam = 0;

    this.level2StartX = 200;
    this.level2StartScore = this.score;
    this.witchAnnounced = false;
    this.portal = null;
    this.lastDistance10m = 0;
    this.witchSpawnTimer = 3.5;
    this.ghostTrainWaiting = false;

    // 10 segundos de gracia al reaparecer en Nivel 2
    this.levelStartGraceTimer = 10.0;

    // Reset timers & banners
    if (this.bossWarningTimer) { clearTimeout(this.bossWarningTimer); this.bossWarningTimer = null; }
    if (this.level2BannerTimer) { clearTimeout(this.level2BannerTimer); this.level2BannerTimer = null; }
    if (this.level3DangerTimer) { clearTimeout(this.level3DangerTimer); this.level3DangerTimer = null; }

    if (this.ui.gameOverScreen) this.ui.gameOverScreen.classList.add('hidden');
    if (this.ui.startScreen) this.ui.startScreen.classList.add('hidden');
    if (this.ui.secondScreen) this.ui.secondScreen.classList.add('hidden');
    if (this.ui.bossHud) this.ui.bossHud.classList.add('hidden');
    if (this.ui.bossWarning) this.ui.bossWarning.classList.add('hidden');
    if (this.ui.skullClockWidget) this.ui.skullClockWidget.classList.add('hidden');
    if (this.ui.pathTrackerGroup) this.ui.pathTrackerGroup.classList.remove('hidden');

    this.floatingTexts.push(new FloatingText(
      this.player.x, this.player.y - 70,
      '🔥 ¡REAPARECIENDO EN NIVEL 2! (2000 m) 🔥',
      '#f59e0b',
      16
    ));

    this.updateHUD();
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

      // Check Boss (Level 2: 3-Eyed Monster)
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

      // Check Ghost King Boss (Level 4: El Rey Fantasma - 20000 HP)
      if (this.ghostKing && this.ghostKing.alive && proj.alive && this.level === 4) {
        const gkHit = this.ghostKing.getHitbox();
        if (this.rectIntersect(proj.x - proj.radius, proj.y - proj.radius, proj.radius * 2, proj.radius * 2,
                               gkHit.x, gkHit.y, gkHit.width, gkHit.height)) {
          proj.alive = false;
          const mult = this.ghostKing.state === 'exhausted' ? 1.5 : 1.0;
          this.ghostKing.takeDamage(proj.damage * mult);
          soundManager.playHit();
          this.renderer.addScreenShake(4, 0.1);

          // Ectoplasm green/spectral burst
          for (let i = 0; i < 7; i++) {
            this.particles.push(new Particle(
              proj.x, proj.y,
              (Math.random() - 0.5) * 140, (Math.random() - 0.5) * 140,
              Math.random() < 0.6 ? '#6ee7b7' : '#ecfdf5', 4, 0.35, 'spark'
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
        const damage = enemy.type === 'skeleton' ? 25 : 20;
        if (this.player.takeDamage(damage, soundManager, this.particles)) {
          this.renderer.addScreenShake(8, 0.25);
          this.combo = 0;
          this.ui.comboDisplay.classList.add('hidden');
        }
      }
    });

    // 4. Ghost King Contact / Voracious Maw Contact
    if (this.ghostKing && this.ghostKing.alive && this.level === 4) {
      const gkHit = this.ghostKing.getHitbox();
      if (this.rectIntersect(pHit.x, pHit.y, pHit.width, pHit.height,
                             gkHit.x, gkHit.y, gkHit.width, gkHit.height)) {
        const mawDamage = this.ghostKing.isSuctionActive ? 40 : 22;
        if (this.player.takeDamage(mawDamage, soundManager, this.particles)) {
          this.renderer.addScreenShake(12, 0.3);
          this.combo = 0;
          this.ui.comboDisplay.classList.add('hidden');
          // Empujar al jugador en dirección contraria
          this.player.x += (this.player.x > this.ghostKing.x ? 75 : -75);
        }
      }
    }
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

    const basePoints = Math.max(20, Math.round(enemy.points / 20) * 20);
    const earnedPoints = Math.max(20, Math.round((basePoints * (1 + Math.min(this.combo * 0.15, 2.0))) / 20) * 20);
    this.score += earnedPoints;

    // Charge fury (+10% for faster special access)
    this.player.fury = Math.min(100, this.player.fury + 10);

    soundManager.playExplosion(false);

    // Floating Points
    this.floatingTexts.push(new FloatingText(
      enemy.x, enemy.y - 15,
      `+${earnedPoints}`,
      '#facc15'
    ));

    // Death gore & sand puff
    const color = enemy.type === 'cactus' ? '#22c55e' : (enemy.type === 'wolf' ? '#38bdf8' : (enemy.type === 'flying' ? '#c084fc' : (enemy.type === 'witch' ? '#a855f7' : (enemy.type === 'zombie' ? '#65a30d' : (enemy.type === 'skeleton' ? '#10b981' : (enemy.type === 'mini_ghost' ? '#a7f3d0' : '#b45309'))))));
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
    } else if (enemy.type === 'skeleton') {
      for (let i = 0; i < 20; i++) {
        this.particles.push(new Particle(
          enemy.x, enemy.y,
          (Math.random() - 0.5) * 180, (Math.random() - 0.5) * 180,
          Math.random() < 0.6 ? '#10b981' : '#111827', 4, 0.5, 'spark'
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

    // Barra de Progreso y Recorrido / Reloj de Calavera en Nivel 3
    if (this.level === 3) {
      if (this.ui.pathTrackerGroup) this.ui.pathTrackerGroup.classList.add('hidden');
      if (this.ui.skullClockWidget) this.ui.skullClockWidget.classList.remove('hidden');

      const totalSecs = Math.max(0, Math.floor(this.level3TimeRemaining));
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      if (this.ui.skullClockDigits) {
        this.ui.skullClockDigits.textContent = timeStr;
      }
      if (this.ui.skullClockFill) {
        const pct = Math.max(0, Math.min(100, (this.level3TimeRemaining / 240) * 100));
        this.ui.skullClockFill.style.width = `${pct}%`;
      }
    } else {
      if (this.ui.skullClockWidget) this.ui.skullClockWidget.classList.add('hidden');
      if (this.ui.pathTrackerGroup) this.ui.pathTrackerGroup.classList.remove('hidden');

      if (this.level === 1) {
        if (this.ui.bossGoalTitle) {
          this.ui.bossGoalTitle.innerHTML = '👣 RECORRIDO NIVEL 1 &bull; 1500 METROS HACIA EL PORTAL 🌀';
        }
        const distMeters = Math.max(0, Math.floor((this.player.x - 200) / 10));
        const totalMeters = 1500;
        const prog = Math.min(100, (distMeters / totalMeters) * 100);
        const remainingMeters = Math.max(0, totalMeters - distMeters);

        this.ui.bossProgressFill.style.width = `${prog}%`;
        this.ui.bossProgressText.textContent = remainingMeters <= 0 
          ? '¡¡¡LLEGASTE AL PORTAL! CRÚZALO PARA EL NIVEL 2!!!' 
          : `RECORRIDO: ${distMeters} m / ${totalMeters} m (${Math.floor(prog)}%) - FALTAN ${remainingMeters} m`;
      } else if (this.level === 4) {
        // NIVEL 4: 2000 METROS TOTALES DENTRO DEL TREN, REY FANTASMA A LOS 2000M
        const level4DistMeters = Math.max(0, Math.floor((this.player.x - this.level4StartX) / 10));
        if (!this.ghostKingSpawned) {
          if (this.ui.bossGoalTitle) {
            this.ui.bossGoalTitle.innerHTML = '👣 RECORRIDO NIVEL 4 (2000 m) &bull; REY FANTASMA A LOS 2000 m 👑';
          }
          const prog = Math.min(100, (level4DistMeters / 2000) * 100);
          const remainingMeters = Math.max(0, 2000 - level4DistMeters);
          this.ui.bossProgressFill.style.width = `${prog}%`;
          this.ui.bossProgressText.textContent = `RECORRIDO NIVEL 4: ${level4DistMeters} m / 2000 m (${Math.floor(prog)}%) - FALTAN ${remainingMeters} m`;
        } else {
          if (this.ui.bossGoalTitle) {
            this.ui.bossGoalTitle.innerHTML = '👑 COMBATE CONTRA EL REY FANTASMA (20000 HP) 👑';
          }
          this.ui.bossProgressFill.style.width = '100%';
          this.ui.bossProgressText.textContent = '¡¡¡EL REY FANTASMA EN COMBATE (20000 HP)!!!';
        }
      } else {
        // NIVEL 2: 2000 METROS TOTALES, MONSTRUO A LOS 2000M
        const level2DistMeters = Math.max(0, Math.floor((this.player.x - this.level2StartX) / 10));
        if (!this.bossSpawned) {
          if (this.ui.bossGoalTitle) {
            this.ui.bossGoalTitle.innerHTML = '👣 RECORRIDO NIVEL 2 (2000 m) &bull; JEFE A LOS 2000 m 👁️';
          }
          const prog = Math.min(100, (level2DistMeters / 2000) * 100);
          const remainingMeters = Math.max(0, 2000 - level2DistMeters);
          this.ui.bossProgressFill.style.width = `${prog}%`;
          this.ui.bossProgressText.textContent = `RECORRIDO NIVEL 2: ${level2DistMeters} m / 2000 m (${Math.floor(prog)}%) - FALTAN ${remainingMeters} m`;
        } else {
          if (this.ui.bossGoalTitle) {
            this.ui.bossGoalTitle.innerHTML = '👁️ COMBATE CONTRA EL MONSTRUO DE 3 OJOS (10000 HP) 👁️';
          }
          this.ui.bossProgressFill.style.width = '100%';
          this.ui.bossProgressText.textContent = '¡¡¡MONSTRUO DE 3 OJOS EN COMBATE (10000 HP)!!!';
        }
      }
    }

    // Boss HP Bar (Level 2: 3-Eyed Monster, Level 4: Ghost King)
    if (this.boss && this.boss.alive && this.level === 2) {
      const bossHpPercent = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
      this.ui.bossHpFill.style.width = `${bossHpPercent}%`;
      this.ui.bossHpText.textContent = `${Math.ceil(this.boss.hp)} / ${this.boss.maxHp} HP`;
    } else if (this.ghostKing && this.ghostKing.alive && this.level === 4) {
      const ghostHpPercent = Math.max(0, (this.ghostKing.hp / this.ghostKing.maxHp) * 100);
      this.ui.bossHpFill.style.width = `${ghostHpPercent}%`;
      this.ui.bossHpText.textContent = `${Math.ceil(this.ghostKing.hp)} / ${this.ghostKing.maxHp} HP`;
    }
  }
}

// Initialize on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new DesertGame();
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('play') && window.game.titleScreenManager) {
    setTimeout(() => {
      window.game.titleScreenManager.startGameplay();
    }, 150);
  }
});

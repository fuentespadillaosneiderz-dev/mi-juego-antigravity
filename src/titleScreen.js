// titleScreen.js
// Visual FX Engine for "The Night Hunter" Title Screen & Character Stage Screen
import { soundManager } from './audio.js';

export class TitleScreenManager {
  constructor(game) {
    this.game = game;

    // DOM Elements
    this.screenTitle = document.getElementById('screen-title');
    this.screenSecond = document.getElementById('screen-second');
    this.titleCanvas = document.getElementById('title-fx-canvas');
    this.secondCanvas = document.getElementById('second-fx-canvas');

    this.titleCtx = this.titleCanvas ? this.titleCanvas.getContext('2d') : null;
    this.secondCtx = this.secondCanvas ? this.secondCanvas.getContext('2d') : null;

    this.btnPlayGame = document.getElementById('btn-title-play');
    this.btnStartAction = document.getElementById('btn-start-action');
    this.btnBackToTitle = document.getElementById('btn-back-to-title');
    this.btnTitleControls = document.getElementById('btn-title-controls');
    this.titleControlsModal = document.getElementById('title-controls-modal');
    this.btnCloseControls = document.getElementById('btn-close-controls');

    this.activeScreen = 'title'; // 'title', 'second', 'game'
    this.time = 0;
    this.lastTime = performance.now();

    // Eye definitions on 1024x628 resolution
    // Pairs of eyes with positions, color, glow color, and blinking state
    this.eyePairs = [
      // Top Left Green
      {
        eyes: [{ x: 67, y: 260 }, { x: 107, y: 258 }],
        color: '#22c55e', glow: '#4ade80', radius: 4,
        blinkTimer: 2.2, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Top Right Green
      {
        eyes: [{ x: 945, y: 270 }, { x: 985, y: 270 }],
        color: '#22c55e', glow: '#4ade80', radius: 4,
        blinkTimer: 3.4, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Mid Left Green
      {
        eyes: [{ x: 50, y: 382 }, { x: 87, y: 382 }],
        color: '#22c55e', glow: '#4ade80', radius: 4.5,
        blinkTimer: 1.8, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Center-Left Green above icons
      {
        eyes: [{ x: 299, y: 342 }, { x: 320, y: 342 }],
        color: '#22c55e', glow: '#4ade80', radius: 3.5,
        blinkTimer: 4.1, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Mid Left Red
      {
        eyes: [{ x: 156, y: 368 }, { x: 199, y: 368 }],
        color: '#ef4444', glow: '#f87171', radius: 5,
        blinkTimer: 2.8, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Low Left Red
      {
        eyes: [{ x: 150, y: 473 }, { x: 191, y: 473 }],
        color: '#ef4444', glow: '#f87171', radius: 5,
        blinkTimer: 4.6, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Low Left Yellow
      {
        eyes: [{ x: 50, y: 457 }, { x: 92, y: 458 }],
        color: '#eab308', glow: '#fde047', radius: 4.5,
        blinkTimer: 3.1, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Top Center Red (above PLAY GAME)
      {
        eyes: [{ x: 426, y: 341 }, { x: 469, y: 341 }],
        color: '#ef4444', glow: '#f87171', radius: 5.5,
        blinkTimer: 2.5, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Mid Right Yellow
      {
        eyes: [{ x: 725, y: 345 }, { x: 765, y: 345 }],
        color: '#eab308', glow: '#fde047', radius: 4,
        blinkTimer: 3.7, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Mid Right Red
      {
        eyes: [{ x: 896, y: 375 }, { x: 936, y: 375 }],
        color: '#ef4444', glow: '#f87171', radius: 5,
        blinkTimer: 2.0, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Low Right Yellow
      {
        eyes: [{ x: 893, y: 479 }, { x: 933, y: 479 }],
        color: '#eab308', glow: '#fde047', radius: 4.5,
        blinkTimer: 4.3, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Top Right Yellow
      {
        eyes: [{ x: 945, y: 335 }, { x: 992, y: 335 }],
        color: '#eab308', glow: '#fde047', radius: 4,
        blinkTimer: 3.9, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      },
      // Monster smiling mouth teal eyes
      {
        eyes: [{ x: 785, y: 434 }, { x: 825, y: 436 }],
        color: '#06b6d4', glow: '#67e8f9', radius: 4,
        blinkTimer: 5.0, isBlinking: false, blinkDuration: 0.12, shineTimer: 0
      }
    ];

    // Green fire particles around "THE NIGHT HUNTER"
    this.flameParticles = [];
    this.maxFlameParticles = 75;
    this.initFlameEmitters();

    // Embers and sparks for Screen 2
    this.secondParticles = [];

    this.bindEvents();
    this.startAnimationLoop();
  }

  initFlameEmitters() {
    // Letters region: X: 140 to 880, Y: 100 to 240
    // Generate initial flames
    for (let i = 0; i < this.maxFlameParticles; i++) {
      this.flameParticles.push(this.createFlameParticle(true));
    }
  }

  createFlameParticle(randomLife = false) {
    // Scatter along the top flame contour and around the letters
    const x = 145 + Math.random() * 735;
    // Follow the arc of the fire crest: higher in center (x ~ 512, y ~ 110), lower at sides (y ~ 190)
    const normalizedX = (x - 512) / 370; // -1 to 1
    const arcY = 120 + Math.pow(normalizedX, 2) * 55;
    const y = arcY + (Math.random() - 0.4) * 65;

    const colors = [
      { core: '#86efac', edge: 'rgba(34, 197, 94, 0.85)' },
      { core: '#6ee7b7', edge: 'rgba(16, 185, 129, 0.9)' },
      { core: '#a7f3d0', edge: 'rgba(5, 150, 105, 0.75)' },
      { core: '#67e8f9', edge: 'rgba(6, 182, 212, 0.8)' },
      { core: '#34d399', edge: 'rgba(16, 185, 129, 0.7)' }
    ];
    const c = colors[Math.floor(Math.random() * colors.length)];
    const maxLife = 0.8 + Math.random() * 0.9;

    return {
      x,
      y,
      baseX: x,
      vx: (Math.random() - 0.5) * 18,
      vy: -(35 + Math.random() * 55),
      size: 5 + Math.random() * 11,
      coreColor: c.core,
      edgeColor: c.edge,
      life: randomLife ? Math.random() * maxLife : maxLife,
      maxLife,
      waveOffset: Math.random() * Math.PI * 2,
      isSpark: Math.random() < 0.35
    };
  }

  bindEvents() {
    // Screen 1: PLAY GAME Button
    if (this.btnPlayGame) {
      this.btnPlayGame.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });

      this.btnPlayGame.addEventListener('click', (e) => {
        e.preventDefault();
        soundManager.init();
        soundManager.playMenuSelect();
        soundManager.playSpookyTransition();
        this.goToSecondScreen();
      });
    }

    // Screen 2: Action Button (START GAME)
    if (this.btnStartAction) {
      this.btnStartAction.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });

      this.btnStartAction.addEventListener('click', (e) => {
        e.preventDefault();
        soundManager.init();
        soundManager.playMenuSelect();
        this.startGameplay();
      });
    }

    // Screen 2: Back to Title Button
    if (this.btnBackToTitle) {
      this.btnBackToTitle.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });

      this.btnBackToTitle.addEventListener('click', (e) => {
        e.preventDefault();
        soundManager.init();
        soundManager.playMenuHover();
        this.goToTitleScreen();
      });
    }

    // Controls Modal on Title
    if (this.btnTitleControls) {
      this.btnTitleControls.addEventListener('click', () => {
        soundManager.init();
        soundManager.playMenuHover();
        if (this.titleControlsModal) this.titleControlsModal.classList.remove('hidden');
      });
    }

    if (this.btnCloseControls) {
      this.btnCloseControls.addEventListener('click', () => {
        soundManager.init();
        soundManager.playMenuHover();
        if (this.titleControlsModal) this.titleControlsModal.classList.add('hidden');
      });
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (this.activeScreen === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          soundManager.init();
          soundManager.playMenuSelect();
          soundManager.playSpookyTransition();
          this.goToSecondScreen();
        }
      } else if (this.activeScreen === 'second') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          soundManager.init();
          soundManager.playMenuSelect();
          this.startGameplay();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          this.goToTitleScreen();
        }
      }
    });

    // Handle return to menu from Game Over or Pause
    const btnMenuRestart = document.getElementById('btn-back-to-menu-gameover');
    if (btnMenuRestart) {
      btnMenuRestart.addEventListener('click', () => {
        soundManager.init();
        soundManager.stopMusic();
        this.goToTitleScreen();
      });
    }

    const btnMenuPause = document.getElementById('btn-back-to-menu-pause');
    if (btnMenuPause) {
      btnMenuPause.addEventListener('click', () => {
        soundManager.init();
        soundManager.stopMusic();
        this.goToTitleScreen();
      });
    }
  }

  goToSecondScreen() {
    this.activeScreen = 'second';
    if (this.screenTitle) {
      this.screenTitle.classList.remove('active');
      this.screenTitle.classList.add('hidden');
    }
    if (this.screenSecond) {
      this.screenSecond.classList.remove('hidden');
      this.screenSecond.classList.add('active');
    }
  }

  goToTitleScreen() {
    this.activeScreen = 'title';
    this.game.state = 'menu';

    // Hide gameplay screens
    if (this.game.ui) {
      if (this.game.ui.gameOverScreen) this.game.ui.gameOverScreen.classList.add('hidden');
      if (this.game.ui.pauseModal) this.game.ui.pauseModal.classList.add('hidden');
      if (this.game.ui.victoryScreen) this.game.ui.victoryScreen.classList.add('hidden');
      if (this.game.ui.bossHud) this.game.ui.bossHud.classList.add('hidden');
      if (this.game.ui.startScreen) this.game.ui.startScreen.classList.add('hidden');
    }

    if (this.screenSecond) {
      this.screenSecond.classList.remove('active');
      this.screenSecond.classList.add('hidden');
    }
    if (this.screenTitle) {
      this.screenTitle.classList.remove('hidden');
      this.screenTitle.classList.add('active');
    }
  }

  startGameplay() {
    this.activeScreen = 'game';
    if (this.screenTitle) this.screenTitle.classList.add('hidden');
    if (this.screenSecond) this.screenSecond.classList.add('hidden');
    this.game.startGame();
  }

  startAnimationLoop() {
    const loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.time += dt;

      if (this.activeScreen === 'title') {
        this.renderTitleEffects(dt);
      } else if (this.activeScreen === 'second') {
        this.renderSecondEffects(dt);
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // --------------------------------------------------------------------------
  // SCREEN 1: Dynamic Green Flame and Blinking Shiny Eyes
  // --------------------------------------------------------------------------
  renderTitleEffects(dt) {
    if (!this.titleCtx) return;
    const ctx = this.titleCtx;
    const w = this.titleCanvas.width;
    const h = this.titleCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. DYNAMIC MOVING GREEN FIRE AROUND "THE NIGHT HUNTER"
    this.updateAndDrawGreenFire(ctx, dt);

    // 2. BLINKING SHINY EYES
    this.updateAndDrawEyes(ctx, dt);
  }

  updateAndDrawGreenFire(ctx, dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Update and draw flame particles
    for (let i = 0; i < this.flameParticles.length; i++) {
      const p = this.flameParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.flameParticles[i] = this.createFlameParticle(false);
        continue;
      }

      // Sine wave turbulence
      p.y += p.vy * dt;
      p.x = p.baseX + Math.sin(this.time * 6 + p.waveOffset + p.y * 0.04) * 14;
      const progress = p.life / p.maxLife; // 1 -> 0

      if (p.isSpark) {
        // Floating spark / ember
        const sparkAlpha = Math.sin(progress * Math.PI) * 0.9;
        ctx.fillStyle = p.coreColor;
        ctx.shadowColor = p.coreColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (1 + (1 - progress) * 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Flame tongue / wisp
        const flameRadius = p.size * (0.3 + progress * 0.8);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, flameRadius * 2);
        grad.addColorStop(0, p.coreColor);
        grad.addColorStop(0.4, p.edgeColor);
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.fillStyle = grad;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        // Flame teardrop / tongue shape
        ctx.ellipse(p.x, p.y, flameRadius * 0.8, flameRadius * 1.4, Math.sin(this.time * 4 + p.waveOffset) * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Additional pulsating fiery ambient glow wave behind "THE NIGHT HUNTER"
    const glowPulse = 0.55 + 0.25 * Math.sin(this.time * 4.5) + 0.15 * Math.cos(this.time * 8.2);
    const titleGlow = ctx.createRadialGradient(512, 175, 40, 512, 175, 420);
    titleGlow.addColorStop(0, `rgba(52, 211, 153, ${0.35 * glowPulse})`);
    titleGlow.addColorStop(0.45, `rgba(16, 185, 129, ${0.2 * glowPulse})`);
    titleGlow.addColorStop(1, 'rgba(4, 120, 87, 0)');
    ctx.fillStyle = titleGlow;
    ctx.fillRect(80, 50, 864, 250);

    ctx.restore();
  }

  updateAndDrawEyes(ctx, dt) {
    ctx.save();

    for (const pair of this.eyePairs) {
      // Update blink cycle
      pair.blinkTimer -= dt;
      if (pair.blinkTimer <= 0) {
        pair.isBlinking = true;
        pair.blinkDuration -= dt;
        if (pair.blinkDuration <= 0) {
          // Finished blink -> open eyes and trigger shining gleam effect!
          pair.isBlinking = false;
          pair.blinkTimer = 2.0 + Math.random() * 3.5;
          pair.blinkDuration = 0.12;
          pair.shineTimer = 0.65; // Trigger brilliant shine
        }
      }

      if (pair.shineTimer > 0) {
        pair.shineTimer -= dt;
      }

      // Draw each eye in pair
      for (const eye of pair.eyes) {
        if (pair.isBlinking) {
          // Closed eyelid line
          ctx.strokeStyle = pair.glow;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(eye.x - pair.radius, eye.y);
          ctx.lineTo(eye.x + pair.radius, eye.y);
          ctx.stroke();
          continue;
        }

        // Ambient breathing eye glow
        const breath = 0.75 + 0.25 * Math.sin(this.time * 4 + eye.x);
        const radius = pair.radius * breath;

        // Radial glow
        const glowGrad = ctx.createRadialGradient(eye.x, eye.y, 1, eye.x, eye.y, radius * 3);
        glowGrad.addColorStop(0, '#ffffff');
        glowGrad.addColorStop(0.3, pair.color);
        glowGrad.addColorStop(0.7, pair.glow);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, radius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Piercing Pupil Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // BRILLIANT SHINE EFFECT (Sparkle Starburst / Glint)
        if (pair.shineTimer > 0) {
          this.drawSparkleShine(ctx, eye.x, eye.y, pair.shineTimer / 0.65, pair.glow);
        }
      }
    }

    ctx.restore();
  }

  drawSparkleShine(ctx, x, y, intensity, color) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const alpha = Math.min(1, intensity * 1.5);
    ctx.globalAlpha = alpha;

    const size = 18 * intensity;
    const rot = (1 - intensity) * 1.2;

    ctx.translate(x, y);
    ctx.rotate(rot);

    // 4-point radiant diamond flare
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;

    // Horizontal ray
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.quadraticCurveTo(0, -size * 0.15, size, 0);
    ctx.quadraticCurveTo(0, size * 0.15, -size, 0);
    ctx.fill();

    // Vertical ray
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(-size * 0.15, 0, 0, size);
    ctx.quadraticCurveTo(size * 0.15, 0, 0, -size);
    ctx.fill();

    // Diagonal mini rays
    const miniSize = size * 0.55;
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-miniSize, 0);
    ctx.lineTo(miniSize, 0);
    ctx.moveTo(0, -miniSize);
    ctx.lineTo(0, miniSize);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sparkling central bead
    ctx.beginPath();
    ctx.arc(0, 0, 3 * intensity, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SCREEN 2: Character Intro FX (Pulsing Heart, Warm Lantern, Green Hellfire)
  // --------------------------------------------------------------------------
  renderSecondEffects(dt) {
    if (!this.secondCtx) return;
    const ctx = this.secondCtx;
    const w = this.secondCanvas.width;
    const h = this.secondCanvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. PULSING HEART EFFECT AT TOP (x: 420, y: 140)
    const heartBeat = 1 + 0.12 * Math.pow(Math.sin(this.time * 3.5), 6);
    const heartGlow = ctx.createRadialGradient(422, 140, 10, 422, 140, 85 * heartBeat);
    heartGlow.addColorStop(0, `rgba(239, 68, 68, ${0.45 * heartBeat})`);
    heartGlow.addColorStop(0.6, 'rgba(185, 28, 28, 0.2)');
    heartGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = heartGlow;
    ctx.fillRect(320, 40, 210, 200);

    // 2. WARM FLICKERING LANTERN GLOW (x: 602, y: 462)
    const flicker = 1 + 0.08 * Math.sin(this.time * 16) + 0.05 * Math.cos(this.time * 23);
    const lanternGrad = ctx.createRadialGradient(602, 462, 5, 595, 510, 150 * flicker);
    lanternGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    lanternGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.45)');
    lanternGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.18)');
    lanternGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lanternGrad;
    ctx.beginPath();
    ctx.arc(595, 500, 150 * flicker, 0, Math.PI * 2);
    ctx.fill();

    // 3. GREEN HELLFIRE SWIRLING AROUND COWBOY (x: 420 to 580, y: 350 to 540)
    if (this.secondParticles.length < 35) {
      this.secondParticles.push({
        x: 440 + Math.random() * 130,
        y: 500 + Math.random() * 30,
        baseX: 440 + Math.random() * 130,
        vy: -(40 + Math.random() * 60),
        size: 4 + Math.random() * 8,
        life: 0.7 + Math.random() * 0.7,
        maxLife: 1.0,
        color: Math.random() < 0.6 ? '#10b981' : '#34d399',
        wave: Math.random() * Math.PI * 2
      });
    }

    for (let i = this.secondParticles.length - 1; i >= 0; i--) {
      const p = this.secondParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.secondParticles.splice(i, 1);
        continue;
      }
      p.y += p.vy * dt;
      p.x = p.baseX + Math.sin(this.time * 5 + p.wave) * 12;
      const alpha = p.life / p.maxLife;

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. SKELETON COWBOY PIERCING RED GLOWING EYES (x: 516, y: 395 and x: 535, y: 395)
    const eyeBlink = (Math.sin(this.time * 1.5) > 0.96) ? 0 : 1;
    if (eyeBlink) {
      const eyeGlow = 0.8 + 0.2 * Math.sin(this.time * 6);
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(516, 395, 2.5 * eyeGlow, 0, Math.PI * 2);
      ctx.arc(534, 395, 2.5 * eyeGlow, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// titleScreen.js
// Visual FX Engine for "The Night Hunter" Title Screen & Character Stage Screen
import { soundManager } from './audio.js';

export class TitleScreenManager {
  constructor(game) {
    this.game = game;

    // DOM Elements
    this.screenTitle = document.getElementById('screen-title');
    this.screenSecond = document.getElementById('screen-second');
    this.screenBoarding = document.getElementById('screen-boarding-cinematic');
    this.screenLevel3 = document.getElementById('screen-level3');
    this.screenLevel4 = document.getElementById('screen-level4');
    this.screenExplosion = document.getElementById('screen-train-explosion');

    this.titleCanvas = document.getElementById('title-fx-canvas');
    this.secondCanvas = document.getElementById('second-fx-canvas');
    this.cinematicCanvas = document.getElementById('cinematic-fx-canvas');
    this.level3Canvas = document.getElementById('level3-fx-canvas');
    this.level4Canvas = document.getElementById('level4-fx-canvas');
    this.explosionCanvas = document.getElementById('explosion-fx-canvas');
    this.gameoverCanvas = document.getElementById('gameover-fx-canvas');

    this.titleCtx = this.titleCanvas ? this.titleCanvas.getContext('2d') : null;
    this.secondCtx = this.secondCanvas ? this.secondCanvas.getContext('2d') : null;
    this.cinematicCtx = this.cinematicCanvas ? this.cinematicCanvas.getContext('2d') : null;
    this.level3Ctx = this.level3Canvas ? this.level3Canvas.getContext('2d') : null;
    this.level4Ctx = this.level4Canvas ? this.level4Canvas.getContext('2d') : null;
    this.explosionCtx = this.explosionCanvas ? this.explosionCanvas.getContext('2d') : null;
    this.gameoverCtx = this.gameoverCanvas ? this.gameoverCanvas.getContext('2d') : null;

    this.btnPlayGame = document.getElementById('btn-title-play');
    this.btnTitleResume = document.getElementById('btn-title-resume');
    this.titleResumeLevel = document.getElementById('title-resume-level');
    this.btnStartAction = document.getElementById('btn-start-action');
    this.btnBackToTitle = document.getElementById('btn-back-to-title');
    this.btnTitleControls = document.getElementById('btn-title-controls');
    this.titleControlsModal = document.getElementById('title-controls-modal');
    this.btnCloseControls = document.getElementById('btn-close-controls');
    this.btnSkipBoarding = document.getElementById('btn-skip-boarding');
    this.btnConfirmLevel3 = document.getElementById('btn-confirm-level3');
    this.btnConfirmLevel4 = document.getElementById('btn-confirm-level4');
    this.btnFinishAdventure = document.getElementById('btn-finish-adventure');

    this.btnTitleCommand = document.getElementById('btn-title-command');
    this.titleCommandModal = document.getElementById('title-command-modal');
    this.commandLevelForm = document.getElementById('command-level-form');
    this.commandLevelInput = document.getElementById('command-level-input');
    this.commandFeedback = document.getElementById('command-feedback');
    this.btnCloseCommand = document.getElementById('btn-close-command');
    this.quickLevelButtons = document.querySelectorAll('.btn-quick-level');

    this.btnGameoverContinue = document.getElementById('btn-gameover-continue');
    this.btnGameoverSave = document.getElementById('btn-gameover-save');
    this.btnGameoverRestart = document.getElementById('btn-gameover-restart');

    this.activeScreen = 'title'; // 'title', 'second', 'boarding_cinematic', 'level3_transition', 'level4_transition', 'train_explosion', 'gameover', 'game'
    this.time = 0;
    this.lastTime = performance.now();
    this.boardingTimeout = null;
    this.explosionTimeout = null;
    this.level3Particles = [];
    this.level4Particles = [];
    this.explosionParticles = [];
    this.boardingParticles = [];
    this.gameoverParticles = [];

    this.checkCheckpointAvailable();

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
        this.startGameplay();
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
        this.confirmLevel2();
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

    // Botón 2: Consola de Comandos de Nivel
    if (this.btnTitleCommand) {
      this.btnTitleCommand.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });
      this.btnTitleCommand.addEventListener('click', (e) => {
        e.preventDefault();
        soundManager.init();
        soundManager.playMenuSelect();
        this.openCommandModal();
      });
    }

    if (this.btnCloseCommand) {
      this.btnCloseCommand.addEventListener('click', (e) => {
        e.preventDefault();
        soundManager.init();
        soundManager.playMenuHover();
        this.closeCommandModal();
      });
    }

    if (this.commandLevelInput) {
      this.commandLevelInput.addEventListener('input', () => {
        this.updateCommandFeedback(this.commandLevelInput.value);
      });
    }

    if (this.commandLevelForm) {
      this.commandLevelForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = this.commandLevelInput ? this.commandLevelInput.value : '';
        this.executeLevelCommand(val);
      });
    }

    if (this.quickLevelButtons) {
      this.quickLevelButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetLvl = btn.getAttribute('data-level');
          this.executeLevelCommand(targetLvl);
        });
      });
    }

    // Skip Boarding Cinematic Button
    if (this.btnSkipBoarding) {
      this.btnSkipBoarding.addEventListener('click', (e) => {
        e.preventDefault();
        soundManager.init();
        soundManager.playMenuSelect();
        this.finishBoardingCinematic();
      });
    }

    // Level 3: Confirm Button
    if (this.btnConfirmLevel3) {
      this.btnConfirmLevel3.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });

      this.btnConfirmLevel3.addEventListener('click', (e) => {
        e.preventDefault();
        soundManager.init();
        soundManager.playMenuSelect();
        this.confirmLevel3();
      });
    }

    // Level 4: Confirm Button
    if (this.btnConfirmLevel4) {
      this.btnConfirmLevel4.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });

      this.btnConfirmLevel4.addEventListener('click', (e) => {
        e.preventDefault();
        soundManager.init();
        soundManager.playMenuSelect();
        this.confirmLevel4();
      });
    }

    // Final Train Explosion Cinematic: Finish Button
    if (this.btnFinishAdventure) {
      this.btnFinishAdventure.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });

      this.btnFinishAdventure.addEventListener('click', (e) => {
        e.preventDefault();
        soundManager.init();
        soundManager.playMenuSelect();
        this.finishTrainExplosionCinematic();
      });
    }

    // Title Screen Resume Saved Checkpoint Button
    if (this.btnTitleResume) {
      this.btnTitleResume.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });
      this.btnTitleResume.addEventListener('click', (e) => {
        e.preventDefault();
        this.game.resumeSavedCheckpoint();
      });
    }

    // Official Game Over Screen: The 3 Requested Buttons
    if (this.btnGameoverContinue) {
      this.btnGameoverContinue.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });
      this.btnGameoverContinue.addEventListener('click', (e) => {
        e.preventDefault();
        this.game.continueAtCurrentLevel();
      });
    }

    if (this.btnGameoverSave) {
      this.btnGameoverSave.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });
      this.btnGameoverSave.addEventListener('click', (e) => {
        e.preventDefault();
        this.game.saveAndExitToTitle();
      });
    }

    if (this.btnGameoverRestart) {
      this.btnGameoverRestart.addEventListener('mouseenter', () => {
        soundManager.init();
        soundManager.playMenuHover();
      });
      this.btnGameoverRestart.addEventListener('click', (e) => {
        e.preventDefault();
        this.game.restartFromBeginning();
      });
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (this.activeScreen === 'title') {
        if (this.titleCommandModal && !this.titleCommandModal.classList.contains('hidden')) {
          if (e.code === 'Escape') {
            e.preventDefault();
            this.closeCommandModal();
          }
          return;
        }
        if (this.titleControlsModal && !this.titleControlsModal.classList.contains('hidden')) {
          if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            this.titleControlsModal.classList.add('hidden');
          }
          return;
        }

        if (e.code === 'KeyC') {
          e.preventDefault();
          this.openCommandModal();
          return;
        }

        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          soundManager.init();
          soundManager.playMenuSelect();
          soundManager.playSpookyTransition();
          this.startGameplay();
        }
      } else if (this.activeScreen === 'gameover') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          this.game.continueAtCurrentLevel();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          this.game.saveAndExitToTitle();
        }
      } else if (this.activeScreen === 'second') {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          soundManager.init();
          soundManager.playMenuSelect();
          this.confirmLevel2();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          this.goToTitleScreen();
        }
      } else if (this.activeScreen === 'boarding_cinematic') {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'Escape') {
          e.preventDefault();
          soundManager.init();
          soundManager.playMenuSelect();
          this.finishBoardingCinematic();
        }
      } else if (this.activeScreen === 'level3_transition') {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          soundManager.init();
          soundManager.playMenuSelect();
          this.confirmLevel3();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          this.goToTitleScreen();
        }
      } else if (this.activeScreen === 'level4_transition') {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          soundManager.init();
          soundManager.playMenuSelect();
          this.confirmLevel4();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          this.goToTitleScreen();
        }
      } else if (this.activeScreen === 'train_explosion') {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'Escape') {
          e.preventDefault();
          soundManager.init();
          soundManager.playMenuSelect();
          this.finishTrainExplosionCinematic();
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

  showLevel2Transition() {
    this.activeScreen = 'second';
    this.game.state = 'level2_transition';
    soundManager.stopMusic();

    if (this.screenTitle) {
      this.screenTitle.classList.remove('active');
      this.screenTitle.classList.add('hidden');
    }
    if (this.screenBoarding) this.screenBoarding.classList.add('hidden');
    if (this.screenLevel3) this.screenLevel3.classList.add('hidden');

    if (this.screenSecond) {
      this.screenSecond.classList.remove('hidden');
      this.screenSecond.classList.add('active');
    }
  }

  confirmLevel2() {
    this.activeScreen = 'game';
    if (this.screenSecond) {
      this.screenSecond.classList.remove('active');
      this.screenSecond.classList.add('hidden');
    }
    if (this.screenTitle) {
      this.screenTitle.classList.add('hidden');
    }
    this.game.startLevel2();
  }

  // CINEMATIC: Ghost Train Boarding
  showBoardingCinematic() {
    this.activeScreen = 'boarding_cinematic';
    this.game.state = 'boarding_cinematic';
    soundManager.stopMusic();
    soundManager.playTrainWhistle();

    if (this.screenTitle) this.screenTitle.classList.add('hidden');
    if (this.screenSecond) this.screenSecond.classList.add('hidden');
    if (this.screenLevel3) this.screenLevel3.classList.add('hidden');

    if (this.screenBoarding) {
      this.screenBoarding.classList.remove('hidden');
      this.screenBoarding.classList.add('active');
    }

    if (this.boardingTimeout) clearTimeout(this.boardingTimeout);
    this.boardingTimeout = setTimeout(() => {
      this.finishBoardingCinematic();
    }, 4500);
  }

  finishBoardingCinematic() {
    if (this.boardingTimeout) {
      clearTimeout(this.boardingTimeout);
      this.boardingTimeout = null;
    }
    if (this.screenBoarding) {
      this.screenBoarding.classList.remove('active');
      this.screenBoarding.classList.add('hidden');
    }
    this.showLevel3Transition();
  }

  // LEVEL 3 TRANSITION SCREEN (assets/level3_screen.jpg)
  showLevel3Transition() {
    this.activeScreen = 'level3_transition';
    this.game.state = 'level3_transition';
    soundManager.stopMusic();
    soundManager.playSpookyTransition();

    if (this.screenTitle) this.screenTitle.classList.add('hidden');
    if (this.screenSecond) this.screenSecond.classList.add('hidden');
    if (this.screenBoarding) this.screenBoarding.classList.add('hidden');

    if (this.screenLevel3) {
      this.screenLevel3.classList.remove('hidden');
      this.screenLevel3.classList.add('active');
    }
  }

  confirmLevel3() {
    this.activeScreen = 'game';
    if (this.screenLevel3) {
      this.screenLevel3.classList.remove('active');
      this.screenLevel3.classList.add('hidden');
    }
    if (this.screenBoarding) this.screenBoarding.classList.add('hidden');
    if (this.screenSecond) this.screenSecond.classList.add('hidden');
    if (this.screenTitle) this.screenTitle.classList.add('hidden');
    
    this.game.startLevel3();
  }

  // LEVEL 4 TRANSITION SCREEN (assets/level4_train_inside.jpg)
  showLevel4Transition() {
    this.activeScreen = 'level4_transition';
    this.game.state = 'level4_transition';
    soundManager.stopMusic();
    soundManager.playTunnelRumble();

    if (this.screenTitle) this.screenTitle.classList.add('hidden');
    if (this.screenSecond) this.screenSecond.classList.add('hidden');
    if (this.screenBoarding) this.screenBoarding.classList.add('hidden');
    if (this.screenLevel3) this.screenLevel3.classList.add('hidden');
    if (this.screenExplosion) this.screenExplosion.classList.add('hidden');

    if (this.screenLevel4) {
      this.screenLevel4.classList.remove('hidden');
      this.screenLevel4.classList.add('active');
    }
  }

  confirmLevel4() {
    this.activeScreen = 'game';
    if (this.screenLevel4) {
      this.screenLevel4.classList.remove('active');
      this.screenLevel4.classList.add('hidden');
    }
    if (this.screenLevel3) this.screenLevel3.classList.add('hidden');
    if (this.screenBoarding) this.screenBoarding.classList.add('hidden');
    if (this.screenSecond) this.screenSecond.classList.add('hidden');
    if (this.screenTitle) this.screenTitle.classList.add('hidden');

    this.game.startLevel4();
  }

  // FINAL CINEMATIC: GHOST KING DEFEAT & TRAIN EXPLOSION (assets/level4_ghost_train_exterior.png)
  showTrainExplosionCinematic() {
    this.activeScreen = 'train_explosion';
    this.game.state = 'train_explosion';
    soundManager.stopMusic();
    soundManager.playTrainDetonation();
    soundManager.playTrainWhistle();

    if (this.screenLevel4) this.screenLevel4.classList.add('hidden');
    if (this.screenTitle) this.screenTitle.classList.add('hidden');

    if (this.screenExplosion) {
      this.screenExplosion.classList.remove('hidden');
      this.screenExplosion.classList.add('active');
    }

    if (this.explosionTimeout) clearTimeout(this.explosionTimeout);
    this.explosionTimeout = setTimeout(() => {
      this.finishTrainExplosionCinematic();
    }, 14000); // Auto-finishes if user watches full cinematic
  }

  finishTrainExplosionCinematic() {
    if (this.explosionTimeout) {
      clearTimeout(this.explosionTimeout);
      this.explosionTimeout = null;
    }
    if (this.screenExplosion) {
      this.screenExplosion.classList.remove('active');
      this.screenExplosion.classList.add('hidden');
    }
    this.game.handleFinalVictory();
  }

  goToSecondScreen() {
    this.showLevel2Transition();
  }

  goToTitleScreen() {
    this.activeScreen = 'title';
    this.game.state = 'menu';

    if (this.boardingTimeout) {
      clearTimeout(this.boardingTimeout);
      this.boardingTimeout = null;
    }
    if (this.explosionTimeout) {
      clearTimeout(this.explosionTimeout);
      this.explosionTimeout = null;
    }

    // Hide gameplay screens
    if (this.game.ui) {
      if (this.game.ui.gameOverScreen) this.game.ui.gameOverScreen.classList.add('hidden');
      if (this.game.ui.pauseModal) this.game.ui.pauseModal.classList.add('hidden');
      if (this.game.ui.victoryScreen) this.game.ui.victoryScreen.classList.add('hidden');
      if (this.game.ui.bossHud) this.game.ui.bossHud.classList.add('hidden');
      if (this.game.ui.startScreen) this.game.ui.startScreen.classList.add('hidden');
      if (this.game.ui.level3DangerBanner) this.game.ui.level3DangerBanner.classList.add('hidden');
      if (this.game.ui.level4DangerBanner) this.game.ui.level4DangerBanner.classList.add('hidden');
      if (this.game.ui.ghostKingWarning) this.game.ui.ghostKingWarning.classList.add('hidden');
      if (this.game.ui.skullClockWidget) this.game.ui.skullClockWidget.classList.add('hidden');
    }

    if (this.screenBoarding) {
      this.screenBoarding.classList.remove('active');
      this.screenBoarding.classList.add('hidden');
    }
    if (this.screenLevel3) {
      this.screenLevel3.classList.remove('active');
      this.screenLevel3.classList.add('hidden');
    }
    if (this.screenLevel4) {
      this.screenLevel4.classList.remove('active');
      this.screenLevel4.classList.add('hidden');
    }
    if (this.screenExplosion) {
      this.screenExplosion.classList.remove('active');
      this.screenExplosion.classList.add('hidden');
    }
    if (this.screenSecond) {
      this.screenSecond.classList.remove('active');
      this.screenSecond.classList.add('hidden');
    }
    if (this.screenTitle) {
      this.screenTitle.classList.remove('hidden');
      this.screenTitle.classList.add('active');
    }

    this.checkCheckpointAvailable();
  }

  openCommandModal() {
    if (this.titleControlsModal) this.titleControlsModal.classList.add('hidden');
    if (this.titleCommandModal) {
      this.titleCommandModal.classList.remove('hidden');
      if (this.commandLevelInput) {
        this.commandLevelInput.value = '';
        setTimeout(() => this.commandLevelInput.focus(), 80);
      }
      this.updateCommandFeedback('');
    }
  }

  closeCommandModal() {
    if (this.titleCommandModal) {
      this.titleCommandModal.classList.add('hidden');
    }
  }

  updateCommandFeedback(text) {
    if (!this.commandFeedback) return;
    const clean = (text || '').trim().toLowerCase();
    if (!clean) {
      this.commandFeedback.innerHTML = '💡 Escribe <strong>"4 nivel"</strong>, <strong>"123"</strong>, <strong>"3"</strong>, <strong>"2"</strong> o <strong>"1"</strong>';
      this.commandFeedback.style.color = '#7dd3fc';
      return;
    }

    if (clean.includes('boss') || clean.includes('jefe') || clean.includes('fantasma') || clean === '4-boss') {
      this.commandFeedback.innerHTML = '💀 <strong>JEFE FINAL REY FANTASMA:</strong> ¡Combate directo de 20,000 HP!';
      this.commandFeedback.style.color = '#fbbf24';
    } else if (clean.includes('4') || clean.includes('cuatro') || clean.includes('four')) {
      this.commandFeedback.innerHTML = '👑 <strong>NIVEL 4:</strong> Interior del Tren Fantasma, Esqueleto Fuego Verde &amp; Rey Fantasma';
      this.commandFeedback.style.color = '#34d399';
    } else if (clean.includes('3') || clean.includes('tres') || clean.includes('three') || clean === '123') {
      this.commandFeedback.innerHTML = '🚂 <strong>NIVEL 3:</strong> Techo del Tren Fantasma (Horda extrema y reloj de calavera)';
      this.commandFeedback.style.color = '#38bdf8';
    } else if (clean.includes('2') || clean.includes('dos') || clean.includes('two')) {
      this.commandFeedback.innerHTML = '👁️ <strong>NIVEL 2:</strong> Desierto 2,000m, Brujas Voladoras &amp; Monstruo de 3 Ojos';
      this.commandFeedback.style.color = '#f59e0b';
    } else if (clean.includes('1') || clean.includes('uno') || clean.includes('one')) {
      this.commandFeedback.innerHTML = '🌵 <strong>NIVEL 1:</strong> Desierto Inicial 1,500m &amp; Portal de escape';
      this.commandFeedback.style.color = '#a7f3d0';
    } else {
      const match = clean.match(/\d+/);
      if (match) {
        const n = parseInt(match[0], 10);
        this.commandFeedback.innerHTML = `🚀 Nivel detectado: <strong>NIVEL ${Math.min(4, Math.max(1, n))}</strong>`;
        this.commandFeedback.style.color = '#38bdf8';
      } else {
        this.commandFeedback.innerHTML = '❓ Comando no reconocido. Prueba escribir <strong>"4 nivel"</strong> o <strong>"123"</strong>';
        this.commandFeedback.style.color = '#f87171';
      }
    }
  }

  executeLevelCommand(cmdText) {
    const clean = (cmdText || '').trim().toLowerCase();
    soundManager.init();
    soundManager.playMenuSelect();
    soundManager.playSpookyTransition();

    this.closeCommandModal();

    if (clean.includes('boss') || clean.includes('jefe') || clean.includes('fantasma') || clean === '4-boss') {
      this.startAtLevel(4, true);
      return;
    }

    if (clean.includes('4') || clean.includes('cuatro') || clean.includes('four')) {
      this.startAtLevel(4, false);
      return;
    }

    if (clean.includes('3') || clean.includes('tres') || clean.includes('three') || clean === '123') {
      this.startAtLevel(3, false);
      return;
    }

    if (clean.includes('2') || clean.includes('dos') || clean.includes('two')) {
      this.startAtLevel(2, false);
      return;
    }

    if (clean.includes('1') || clean.includes('uno') || clean.includes('one')) {
      this.startAtLevel(1, false);
      return;
    }

    const match = clean.match(/\d+/);
    if (match) {
      const n = parseInt(match[0], 10);
      if (n >= 4) {
        this.startAtLevel(4, false);
      } else if (n === 3) {
        this.startAtLevel(3, false);
      } else if (n === 2) {
        this.startAtLevel(2, false);
      } else {
        this.startAtLevel(1, false);
      }
      return;
    }

    // Por defecto inicia Nivel 1
    this.startAtLevel(1, false);
  }

  hideAllScreens() {
    if (this.screenTitle) {
      this.screenTitle.classList.remove('active');
      this.screenTitle.classList.add('hidden');
    }
    if (this.screenSecond) {
      this.screenSecond.classList.remove('active');
      this.screenSecond.classList.add('hidden');
    }
    if (this.screenBoarding) {
      this.screenBoarding.classList.remove('active');
      this.screenBoarding.classList.add('hidden');
    }
    if (this.screenLevel3) {
      this.screenLevel3.classList.remove('active');
      this.screenLevel3.classList.add('hidden');
    }
    if (this.screenLevel4) {
      this.screenLevel4.classList.remove('active');
      this.screenLevel4.classList.add('hidden');
    }
    if (this.screenExplosion) {
      this.screenExplosion.classList.remove('active');
      this.screenExplosion.classList.add('hidden');
    }
    if (this.titleControlsModal) this.titleControlsModal.classList.add('hidden');
    if (this.titleCommandModal) this.titleCommandModal.classList.add('hidden');
  }

  startAtLevel(levelNum, instantBoss = false) {
    this.activeScreen = 'game';
    this.hideAllScreens();
    if (levelNum === 4) {
      this.game.startLevel4(instantBoss);
    } else if (levelNum === 3) {
      this.game.startLevel3();
    } else if (levelNum === 2) {
      this.game.startLevel2(true);
    } else {
      this.game.startGame();
    }
  }

  startGameplay() {
    this.activeScreen = 'game';
    this.hideAllScreens();
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
      } else if (this.activeScreen === 'boarding_cinematic') {
        this.renderBoardingEffects(dt);
      } else if (this.activeScreen === 'level3_transition') {
        this.renderLevel3Effects(dt);
      } else if (this.activeScreen === 'level4_transition') {
        this.renderLevel4Effects(dt);
      } else if (this.activeScreen === 'train_explosion') {
        this.renderExplosionEffects(dt);
      } else if (this.activeScreen === 'gameover') {
        this.renderGameOverEffects(dt);
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

  // --------------------------------------------------------------------------
  // CINEMATIC: Ghost Train Boarding Canvas FX
  // --------------------------------------------------------------------------
  renderBoardingEffects(dt) {
    if (!this.cinematicCtx) return;
    const ctx = this.cinematicCtx;
    const w = this.cinematicCanvas.width;
    const h = this.cinematicCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. Billowing Ectoplasmic Green Smoke underneath train (y: 430 - 550)
    if (this.boardingParticles.length < 40) {
      this.boardingParticles.push({
        x: 60 + Math.random() * 900,
        y: 450 + Math.random() * 80,
        baseX: 60 + Math.random() * 900,
        vx: -(20 + Math.random() * 40),
        vy: -(15 + Math.random() * 35),
        size: 14 + Math.random() * 24,
        life: 1.0 + Math.random() * 1.2,
        maxLife: 2.2,
        color: Math.random() < 0.65 ? 'rgba(52, 211, 153, 0.45)' : 'rgba(16, 185, 129, 0.35)',
        wave: Math.random() * Math.PI * 2
      });
    }

    for (let i = this.boardingParticles.length - 1; i >= 0; i--) {
      const p = this.boardingParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.boardingParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const alpha = Math.sin((p.life / p.maxLife) * Math.PI);

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1.2 + (1 - alpha)));
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Carriage Lanterns Flickering Orange Glow (x: 220, 600)
    const lanternFlicker = 0.85 + 0.15 * Math.sin(this.time * 18);
    const orangeGlow = ctx.createRadialGradient(220, 340, 5, 220, 340, 70 * lanternFlicker);
    orangeGlow.addColorStop(0, `rgba(249, 115, 22, ${0.45 * lanternFlicker})`);
    orangeGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = orangeGlow;
    ctx.beginPath();
    ctx.arc(220, 340, 70 * lanternFlicker, 0, Math.PI * 2);
    ctx.fill();

    // 3. Eerie Skull Engine Green Glow (right side, x: 920, y: 260)
    const skullGlow = ctx.createRadialGradient(920, 260, 10, 920, 260, 140);
    skullGlow.addColorStop(0, 'rgba(52, 211, 153, 0.4)');
    skullGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = skullGlow;
    ctx.beginPath();
    ctx.arc(920, 260, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SCREEN 3: LEVEL 3 TRANSITION SCREEN CANVAS FX
  // --------------------------------------------------------------------------
  renderLevel3Effects(dt) {
    if (!this.level3Ctx) return;
    const ctx = this.level3Ctx;
    const w = this.level3Canvas.width;
    const h = this.level3Canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. TOP GREEN CRYSTAL "3" EMERALD PULSE (x: 508, y: 92)
    const gemPulse = 1 + 0.18 * Math.sin(this.time * 4.2);
    const gemGlow = ctx.createRadialGradient(508, 92, 5, 508, 92, 95 * gemPulse);
    gemGlow.addColorStop(0, `rgba(52, 211, 153, ${0.75 * gemPulse})`);
    gemGlow.addColorStop(0.4, 'rgba(16, 185, 129, 0.45)');
    gemGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = gemGlow;
    ctx.beginPath();
    ctx.arc(508, 92, 95 * gemPulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. WARM GOLDEN LANTERN FLICKER (x: 614, y: 445)
    const flicker = 1 + 0.09 * Math.sin(this.time * 20) + 0.06 * Math.cos(this.time * 27);
    const lanternGrad = ctx.createRadialGradient(614, 445, 6, 614, 445, 165 * flicker);
    lanternGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
    lanternGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.48)');
    lanternGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.2)');
    lanternGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lanternGrad;
    ctx.beginPath();
    ctx.arc(614, 445, 165 * flicker, 0, Math.PI * 2);
    ctx.fill();

    // 3. GREEN HELLFIRE SWIRLING AROUND COWBOY (x: 430 to 590, y: 320 to 540)
    if (this.level3Particles.length < 45) {
      this.level3Particles.push({
        x: 430 + Math.random() * 160,
        y: 490 + Math.random() * 40,
        baseX: 430 + Math.random() * 160,
        vy: -(45 + Math.random() * 75),
        size: 4 + Math.random() * 9,
        life: 0.8 + Math.random() * 0.8,
        maxLife: 1.2,
        color: Math.random() < 0.65 ? '#10b981' : '#34d399',
        wave: Math.random() * Math.PI * 2
      });
    }

    for (let i = this.level3Particles.length - 1; i >= 0; i--) {
      const p = this.level3Particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.level3Particles.splice(i, 1);
        continue;
      }
      p.y += p.vy * dt;
      p.x = p.baseX + Math.sin(this.time * 5.5 + p.wave) * 14;
      const alpha = p.life / p.maxLife;

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. SKELETON COWBOY RED GLOWING EYES (x: 528, y: 395 and x: 546, y: 395)
    const eyeBlink = (Math.sin(this.time * 1.6) > 0.95) ? 0 : 1;
    if (eyeBlink) {
      const eyeGlow = 0.85 + 0.25 * Math.sin(this.time * 6);
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(528, 395, 2.8 * eyeGlow, 0, Math.PI * 2);
      ctx.arc(546, 395, 2.8 * eyeGlow, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. GOLDEN CELEBRATION SPARKLES around "LEVEL 3" Title (x: 512, y: 155)
    const titleSparkle = Math.sin(this.time * 8);
    if (titleSparkle > 0.4) {
      const sx = 340 + Math.random() * 340;
      const sy = 130 + Math.random() * 50;
      this.drawFourPointStar(ctx, sx, sy, 4 + Math.random() * 4, '#fef08a', 0.9);
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SCREEN 4: GAME OVER SCREEN CANVAS FX (FALLEN GUNSLINGER & SMOKING SKULL)
  // --------------------------------------------------------------------------
  renderGameOverEffects(dt) {
    if (!this.gameoverCtx || !this.gameoverCanvas) return;
    const ctx = this.gameoverCtx;
    const w = this.gameoverCanvas.width;
    const h = this.gameoverCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // 1. PULSATING CRIMSON GLOW OVER "GAME OVER" LETTERS (center: x ~ 508, y ~ 168)
    const textPulse = 0.85 + 0.25 * Math.sin(this.time * 3.5);
    const redGlow = ctx.createRadialGradient(508, 168, 10, 508, 168, 220);
    redGlow.addColorStop(0, `rgba(239, 68, 68, ${0.4 * textPulse})`);
    redGlow.addColorStop(0.5, `rgba(185, 28, 28, ${0.2 * textPulse})`);
    redGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = redGlow;
    ctx.beginPath();
    ctx.arc(508, 168, 220, 0, Math.PI * 2);
    ctx.fill();

    // 2. GREEN ECTOPLASMIC SMOKE RISING FROM FALLEN SKULL (x: 375, y: 440) AND RIBS (x: 520, y: 360)
    if (this.gameoverParticles.length < 50) {
      // Spawn at skull or ribs
      const atSkull = Math.random() < 0.55;
      const originX = atSkull ? 375 + (Math.random() - 0.5) * 45 : 515 + (Math.random() - 0.5) * 80;
      const originY = atSkull ? 435 + (Math.random() - 0.5) * 25 : 355 + (Math.random() - 0.5) * 30;

      this.gameoverParticles.push({
        x: originX,
        y: originY,
        baseX: originX,
        vx: (Math.random() - 0.5) * 22,
        vy: -(25 + Math.random() * 45),
        size: 8 + Math.random() * 14,
        life: 0.9 + Math.random() * 1.1,
        maxLife: 2.0,
        color: Math.random() < 0.7 ? '#34d399' : '#10b981',
        wave: Math.random() * Math.PI * 2
      });
    }

    for (let i = this.gameoverParticles.length - 1; i >= 0; i--) {
      const p = this.gameoverParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.gameoverParticles.splice(i, 1);
        continue;
      }
      p.y += p.vy * dt;
      p.x = p.baseX + Math.sin(this.time * 3.5 + p.wave) * 16;
      p.size += 8 * dt; // Smoke billows outward as it rises
      const alpha = Math.sin((p.life / p.maxLife) * Math.PI);

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, `rgba(52, 211, 153, ${0.45 * alpha})`);
      grad.addColorStop(0.6, `rgba(16, 185, 129, ${0.25 * alpha})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. FLICKERING AMBER EMBERS FROM BROKEN LANTERN (x: 720, y: 550)
    const lanternFlicker = 0.7 + 0.3 * Math.sin(this.time * 16);
    const lanternGlow = ctx.createRadialGradient(720, 545, 5, 720, 545, 65 * lanternFlicker);
    lanternGlow.addColorStop(0, `rgba(245, 158, 11, ${0.35 * lanternFlicker})`);
    lanternGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = lanternGlow;
    ctx.beginPath();
    ctx.arc(720, 545, 65 * lanternFlicker, 0, Math.PI * 2);
    ctx.fill();

    // 4. STEAMPUNK GEARS SUBTLE CORNER GLINT (x: 55, y: 55 and x: 965, y: 55)
    if (Math.sin(this.time * 4) > 0.6) {
      const sparkleAlpha = (Math.sin(this.time * 4) - 0.6) / 0.4;
      this.drawFourPointStar(ctx, 55, 55, 6, '#fef08a', sparkleAlpha * 0.7);
      this.drawFourPointStar(ctx, 965, 55, 6, '#fef08a', sparkleAlpha * 0.7);
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SCREEN 4: LEVEL 4 TRANSITION CANVAS FX (Crystal 4, Cyan Flames & Lantern)
  // --------------------------------------------------------------------------
  renderLevel4Effects(dt) {
    if (!this.level4Ctx) return;
    const ctx = this.level4Ctx;
    const w = this.level4Canvas.width;
    const h = this.level4Canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // 1. Crystal 4 Shimmering Pulse at Top Center (x: 530, y: 58)
    const crystalPulse = 0.85 + Math.sin(this.time * 3.5) * 0.15;
    const cGlow = ctx.createRadialGradient(530, 58, 4, 530, 58, 55 * crystalPulse);
    cGlow.addColorStop(0, `rgba(254, 240, 138, ${0.45 * crystalPulse})`);
    cGlow.addColorStop(0.5, `rgba(245, 158, 11, ${0.2 * crystalPulse})`);
    cGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = cGlow;
    ctx.beginPath();
    ctx.arc(530, 58, 55 * crystalPulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Cyan / Blue Flames rising around the Skeleton Gunslinger (x: 535, y: 440)
    if (Math.random() < 0.6) {
      this.level4Particles.push({
        x: 485 + Math.random() * 100,
        y: 470 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 35,
        vy: -50 - Math.random() * 70,
        radius: 2.5 + Math.random() * 3.5,
        color: Math.random() < 0.6 ? '#38bdf8' : (Math.random() < 0.5 ? '#34d399' : '#67e8f9'),
        alpha: 1.0,
        life: 1.2
      });
    }

    // 3. Lantern Glow held in Gunslinger's Hand (x: 618, y: 435)
    const lanternFlicker = 0.8 + Math.sin(this.time * 14) * 0.2;
    const lGlow = ctx.createRadialGradient(618, 435, 6, 618, 435, 70 * lanternFlicker);
    lGlow.addColorStop(0, `rgba(251, 191, 36, ${0.5 * lanternFlicker})`);
    lGlow.addColorStop(0.5, `rgba(217, 119, 6, ${0.25 * lanternFlicker})`);
    lGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = lGlow;
    ctx.beginPath();
    ctx.arc(618, 435, 70 * lanternFlicker, 0, Math.PI * 2);
    ctx.fill();

    // 4. Update and Draw Cyan Flame Particles
    this.level4Particles = this.level4Particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 1.2);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return p.life > 0;
    });

    // 5. Gear Glint Stars at Top-Left (x: 52, y: 52) and Bottom-Left (x: 52, y: 575)
    if (Math.sin(this.time * 4) > 0.55) {
      const sparkleAlpha = (Math.sin(this.time * 4) - 0.55) / 0.45;
      this.drawFourPointStar(ctx, 52, 52, 6, '#67e8f9', sparkleAlpha * 0.8);
      this.drawFourPointStar(ctx, 52, 575, 6, '#67e8f9', sparkleAlpha * 0.8);
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SCREEN 5: FINAL TRAIN DETONATION & GUNSLINGER LEAP CINEMATIC FX
  // (Dramatic explosions on the train and gunslinger leaping into the night)
  // --------------------------------------------------------------------------
  renderExplosionEffects(dt) {
    if (!this.explosionCtx) return;
    const ctx = this.explosionCtx;
    const w = this.explosionCanvas.width;
    const h = this.explosionCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // 1. Spawning Explosions along the train engine & carriages (x: 200 to 760, y: 310 to 420)
    if (Math.random() < 0.45) {
      const expX = 220 + Math.random() * 560;
      const expY = 300 + Math.random() * 120;
      const isGreen = Math.random() < 0.6;
      for (let i = 0; i < 8; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 180;
        this.explosionParticles.push({
          x: expX,
          y: expY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          radius: 4 + Math.random() * 6,
          color: isGreen ? '#34d399' : '#f97316',
          alpha: 1.0,
          life: 0.8
        });
      }
    }

    // 2. Screen Flash & Shockwave Rings
    const flashIntensity = Math.abs(Math.sin(this.time * 6)) * 0.15;
    ctx.fillStyle = `rgba(52, 211, 153, ${flashIntensity})`;
    ctx.fillRect(0, 0, w, h);

    // 3. Gunslinger Silhouette leaping through the air from the train towards the ground!
    // Leaps in slow motion arc: x from 450 to 180, y arched
    const leapProgress = (this.time * 0.35) % 1.0;
    const heroX = 460 - leapProgress * 280;
    const heroY = 340 - Math.sin(leapProgress * Math.PI) * 75 + leapProgress * 90;

    ctx.save();
    ctx.translate(heroX, heroY);
    ctx.rotate(0.3 - leapProgress * 0.6); // Rotating dive
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 16;
    // Hat
    ctx.fillRect(-12, -18, 24, 4);
    ctx.fillRect(-6, -24, 12, 6);
    // Skull
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();
    // Coat billowing in slow motion
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(-22, -14);
    ctx.lineTo(-18, 12);
    ctx.lineTo(6, 10);
    ctx.closePath();
    ctx.fill();
    // Glowing green guns
    ctx.fillStyle = '#34d399';
    ctx.fillRect(8, -2, 10, 3);
    ctx.fillRect(6, 4, 10, 3);
    ctx.restore();

    // 4. Update and Draw Explosion Particles
    this.explosionParticles = this.explosionParticles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.8);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return p.life > 0;
    });

    ctx.restore();
  }

  checkCheckpointAvailable() {
    try {
      const data = localStorage.getItem('desert_revenant_checkpoint');
      if (data && this.btnTitleResume) {
        const cp = JSON.parse(data);
        if (cp && cp.level) {
          if (this.titleResumeLevel) this.titleResumeLevel.textContent = cp.level;
          this.btnTitleResume.classList.remove('hidden');
          return;
        }
      }
    } catch (e) {
      // Ignorar parse error
    }
    if (this.btnTitleResume) this.btnTitleResume.classList.add('hidden');
  }
}

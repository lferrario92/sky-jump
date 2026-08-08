import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_RADIUS,
  MOVE_SPEED,
  JUMP_VELOCITY,
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
  PLATFORM_WIDTH_VARY_START,
  PLATFORM_MIN_WIDTH,
  PLATFORM_MAX_WIDTH,
  PLATFORM_MIN_GAP,
  PLATFORM_MAX_GAP,
  MAX_REACH,
  START_PLATFORM_WIDTH,
  WORLD_HEIGHT,
  PLAYER_SCREEN_Y,
  DEATH_MARGIN,
  MOVING_PLATFORM_START,
  MOVING_PLATFORM_BASE_SPEED,
  MOVING_PLATFORM_SPEED_PER_KM,
  MOVING_PLATFORM_MAX_SPEED,
  MOVING_SPEED_JITTER,
  OBSTACLE_START,
  OBSTACLE_BASE_CHANCE,
  OBSTACLE_MAX_CHANCE,
  OBSTACLE_RADIUS,
  POWERUP_RADIUS,
  POWERUP_FLOAT,
  SHIELD_START,
  SHIELD_EVERY,
  SUPER_JUMP_START,
  SUPER_JUMP_EVERY,
  SUPER_JUMP_VELOCITY,
  EXTRA_LIFE_START,
  EXTRA_LIFE_EVERY,
  SAVE_PLATFORM_WIDTH,
  PLATFORM_DURABLE_START,
  PLATFORM_WEAK_START,
} from '../const.js';

const CLOUD_COUNT = 8;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create(data) {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    this.dead = false;
    this.startMeters = (data && data.startMeters) || 0;
    this.baseHeight = this.startMeters * 10;

    // Always start on a wide platform near the bottom of the first screen.
    const startScreenY = h - 130;
    this.startY = WORLD_HEIGHT - 600;
    this.camY = this.startY - startScreenY;

    this.physics.world.setBounds(0, 0, w, WORLD_HEIGHT, true, true, false, false);

    this.add.rectangle(w / 2, WORLD_HEIGHT / 2, w, WORLD_HEIGHT, 0x87ceeb).setDepth(0);

    this.createTextures();
    this.createClouds();

    // Platforms are dynamic but immovable, so they can drift horizontally.
    this.platforms = this.physics.add.group({
      immovable: true,
      allowGravity: false,
      collideWorldBounds: true,
    });

    const startPlat = this.platforms.create(w / 2, this.startY, 'platformStart');
    startPlat.setDepth(2);
    startPlat.uses = Infinity;
    startPlat.body.setBounceX(1);

    this.bombs = this.physics.add.staticGroup();
    this.powerups = this.physics.add.staticGroup();

    this.shield = 0;
    this.superJumpActive = false;
    this.extraLives = 0;
    this.nextShieldAt = SHIELD_START;
    this.nextSuperJumpAt = SUPER_JUMP_START;
    this.nextExtraLifeAt = EXTRA_LIFE_START;
    this.defaultMaxVY = 1500;

    // Rows above the start platform, always closer than the jump height.
    this.spawnCursor = this.startY;
    this.lastX = w / 2;
    while (this.spawnCursor > this.camY - 300) {
      this.spawnNextRow();
    }

    this.player = this.add
      .circle(w / 2, this.startY - PLATFORM_HEIGHT / 2 - PLAYER_RADIUS + 1, PLAYER_RADIUS, 0xff6b6b)
      .setStrokeStyle(3, 0xffffff)
      .setDepth(3);

    this.physics.add.existing(this.player);
    this.player.body.setSize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(MOVE_SPEED, 1500);
    this.physics.add.collider(this.player, this.platforms, this.onPlatform, this.canLandOnTop, this);
    this.physics.add.overlap(this.player, this.bombs, this.onBomb, null, this);
    this.physics.add.overlap(this.player, this.powerups, this.onPowerup, null, this);

    this.cameras.main.setScroll(0, this.camY);

    this.score = 0;
    this.scoreText = this.add
      .text(12, 12, 'Height: 0 m', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setStroke('#1b4d6b', 6)
      .setDepth(10)
      .setScrollFactor(0);

    this.add
      .text(w / 2, h - 14, 'drag left / right  ·  arrows', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#e8f6ff',
      })
      .setOrigin(0.5, 1)
      .setStroke('#1b4d6b', 4)
      .setDepth(10)
      .setScrollFactor(0);

    this.shieldHud = this.add
      .image(w - 34, 36, 'powerupShield')
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);
    this.shieldCountText = this.add
      .text(w - 50, 28, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setStroke('#1b4d6b', 4)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);

    this.lifeHud = this.add
      .image(w - 34, 72, 'powerupLife')
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);
    this.lifeCountText = this.add
      .text(w - 50, 64, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setStroke('#1b4d6b', 4)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);

    this.flashText = this.add
      .text(w / 2, h / 2, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5)
      .setStroke('#7a4f00', 6)
      .setDepth(11)
      .setVisible(false);

    this.shieldAura = this.add.image(0, 0, 'auraShield').setAlpha(0.5).setScale(1.6).setDepth(2.5).setVisible(false);
    this.superAura = this.add.image(0, 0, 'auraJump').setAlpha(0.6).setScale(2.2).setDepth(2.5).setVisible(false);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.addPointer(1);
    this.targetX = this.player.x;
    this.input.on('pointerdown', (pointer) => {
      this.targetX = pointer.worldX;
    });
    this.input.on('pointermove', (pointer) => {
      this.targetX = pointer.worldX;
    });
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0x8bd45f, 1);
    g.fillRoundedRect(0, 0, START_PLATFORM_WIDTH, PLATFORM_HEIGHT, 5);
    g.lineStyle(2, 0x4a7c2f, 1);
    g.strokeRoundedRect(0, 0, START_PLATFORM_WIDTH, PLATFORM_HEIGHT, 5);
    g.generateTexture('platformStart', START_PLATFORM_WIDTH, PLATFORM_HEIGHT);

    g.clear();
    const r = OBSTACLE_RADIUS;
    g.fillStyle(0x2b2b2b, 1);
    g.fillCircle(r, r + 1, r - 1);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(r, r + 1, r - 1);
    g.fillStyle(0x9aa0a6, 1);
    g.fillRect(r - 1.5, 0, 3, 5);
    g.fillStyle(0xffd166, 1);
    g.fillCircle(r, 1, 3);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(r + 5, r - 4, 3);
    g.generateTexture('bomb', r * 2, r * 2);

    const pr = POWERUP_RADIUS;
    g.clear();
    g.fillStyle(0x1e88e5, 1);
    g.fillCircle(pr, pr, pr - 1);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(pr, pr, pr - 1);
    g.fillStyle(0xffffff, 1);
    g.fillPoints(
      [
        new Phaser.Geom.Point(pr, pr - pr * 0.55),
        new Phaser.Geom.Point(pr - pr * 0.42, pr - pr * 0.1),
        new Phaser.Geom.Point(pr - pr * 0.2, pr + pr * 0.35),
        new Phaser.Geom.Point(pr, pr + pr * 0.55),
        new Phaser.Geom.Point(pr + pr * 0.2, pr + pr * 0.35),
        new Phaser.Geom.Point(pr + pr * 0.42, pr - pr * 0.1),
      ],
      true
    );
    g.generateTexture('powerupShield', pr * 2, pr * 2);

    g.clear();
    g.fillStyle(0xf57c00, 1);
    g.fillCircle(pr, pr, pr - 1);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(pr, pr, pr - 1);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(pr, pr - pr * 0.55, pr - pr * 0.5, pr + pr * 0.1, pr + pr * 0.5, pr + pr * 0.1);
    g.fillRect(pr - pr * 0.16, pr + pr * 0.1, pr * 0.32, pr * 0.5);
    g.generateTexture('powerupJump', pr * 2, pr * 2);

    g.clear();
    g.fillStyle(0x43a047, 1);
    g.fillCircle(pr, pr, pr - 1);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(pr, pr, pr - 1);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(pr - pr * 0.28, pr - pr * 0.15, pr * 0.3);
    g.fillCircle(pr + pr * 0.28, pr - pr * 0.15, pr * 0.3);
    g.fillTriangle(pr - pr * 0.52, pr - pr * 0.05, pr + pr * 0.52, pr - pr * 0.05, pr, pr + pr * 0.55);
    g.generateTexture('powerupLife', pr * 2, pr * 2);

    g.clear();
    g.fillStyle(0x4fc3f7, 0.5);
    g.fillCircle(PLAYER_RADIUS + 6, PLAYER_RADIUS + 6, PLAYER_RADIUS + 6);
    g.generateTexture('auraShield', (PLAYER_RADIUS + 6) * 2, (PLAYER_RADIUS + 6) * 2);

    g.clear();
    g.fillStyle(0xffb74d, 0.6);
    g.fillCircle(PLAYER_RADIUS + 8, PLAYER_RADIUS + 8, PLAYER_RADIUS + 8);
    g.generateTexture('auraJump', (PLAYER_RADIUS + 8) * 2, (PLAYER_RADIUS + 8) * 2);

    g.destroy();
  }

  // Generates a platform texture for a given color + width (cached).
  ensurePlatformTexture(color, width) {
    const key = `platform_${color}_${width}`;
    if (this.textures.exists(key)) {
      return key;
    }

    const colors = {
      green: [0x8bd45f, 0x4a7c2f],
      yellow: [0xffd166, 0xc88a1f],
      red: [0xff6b6b, 0xa83232],
    };
    const [fill, stroke] = colors[color];

    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(fill, 1);
    g.fillRoundedRect(0, 0, width, PLATFORM_HEIGHT, 5);
    g.lineStyle(2, stroke, 1);
    g.strokeRoundedRect(0, 0, width, PLATFORM_HEIGHT, 5);
    g.generateTexture(key, width, PLATFORM_HEIGHT);
    g.destroy();

    return key;
  }

  createClouds() {
    this.clouds = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloud = this.add.rectangle(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        0,
        Phaser.Math.Between(50, 90),
        18,
        0xffffff,
        0.85
      );
      cloud.baseY = Phaser.Math.Between(0, GAME_HEIGHT);
      cloud.setDepth(1);
      cloud.setScrollFactor(0);
      this.clouds.push(cloud);
    }
  }

  spawnRow(y, height) {
    let x = this.lastX + Phaser.Math.Between(-MAX_REACH, MAX_REACH);

    // From 700 m the platform width varies, otherwise use the default width.
    const width = height >= PLATFORM_WIDTH_VARY_START ? this.randomPlatformWidth() : PLATFORM_WIDTH;
    x = Phaser.Math.Clamp(x, width / 2 + 10, GAME_WIDTH - width / 2 - 10);
    this.lastX = x;

    const plat = this.platforms.create(x, y, this.ensurePlatformTexture(this.platformColorFor(height), width));
    plat.setDepth(2);
    plat.uses = this.platformUsesFor(height);
    plat.platformWidth = width;
    plat.body.setBounceX(1);
    return plat;
  }

  randomPlatformWidth() {
    // Quantized to 5px so generated textures get reused.
    return Math.round(Phaser.Math.Between(PLATFORM_MIN_WIDTH, PLATFORM_MAX_WIDTH) / 5) * 5;
  }

  platformColorFor(height) {
    if (height >= PLATFORM_WEAK_START) {
      return 'red';
    }
    if (height >= PLATFORM_DURABLE_START) {
      return 'yellow';
    }
    return 'green';
  }

  platformUsesFor(height) {
    if (height >= PLATFORM_WEAK_START) {
      return 1;
    }
    if (height >= PLATFORM_DURABLE_START) {
      return 2;
    }
    return Infinity;
  }

  spawnNextRow() {
    const gap = Phaser.Math.Between(PLATFORM_MIN_GAP, PLATFORM_MAX_GAP);
    const belowX = this.lastX;
    this.spawnCursor -= gap;

    const height = this.baseHeight + (this.startY - this.spawnCursor);
    const plat = this.spawnRow(this.spawnCursor, height);

    if (height >= MOVING_PLATFORM_START) {
      const extra = ((height - MOVING_PLATFORM_START) / 1000) * MOVING_PLATFORM_SPEED_PER_KM;
      const base = MOVING_PLATFORM_BASE_SPEED + extra;
      const speed = Math.min(
        MOVING_PLATFORM_MAX_SPEED,
        base * Phaser.Math.FloatBetween(1 - MOVING_SPEED_JITTER, 1 + MOVING_SPEED_JITTER)
      );
      plat.body.setVelocityX((Math.random() < 0.5 ? -1 : 1) * speed);
    }

    this.maybeAddBomb(this.spawnCursor + gap / 2, height, belowX);
    this.maybeSpawnPowerups(height, plat);
  }

  maybeAddBomb(y, height, belowX) {
    if (height < OBSTACLE_START) {
      return;
    }
    const chance = Math.min(
      OBSTACLE_MAX_CHANCE,
      OBSTACLE_BASE_CHANCE + (height - OBSTACLE_START) / 20000
    );
    if (Math.random() > chance) {
      return;
    }

    let x = Phaser.Math.Between(OBSTACLE_RADIUS + 12, GAME_WIDTH - OBSTACLE_RADIUS - 12);
    if (Math.abs(x - belowX) < 55) {
      x = x < belowX ? x - 55 : x + 55;
      x = Phaser.Math.Clamp(x, OBSTACLE_RADIUS + 12, GAME_WIDTH - OBSTACLE_RADIUS - 12);
    }

    this.bombs.create(x, y, 'bomb').setDepth(3);
  }

  // Spawns one powerup of each type whenever a scheduled height threshold is crossed.
  maybeSpawnPowerups(height, plat) {
    const y = plat.y - POWERUP_FLOAT;
    while (height >= this.nextShieldAt) {
      this.spawnPowerup(plat.x, y, 'shield');
      this.nextShieldAt += SHIELD_EVERY;
    }
    while (height >= this.nextSuperJumpAt) {
      this.spawnPowerup(plat.x, y, 'superjump');
      this.nextSuperJumpAt += SUPER_JUMP_EVERY;
    }
    while (height >= this.nextExtraLifeAt) {
      this.spawnPowerup(plat.x, y, 'life');
      this.nextExtraLifeAt += EXTRA_LIFE_EVERY;
    }
  }

  spawnPowerup(x, y, type) {
    const key =
      type === 'shield' ? 'powerupShield' : type === 'superjump' ? 'powerupJump' : 'powerupLife';
    const xOffset = type === 'shield' ? -16 : type === 'superjump' ? 16 : 0;
    x = Phaser.Math.Clamp(x + xOffset, POWERUP_RADIUS + 8, GAME_WIDTH - POWERUP_RADIUS - 8);
    const powerup = this.powerups.create(x, y, key);
    powerup.type = type;
    powerup.setDepth(3);
    this.tweens.add({
      targets: powerup,
      scale: 1.12,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  onPowerup(player, powerup) {
    this.tweens.killTweensOf(powerup);
    if (powerup.type === 'shield') {
      this.shield += 1;
      this.updateShieldHud();
      this.showFlash('SHIELD!');
    } else if (powerup.type === 'superjump') {
      this.triggerSuperJump();
      this.showFlash('SUPER JUMP!');
    } else if (powerup.type === 'life') {
      this.extraLives += 1;
      this.updateLifeHud();
      this.showFlash('EXTRA LIFE!');
    }
    powerup.destroy();
  }

  triggerSuperJump() {
    this.superJumpActive = true;
    this.player.body.setMaxVelocity(MOVE_SPEED, SUPER_JUMP_VELOCITY * 1.5);
    this.player.body.setVelocityY(-SUPER_JUMP_VELOCITY);
    this.superAura.setVisible(true);
  }

  updateShieldHud() {
    this.shieldHud.setVisible(this.shield > 0);
    this.shieldCountText.setVisible(this.shield > 1).setText(`\u00d7${this.shield}`);
    this.shieldAura.setVisible(this.shield > 0);
  }

  updateLifeHud() {
    this.lifeHud.setVisible(this.extraLives > 0);
    this.lifeCountText.setVisible(this.extraLives > 1).setText(`\u00d7${this.extraLives}`);
  }

  // Reusable center-of-screen feedback text.
  showFlash(text) {
    this.tweens.killTweensOf(this.flashText);
    this.flashText.setText(text).setY(GAME_HEIGHT / 2).setScale(1).setAlpha(1).setVisible(true);
    this.tweens.add({
      targets: this.flashText,
      y: GAME_HEIGHT / 2 - 60,
      scale: 1.25,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => this.flashText.setVisible(false),
    });
  }

  // Spawns a green mini platform under the falling player to save them.
  savePlayer() {
    this.extraLives -= 1;
    this.updateLifeHud();

    const player = this.player;
    const platY = player.y + PLAYER_RADIUS + PLATFORM_HEIGHT / 2 + 2;
    const savePlat = this.platforms.create(
      player.x,
      platY,
      this.ensurePlatformTexture('green', SAVE_PLATFORM_WIDTH)
    );
    savePlat.setDepth(2);
    savePlat.uses = Infinity;
    savePlat.platformWidth = SAVE_PLATFORM_WIDTH;
    savePlat.body.setBounceX(1);

    player.body.setVelocityY(-JUMP_VELOCITY);
    this.showFlash('SAVED!');
  }

  onBomb(player, bomb) {
    if (this.superJumpActive) {
      bomb.destroy();
      return;
    }
    if (this.shield > 0) {
      this.shield -= 1;
      this.updateShieldHud();
      bomb.destroy();
      return;
    }
    this.dead = true;
    this.scene.start('GameOver', { score: this.score, startMeters: this.startMeters });
  }

  onPlatform(player, platform) {
    if (player.body.touching.down) {
      player.body.setVelocityY(-JUMP_VELOCITY);
      if (this.superJumpActive) {
        this.superJumpActive = false;
        player.body.setMaxVelocity(MOVE_SPEED, this.defaultMaxVY);
        this.superAura.setVisible(false);
      }
      this.hitPlatform(platform);
    }
  }

  // Platforms can break: infinite uses stay green, 2 uses go yellow -> red,
  // and 1 use platforms are red from the start.
  hitPlatform(platform) {
    if (platform.uses === Infinity) {
      return;
    }
    platform.uses -= 1;
    if (platform.uses <= 0) {
      platform.destroy();
    } else {
      platform.setTexture(this.ensurePlatformTexture('red', platform.platformWidth));
    }
  }

  // One-way platforms: the player passes through from below or the side
  // and only bounces when falling onto the top of a platform.
  canLandOnTop(player, platform) {
    const body = player.body;
    if (body.velocity.y <= 0) {
      return false;
    }
    const bottomLastFrame = body.prev.y + body.halfHeight;
    return bottomLastFrame <= platform.body.top + 4;
  }

  update() {
    if (this.dead) {
      return;
    }

    const player = this.player;
    const body = player.body;

    let dir = 0;
    const pointer = this.input.activePointer;
    if (pointer.isDown) {
      dir = Phaser.Math.Clamp((this.targetX - player.x) * 0.08, -1, 1);
    } else {
      if (this.cursors.left.isDown) {
        dir = -1;
      } else if (this.cursors.right.isDown) {
        dir = 1;
      }
    }
    body.setVelocityX(dir * MOVE_SPEED);

    // Use the body's current center: the game object only receives the
    // physics position during POST_UPDATE (after this update), so using
    // player.y here would lag the camera one frame behind the ball.
    const desiredCamY = player.body.center.y - PLAYER_SCREEN_Y;
    if (desiredCamY < this.camY) {
      this.camY = desiredCamY;
      this.cameras.main.setScroll(0, this.camY);
    }

    const scroll = this.camY * 0.3;
    for (const cloud of this.clouds) {
      cloud.y = ((cloud.baseY - scroll) % GAME_HEIGHT + GAME_HEIGHT) % GAME_HEIGHT;
    }

    while (this.spawnCursor > this.camY - 300) {
      this.spawnNextRow();
    }

    for (const plat of this.platforms.getChildren()) {
      if (plat.y > this.camY + GAME_HEIGHT + 150) {
        plat.destroy();
      }
    }
    for (const bomb of this.bombs.getChildren()) {
      if (bomb.y > this.camY + GAME_HEIGHT + 150) {
        bomb.destroy();
      }
    }
    for (const powerup of this.powerups.getChildren()) {
      if (powerup.y > this.camY + GAME_HEIGHT + 150) {
        this.tweens.killTweensOf(powerup);
        powerup.destroy();
      }
    }

    if (this.shieldAura.visible) {
      this.shieldAura.setPosition(player.x, player.y);
    }
    if (this.superAura.visible) {
      this.superAura.setPosition(player.x, player.y);
    }

    const total = this.baseHeight + (this.startY - player.y);
    if (total > this.score) {
      this.score = Math.floor(total / 10);
      this.scoreText.setText(`Height: ${this.score} m`);
    }

    const bottom = this.camY + GAME_HEIGHT;
    if (this.extraLives > 0 && player.y > bottom - PLAYER_RADIUS) {
      this.savePlayer();
    } else if (player.y > bottom + DEATH_MARGIN) {
      this.dead = true;
      this.scene.start('GameOver', { score: this.score, startMeters: this.startMeters });
    }
  }
}

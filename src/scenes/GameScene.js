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

  onBomb() {
    this.dead = true;
    this.scene.start('GameOver', { score: this.score, startMeters: this.startMeters });
  }

  onPlatform(player, platform) {
    if (player.body.touching.down) {
      player.body.setVelocityY(-JUMP_VELOCITY);
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

    const desiredCamY = player.y - PLAYER_SCREEN_Y;
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

    const total = this.baseHeight + (this.startY - player.y);
    if (total > this.score) {
      this.score = Math.floor(total / 10);
      this.scoreText.setText(`Height: ${this.score} m`);
    }

    if (player.y > this.camY + GAME_HEIGHT + DEATH_MARGIN) {
      this.dead = true;
      this.scene.start('GameOver', { score: this.score, startMeters: this.startMeters });
    }
  }
}

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_RADIUS } from '../const.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    this.add.rectangle(w / 2, h / 2, w, h, 0x87ceeb);

    this.add
      .text(w / 2, h * 0.15, 'SKY JUMP', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#1b4d6b', 8);

    const platformY = h * 0.3;
    this.add.rectangle(w / 2, platformY, 130, 14, 0x8bd45f, 0.9).setStrokeStyle(2, 0x4a7c2f);

    const ball = this.add.circle(w / 2, platformY - 14 - PLAYER_RADIUS, PLAYER_RADIUS, 0xff6b6b)
      .setStrokeStyle(3, 0xffffff);

    this.tweens.add({
      targets: ball,
      y: platformY - 40 - PLAYER_RADIUS,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut',
    });

    this.addStartButton('Start', h * 0.5, 0);
    this.addStartButton('Start from 500 m', h * 0.64, 500);
    this.addStartButton('Start from 1000 m', h * 0.78, 1000);

    this.add
      .text(w / 2, h * 0.93, 'Touch: drag left / right  ·  Keyboard: arrow keys', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#e8f6ff',
      })
      .setOrigin(0.5)
      .setStroke('#1b4d6b', 4);

    this.input.keyboard.once('keydown', () => {
      this.scene.start('Game', { startMeters: 0 });
    });
  }

  addStartButton(label, y, meters) {
    const w = 250;
    const h = 52;
    const radius = 12;

    const btn = this.add
      .rectangle(GAME_WIDTH / 2, y, w, h, 0x2e86de)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });

    const text = this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1);

    btn.on('pointerover', () => {
      btn.setFillStyle(0x3498db);
      text.setScale(1.05);
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(0x2e86de);
      text.setScale(1);
    });
    btn.on('pointerdown', () => {
      this.scene.start('Game', { startMeters: meters });
    });
  }
}

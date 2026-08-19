import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../const.js';
import { getBestHeight } from '../storage.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data) {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    const score = data.score || 0;
    this.startMeters = data.startMeters || 0;
    const best = getBestHeight();

    this.add.rectangle(w / 2, h / 2, w, h, 0x3a5a8c);

    this.add
      .text(w / 2, h * 0.24, 'GAME OVER', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '46px',
        fontStyle: 'bold',
        color: '#ff6b6b',
      })
      .setOrigin(0.5)
      .setStroke('#1b2b38', 8);

    this.add
      .text(w / 2, h * 0.46, `Height: ${score} m`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#1b2b38', 6);

    this.add
      .text(w / 2, h * 0.58, `Best: ${best} m`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ffd166',
      })
      .setOrigin(0.5)
      .setStroke('#1b2b38', 6);

    this.addButton('Retry', h * 0.74, () => {
      this.scene.start('Game', { startMeters: this.startMeters });
    });
    this.addButton('Main Menu', h * 0.87, () => {
      this.scene.start('MainMenu');
    });
  }

  addButton(label, y, onClick) {
    const bw = 220;
    const bh = 52;
    const btn = this.add
      .rectangle(GAME_WIDTH / 2, y, bw, bh, 0x2e86de)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1);
    btn.on('pointerover', () => btn.setFillStyle(0x3498db));
    btn.on('pointerout', () => btn.setFillStyle(0x2e86de));
    btn.on('pointerdown', onClick);
  }
}

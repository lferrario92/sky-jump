import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../const.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data) {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    const score = data.score || 0;
    this.startMeters = data.startMeters || 0;
    const best = Math.max(parseInt(localStorage.getItem('skyJumpBest') || '0', 10), score);
    localStorage.setItem('skyJumpBest', String(best));

    this.add.rectangle(w / 2, h / 2, w, h, 0x3a5a8c);

    this.add
      .text(w / 2, h * 0.3, 'GAME OVER', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '46px',
        fontStyle: 'bold',
        color: '#ff6b6b',
      })
      .setOrigin(0.5)
      .setStroke('#1b2b38', 8);

    this.add
      .text(w / 2, h * 0.5, `Height: ${score} m`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#1b2b38', 6);

    this.add
      .text(w / 2, h * 0.6, `Best: ${best} m`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ffd166',
      })
      .setOrigin(0.5)
      .setStroke('#1b2b38', 6);

    this.add
      .text(w / 2, h * 0.78, 'Tap or press any key to retry', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#1b2b38', 6);

    this.input.once('pointerdown', this.restart, this);
    this.input.keyboard.once('keydown', this.restart, this);
  }

  restart() {
    this.scene.start('Game', { startMeters: this.startMeters });
  }
}

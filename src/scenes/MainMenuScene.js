import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_RADIUS } from '../const.js';
import { getBestHeight } from '../storage.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const best = getBestHeight();

    this.add.rectangle(w / 2, h / 2, w, h, 0x87ceeb);

    this.add
      .text(w / 2, h * 0.13, 'SKY JUMP', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#1b4d6b', 8);

    const platformY = h * 0.27;
    this.add.rectangle(w / 2, platformY, 130, 14, 0x8bd45f, 0.9).setStrokeStyle(2, 0x4a7c2f);

    const ball = this.add
      .circle(w / 2, platformY - 14 - PLAYER_RADIUS, PLAYER_RADIUS, 0xff6b6b)
      .setStrokeStyle(3, 0xffffff);

    this.tweens.add({
      targets: ball,
      y: platformY - 40 - PLAYER_RADIUS,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut',
    });

    this.addStartButton('Start', h * 0.42, 0, true);
    this.addStartButton('Start from 500 m', h * 0.54, 500, best >= 500);
    this.addStartButton('Start from 1000 m', h * 0.66, 1000, best >= 1000);
    this.addButton('Achievements', h * 0.78, () => this.scene.start('Achievements'));

    this.add
      .text(w / 2, h * 0.92, `Best: ${best} m`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5)
      .setStroke('#1b4d6b', 4);

    this.message = this.add
      .text(w / 2, h * 0.5, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#1b2b38', 6)
      .setAlpha(0);

    this.input.keyboard.once('keydown', () => {
      this.scene.start('Game', { startMeters: 0 });
    });
  }

  addStartButton(label, y, meters, unlocked) {
    const bw = 250;
    const bh = 52;

    const btn = this.add
      .rectangle(GAME_WIDTH / 2, y, bw, bh, unlocked ? 0x2e86de : 0x7f8c8d)
      .setStrokeStyle(3, unlocked ? 0xffffff : 0x666666)
      .setInteractive({ useHandCursor: unlocked });

    const text = this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: unlocked ? '#ffffff' : '#bbbbbb',
      })
      .setOrigin(0.5)
      .setDepth(1);

    if (!unlocked) {
      btn.on('pointerdown', () => this.showMessage(`Reach ${meters} m to unlock`));
      return;
    }

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

  addButton(label, y, onClick) {
    const bw = 250;
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

  showMessage(msg) {
    this.message.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.message);
    this.tweens.add({
      targets: this.message,
      alpha: 0,
      delay: 1000,
      duration: 400,
    });
  }
}

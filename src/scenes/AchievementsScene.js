import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../const.js';
import { getAchievements } from '../achievements.js';

export default class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('Achievements');
  }

  create() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    this.add.rectangle(w / 2, h / 2, w, h, 0x2c5a8c);

    this.add
      .text(w / 2, h * 0.07, 'ACHIEVEMENTS', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#1b2b38', 6);

    const achievements = getAchievements();
    const listTop = h * 0.16;
    const listBottom = h * 0.82;
    const spacing = (listBottom - listTop) / achievements.length;

    achievements.forEach((a, i) => {
      const y = listTop + spacing * i + spacing / 2;
      const boxH = Math.min(64, spacing * 0.72);
      const boxColor = a.unlocked ? 0x8bd45f : 0x556677;
      const boxStroke = a.unlocked ? 0x6aab3f : 0x445566;
      const titleColor = a.unlocked ? '#ffffff' : '#8899aa';
      const descColor = a.unlocked ? '#e8f6ff' : '#778899';

      this.add
        .rectangle(w / 2, y, w - 50, boxH, boxColor, 0.22)
        .setStrokeStyle(2, boxStroke);

      this.add
        .text(w / 2, y - 12, `${a.name}   ${a.unlocked ? 'UNLOCKED' : 'LOCKED'}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: titleColor,
        })
        .setOrigin(0.5);

      this.add
        .text(w / 2, y + 11, a.description, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: descColor,
        })
        .setOrigin(0.5);
    });

    this.addButton('Back', h * 0.9, () => this.scene.start('MainMenu'));
  }

  addButton(label, y, onClick) {
    const bw = 180;
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

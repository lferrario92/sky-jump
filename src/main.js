import Phaser from 'phaser';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import AchievementsScene from './scenes/AchievementsScene.js';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY_Y } from './const.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#87ceeb',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY_Y },
      debug: false,
    },
  },
  scene: [MainMenuScene, GameScene, GameOverScene, AchievementsScene],
};

new Phaser.Game(config);

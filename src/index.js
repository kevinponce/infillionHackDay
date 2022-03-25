import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene'
import PlayScene from './scenes/PlayScene'

const Scenes = [PreloadScene, PlayScene];

const shareConfig = {
  width: 800,
  height: 600,
}

const config = {
  type: Phaser.AUTO,
  ...shareConfig,
  // scale: {
  //   mode: Phaser.Scale.FIT,
  // },
  backgroundColor: '#ffffff',
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
    }
  },
  scene: [...Scenes.map(scene => new scene(shareConfig))],
};

new Phaser.Game(config);

import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.spritesheet('redPlayer', 'assets/redPlayerSprite.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('bluePlayer', 'assets/bluePlayerSprite.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('greenPlayer', 'assets/greenPlayerSprite.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('purplePlayer', 'assets/purplePlayerSprite.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('orangePlayer', 'assets/orangePlayerSprite.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('yellowPlayer', 'assets/yellowPlayerSprite.png', { frameWidth: 22, frameHeight: 22 });

    this.load.spritesheet('enemy', 'assets/enemySprite.png', { frameWidth: 22, frameHeight: 22 });

    this.load.spritesheet('redParticle', 'assets/redParticle.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('blueParticle', 'assets/blueParticle.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('greenParticle', 'assets/greenParticle.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('purpleParticle', 'assets/purpleParticle.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('orangeParticle', 'assets/orangeParticle.png', { frameWidth: 22, frameHeight: 22 });
    this.load.spritesheet('yellowParticle', 'assets/yellowParticle.png', { frameWidth: 22, frameHeight: 22 });

    this.load.spritesheet('redBlockSprite', 'assets/redBlockSprite.png', { frameWidth: 22, frameHeight: 22 });
    
    this.load.image('boostPlatform', 'assets/boostPlatform.png');
    this.load.image('frozenPlatform', 'assets/frozenPlatform.png');
    this.load.image('longPlatform', 'assets/longPlatform.png');
    this.load.image('mediumPlatform', 'assets/mediumPlatform.png');
    this.load.image('smallPlatform', 'assets/smallPlatform.png');
    this.load.image('spikePlatform', 'assets/spikePlatform.png');
    this.load.image('finishPlatform', 'assets/finishPlatform.png');

    this.load.atlas('fireworks', 'assets/fireworks.png', 'assets/fireworks.json');
  }

  create() {
    this.scene.start('PlayScene');
  }

  update() { }
}

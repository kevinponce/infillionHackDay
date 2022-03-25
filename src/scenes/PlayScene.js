import Phaser from 'phaser';
import { io } from 'socket.io-client';

import { SOCKET_IO_URL } from '../constants/environment';

const SPEED_X = 400;
const SPEED_Y = 400;

Array.prototype.sample = function(){
  return this[Math.floor(Math.random()*this.length)];
}

export default class PlayScene extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');

    this.config = config;

    this.sprite = null;
    this.otherPlayers = null;
    this.enemies = null;

    this.platforms = null;
    this.frozenPlatforms = null;
    this.boostPlatforms = null;
    this.deathPlatforms = null;
    this.finishPlatforms = null;
    this.mystryBlock = null;

    this.keyLeft = null;
    this.keyRight = null;
    this.keyUp = null;
    this.keySpace = null;

    this.me = {
      color: ['red', 'blue', 'green', 'purple', 'orange','yellow'].sample(),
      frozen: false,
      freezable: true,
      boosted: false,
      boostable: true,
      emitter: null,
      dead: false,
      dieable: true,
      x: 100,
      y: 100,
      powerUp: null,
      onGround: false,
    }

    this.players = {};

    this.map = {
      title: 'Test',
      platforms: [
        { type: 'longPlatform', x: 20, y: 200, group: 'platforms' },
        { type: 'mediumPlatform', x: 400, y: 380, group: 'platforms' },
        { type: 'smallPlatform', x: 700, y: 90, group: 'platforms' },
        { type: 'boostPlatform', x: 300, y: 90, group: 'boostPlatforms' },
        { type: 'frozenPlatform', x: 500, y: 200, group: 'frozenPlatforms' },
        { type: 'redBlockSprite', x: 500, y: 100, group: 'mystryBlock' },        
        { type: 'spikePlatform', x: 700, y: 400, group: 'deathPlatforms' },
        { type: 'spikePlatform', x: 1000, y: 400, group: 'deathPlatforms' },
        { type: 'spikePlatform', x: 1500, y: 100, group: 'deathPlatforms' },
        { type: 'finishPlatform', x: 1400, y: 500, group: 'finishPlatforms' },
      ],
      enemies: [
        { x: 100, y: 100, range: [400, 450] },
      ],
    }
  }

  preload() { }

  create() {
    const self = this;
    this.createPlayer();
    this.createPlatforms();
    // this.createEnemies();
    this.createControls();
    this.otherPlayers = this.physics.add.group();
    this.createColliders();

    let widthBounds = this.getLastPlatform(this.map.platforms).x + 200;
    this.physics.world.setBounds(0, 0, widthBounds, this.config.height);
    this.cameras.main.setBounds(0, 0, widthBounds, this.config.height);
    this.cameras.main.startFollow(this.sprite);

    this.socket = io(SOCKET_IO_URL);
    this.socket.on('connect', (sdf) => {
      this.me.id = this.socket.id;
      this.socket.emit('newPlayer', this.me);
    });

    this.socket.on('currentPlayers', players => {
      Object.keys(players).forEach(socketId => {
        let player = players[socketId];
        self.addNewPlayer(socketId, player);
      });
    });

    this.socket.on('newPlayer', playerInfo => {
      const { socketId, player } = playerInfo;
      this.addNewPlayer(socketId, player);
    });

    this.socket.on('updatePlayer', player => {
      if (player.id !== this.socket.id) {
        this.addNewPlayer(player.id, player)
      }
    })

    this.socket.on('deletePlayer', playerId => {
      if (this.players[playerId]) {
        this.players[playerId].sprite.destroy();
        delete this.players[playerId];
      }
    })
  }

  addNewPlayer(socketId, player) {
    if (typeof socketId === 'undefined') {
      return false;
    }

    if (socketId !== this.socket.id) {
      if (!this.players[socketId]) {
        let currentPlayer = this.otherPlayers.create(player.x, player.y, `${player.color}Player`).setScale(3).setFlipX(true);
        currentPlayer.body.gravity.y = 400;
        currentPlayer.setCollideWorldBounds(true);

        this.players[socketId] = { ...player, sprite: currentPlayer }
        this.players[socketId].particles = this.add.particles(`${player.color}Particle`);
      } else {
        this.updateUser(socketId, player);
      }
    }
  }

  updateUser(socketId, player) {
    const { sprite } = this.players[socketId]
    sprite.setPosition(player.x, player.y);
    sprite.body.velocity.x = player.velocityX
    sprite.body.velocity.y = player.velocityY

    this.flip(sprite);

    if (player.frozen && !sprite.isTinted) {
      sprite.setTint(0x00AEEF);
    } else if (!player.frozen && sprite.isTinted) {
      sprite.clearTint()
    }

    if (player.dead && sprite.visible) {
      sprite.visible = false;

      this.players[socketId].emitter = this.players[socketId].particles.createEmitter({
        x: sprite.x,
        y: sprite.y,
        speed: 100,
        scale: { start: 1, end: 0 },
      });

      this.players[socketId].emitterTimer = this.time.addEvent({
        delay: 2000,
        callback: () => {
          this.players[socketId].emitter.remove();
          this.players[socketId].emitter = null;
          this.players[socketId].emitterTimer.remove()
          this.players[socketId].emitterTimer = null;
        },
        loop: false,
        repeat: 0,
      })
    } else if (!player.dead && !sprite.visible) {
      sprite.visible = true;
    }
  }

  update() {
    this.updateControls();
    this.checkStatus();

    this.me.x = this.sprite.x;
    this.me.y = this.sprite.y;
    this.me.velocityX = this.sprite.body.velocity.x;
    this.me.velocityY = this.sprite.body.velocity.y;
    this.socket.emit('updatePlayer', this.me);
  }

  createPlayer() {
    this.sprite = this.physics.add.sprite(this.me.x, this.me.y, `${this.me.color}Player`).setScale(3).setFlipX(true);
    this.sprite.body.gravity.y = 400;
    this.sprite.setCollideWorldBounds(true);

    const key = `${this.me.color}Player`;
    this.anims.create({
      key: 'blink',
      frames: [0, 1, 2, 3, 4, 0].map(frame => ({ frame, key })),
      frameRate: 12,
      repeat: 0,
    });

    this.time.addEvent({
      delay: 5000,
      callback: () => {
        this.sprite.play('blink');
      },
      loop: true,
    });

    this.me.particles = this.add.particles(`${this.me.color}Particle`);
  }

  createPlatforms() {
    this.platforms = this.physics.add.group();
    this.frozenPlatforms = this.physics.add.group();
    this.boostPlatforms = this.physics.add.group();
    this.deathPlatforms = this.physics.add.group();
    this.mystryPlatforms = this.physics.add.group();
    this.finishPlatforms = this.physics.add.group();

    this.map.platforms.forEach(platform => {
      let group = null;
      if (platform.group === 'platforms') {
        group = this.platforms;
      } else if (platform.group === 'frozenPlatforms') {
        group = this.frozenPlatforms;
      } else if (platform.group === 'boostPlatforms') {
        group = this.boostPlatforms;
      } else if (platform.group === 'deathPlatforms') {
        group = this.deathPlatforms;
      } else if (platform.group === 'mystryBlock') {
        group = this.mystryPlatforms;
      } else if (platform.group === 'finishPlatforms') {
        group = this.finishPlatforms;
      }

      if (group) {
        group.create(platform.x, platform.y, platform.type).setOrigin(0, 0).setScale(3).setImmovable(true);
      }
    });
  }

  createEnemies() {
    this.enemies = this.physics.add.group();

    this.map.enemies.forEach(enemy => {
      const enemySprite = this.enemies.create(enemy.x, enemy.y, 'enemy').setOrigin(0, 0).setScale(3).setImmovable(true);
      enemySprite.body.gravity.y = 400;
      enemySprite.setCollideWorldBounds(true);
    })
  }

  getLastPlatform(platforms) {
    let last = platforms[0];

    platforms.forEach(platform => {
      if (platform.x > last.x) {
        last = platform
      }
    })

    return last;
  }

  createControls() {
    this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  createColliders() {
    this.physics.add.collider(this.sprite, this.platforms);

    this.physics.add.collider(this.sprite, this.frozenPlatforms, (sprite) => {
      if (!this.me.frozen && this.me.freezable) {
        sprite.setTint(0x00AEEF);  
        this.me.frozen = true;
        sprite.body.velocity.x = 0;
        this.me.freezable = false;

        if (!this.frozenTimer) {
          this.frozenTimer = this.time.addEvent({
            delay: 3000,
            callback: () => {
              this.me.frozen = false;
              sprite.clearTint();
            },
            loop: false,
            repeat: 0,
          })

          this.time.addEvent({
            delay: 5000,
            callback: () => {
              this.me.freezable = true;
              this.frozenTimer = null;
            },
            loop: false,
            repeat: 0,
          })
        }
      }
    }, null, true);

    this.physics.add.collider(this.sprite, this.boostPlatforms, (sprite) => {
      if (!this.me.boosted && this.me.boostable) {
        this.me.boosted = true;
        sprite.body.velocity.x = sprite.body.velocity.x * 2;

        if (!this.boostedTimer) {
          this.boostedTimer = this.time.addEvent({
            delay: 3000,
            callback: () => {
              this.me.boosted = false;
              this.boostedTimer = null;
            },
            loop: false,
            repeat: 0,
          })
        }
      }
    }, null, true);

    this.physics.add.collider(this.sprite, this.deathPlatforms, sprite => {
      this.die(sprite);
    }, null, this);

    this.physics.add.collider(this.sprite, this.finishPlatforms, sprite => {
      this.fireworks(sprite);
      this.me.dieable = false;
    }, null, this);

    this.physics.add.collider(this.sprite, this.mystryPlatforms, (sprite, block) => {
      this.me.powerUp = 'fireball';
      let particles = this.add.particles(`${this.me.color}Particle`);

      const emitter = particles.createEmitter({
        x: block.x + block.getBounds().width / 2,
        y: block.y+ block.getBounds().height / 2,
        speed: 100,
        scale: { start: 1, end: 0 },
      });

      block.destroy();

      this.time.addEvent({
        delay: 500,
        callback: () => {
          emitter.remove();
        },
        loop: false,
        repeat: 0,
      });
    }, null, this);

    this.physics.add.collider(this.otherPlayers, this.platforms);
    this.physics.add.collider(this.otherPlayers, this.frozenPlatforms);
    this.physics.add.collider(this.otherPlayers, this.boostPlatforms);
    this.physics.add.collider(this.otherPlayers, this.deathPlatforms);
    this.physics.add.collider(this.otherPlayers, this.finishPlatforms);

    // this.physics.add.collider(this.enemies, this.platforms);
    // this.physics.add.collider(this.enemies, this.frozenPlatforms);
    // this.physics.add.collider(this.enemies, this.boostPlatforms);
    // this.physics.add.collider(this.enemies, this.deathPlatforms);
    // this.physics.add.collider(this.enemies, this.finishPlatforms);
  }

  die(sprite) {
    if (!this.me.emitter && !this.me.dead && this.me.dieable) {
      this.me.dead = true;
      this.sprite.visible = false;
      this.me.emitter = this.me.particles.createEmitter({
        x: sprite.x,
        y: sprite.y,
        speed: 100,
        scale: { start: 1, end: 0 },
      });

      this.me.emitterTimer = this.time.addEvent({
        delay: 2000,
        callback: () => {
          this.me.emitter.remove();
          this.me.emitter = null;
          this.me.emitterTimer.remove()
          this.me.emitterTimer = null;

          this.sprite.body.velocity.x = 0;
          this.sprite.body.velocity.y = 0;
          this.sprite.setPosition(100, 100);
          this.sprite.visible = true;
          this.me.dead = false;
        },
        loop: false,
        repeat: 0,
      })
    }
  }

  fireworks(sprite) {
    if (!this.fireWorksPartical) {
      this.fireWorksPartical = this.add.particles(`fireworks`);

      const bounds = sprite.getBounds();
      const width = bounds.width;
      const height = bounds.height;

      ['red', 'blue', 'green', 'orange', 'purple', 'yellow'].forEach(color => {
        this.fireWorksPartical.createEmitter({
          frame: `${color}Particle`,
          x: sprite.x,
          y: sprite.y,
          speed: 200,
          lifespan: 1000
        });  
      });
    }
  }

  updateControls() {
    if (this.me.dead) {
      return false;
    }

    if(!this.me.onGround && this.sprite.body.deltaY() > 0 && this.sprite.body.onFloor()){
      this.me.onGround = true;
    }

    let xVelocity = 0;
    const xSpeed = this.me.boosted ? SPEED_X * 2 : SPEED_X;

    if (!this.me.frozen) {
      if (this.keyLeft.isDown) {
        xVelocity = -xSpeed;
      } else if (this.keyRight.isDown) {
        xVelocity = xSpeed;
      }

      if (this.keySpace.isDown) {
        if (this.me.onGround) {
          this.me.onGround = false;
          this.sprite.body.velocity.y = -SPEED_Y;  
        }
        
        // this.sprite.body.velocity.y = -SPEED_Y;
      }
    }

    this.sprite.body.velocity.x = xVelocity;
  }

  checkStatus() {
    this.flip(this.sprite);

    if (this.sprite.getBounds().bottom >= this.config.height) {
      this.die(this.sprite);
    }
  }

  flip(sprite) {
     if (sprite.body.velocity.x > 0 && sprite.flipX) {
      sprite.setFlipX(false);
    } else if (sprite.body.velocity.x < 0 && !sprite.flipX) {
      sprite.setFlipX(true);
    }
  }
}

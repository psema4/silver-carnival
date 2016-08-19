var outbrk = require('../outbrk/src/outbrk')
  , MessageBus = require('../outbrk/src/MessageBus')
  , Ball = require('./entities/Ball')
  , Box = require('./entities/Box')
  , Pacman = require('./entities/Pacman')
;

window.addEventListener('load', function() {
    var msgbus = new MessageBus();

    window.game = new outbrk({
        msgbus: msgbus

      , createPool: function(pool) {
            pool.ball = new Ball({ x: 0.15, msgbus: msgbus });
            pool.box = new Box({ msgbus: msgbus });
            pool.pacman = new Pacman({ msgbus: msgbus });
        }
    });
});

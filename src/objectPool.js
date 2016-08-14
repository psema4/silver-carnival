var Ball = require('./entities/Ball')
  , Box = require('./entities/Box')
  , Pacman = require('./entities/Pacman')
  , pool = {}
;

module.exports = {
    get: function(key) {
        return pool[key];
    }

  , create: function() {
        pool.ball = new Ball();
        pool.box = new Box();
        pool.pacman = new Pacman();
    }
}

var Ball = require('./entities/Ball')
  , Pacman = require('./entities/Pacman')
  , pool = {}
;

module.exports = {
    get: function(key) {
        return pool[key];
    }

  , create: function() {
        pool.ball = new Ball();
        pool.pacman = new Pacman();
    }
}

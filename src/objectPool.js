var Ball = require('./entities/Ball')
  , Box = require('./entities/Box')
  , pool = {}
;

module.exports = {
    get: function(key) {
        return pool[key];
    }

  , create: function() {
        pool.ball = new Ball();
        pool.box = new Box();
    }
}

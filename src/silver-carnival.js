var outbrk = require('../outbrk/src/outbrk')
  , objectPool = require('./objectPool')
;

window.addEventListener('load', function() {
    console.log('load');
    window.game = new outbrk({ objectPool: objectPool });
});

var outbrk = require('../outbrk/src/outbrk');

window.addEventListener('load', function() {
    console.log('load');
    window.game = new outbrk();
});

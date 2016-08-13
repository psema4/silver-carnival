var Renderable = require('../../outbrk/src/components/Renderable')
  , Moveable = require('../../outbrk/src/components/Moveable')
  , x = 1.00    // percentages
  , y = 0.00
  , SPEED = 0.002
  , WIDTH = 0.125
  , HEIGHT = 0.125
;

function Box() {
    this.isActive = true;

    this.x = x;
    this.y = y;
    this.width = WIDTH;
    this.height = HEIGHT;

    this.xSpeed = -1 * SPEED;
    this.ySpeed = SPEED;

    this.renderOpts = {
        type: 'rectangle'

      , fillStyle: {
            type: 'colour'
          , colour: 'blue'
        }
    }

    new Renderable(this);
    new Moveable(this);
}

module.exports = Box;

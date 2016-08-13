var Renderable = require('../../outbrk/src/components/Renderable')
  , Moveable = require('../../outbrk/src/components/Moveable')
  , x = 0.00    // percentages
  , y = 0.00
  , SPEED = 0.004
  , RADIUS = 0.02
;

function Ball() {
    this.isActive = true;

    this.x = x;
    this.y = y;
    this.radius = RADIUS;

    this.xSpeed = SPEED;
    this.ySpeed = SPEED;

    this.renderOpts = {
        type: 'circle'

      , fillStyle: {
            type: 'colour'
          , colour: 'red'
        }
    }

    new Renderable(this);
    new Moveable(this);
}

module.exports = Ball;

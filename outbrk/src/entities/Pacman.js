var Renderable = require('../components/Renderable')
  , Moveable = require('../components/Moveable')
  , x = 0.00    // percentages
  , y = 0.00
  , SPEED = 0.0025
  , WIDTH = 0.5
  , HEIGHT = 0.5
;

function Pacman() {
    this.isActive = true;

    this.x = x;
    this.y = y;
    this.width = WIDTH;
    this.height = HEIGHT;
    this.xSpeed = SPEED;
    this.ySpeed = SPEED;

    this.renderOpts = {
        type: 'surface'

      , fillStyle: {
            type: 'drawable'

          , draw: function(opts) {
                if (opts.context) {
                    var ctx = opts.context
                      , vp = opts.viewport
                      , x = opts.entity.x * vp.width - (opts.entity.width / 2)
                      , y = opts.entity.y * vp.height - (opts.entity.height / 2)
                    ;

                    // pacman
                    ctx.beginPath();
                    ctx.arc(x+37, y+37, 13, Math.PI/7, -Math.PI/7, false);
                    ctx.lineTo(x+31, y+37);
                    ctx.fill();
                }
            }
        }
    }

    new Renderable(this);
    new Moveable(this);
}

module.exports = Pacman;

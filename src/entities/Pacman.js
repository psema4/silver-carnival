var Renderable = require('../../outbrk/src/components/Renderable')
  , Moveable = require('../../outbrk/src/components/Moveable')
  , x = 0.00    // percentages
  , y = 0.00
  , SPEED = 0.004
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
                // modified from https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
                if (opts.context) {
                    var ctx = opts.context
                      , _fillStyle = ctx.fillStyle
                      , vp = opts.viewport
                      , x = opts.entity.x * vp.width - (opts.entity.width / 2)
                      , y = opts.entity.y * vp.height - (opts.entity.height / 2)
                    ;

                    // outer walls
                    ctx.fillStyle = 'black';
                    roundedRect(ctx, x+12, y+12, 190, 180, 15);
                    roundedRect(ctx, x+19, y+19, 175, 165, 9);

                    // inner walls
                    roundedRect(ctx, x+53, y+53, 49, 33, 10);
                    roundedRect(ctx, x+53, y+119, 49, 16, 6);
                    roundedRect(ctx, x+135, y+53, 49, 33, 10);
                    roundedRect(ctx, x+135, y+119, 25, 49, 10);

                    // pacman
                    ctx.fillStyle = 'yellow';
                    ctx.beginPath();
                    ctx.arc(x+37, y+37, 13, Math.PI/7, -Math.PI/7, false);
                    ctx.lineTo(x+31, y+37);
                    ctx.fill();

                    // row 1 dots
                    ctx.fillStyle = '#AAAAAA';
                    for (var i=0; i<8; i++) {
                        ctx.fillRect(x+51+i*16, y+34, 4, 4);
                    }

                    // col 1 dots 
                    for(i=0; i<6; i++) {
                        ctx.fillRect(x+115, y+51+i*16, 4, 4);
                    }
              
                    // row 2 dots
                    for(i=0; i<8; i++) {
                        ctx.fillRect(x+51+i*16, y+99, 4, 4);
                    }

                    // ghost body
                    ctx.fillStyle = 'red';
                    ctx.beginPath();
                    ctx.moveTo(x+83, y+116);
                    ctx.lineTo(x+83, y+102);
                    ctx.bezierCurveTo(x+83, y+94, x+89, y+88, x+97, y+88);
                    ctx.bezierCurveTo(x+105, y+88, x+111, y+94, x+111, y+102);
                    ctx.lineTo(x+111, y+116);
                    ctx.lineTo(x+106.333, y+111.333);
                    ctx.lineTo(x+101.666, y+116);
                    ctx.lineTo(x+97, y+111.333);
                    ctx.lineTo(x+92.333, y+116);
                    ctx.lineTo(x+87.666, y+111.333);
                    ctx.lineTo(x+83, y+116);
                    ctx.fill();
              
                    // ghost eyes outer
                    ctx.fillStyle = "white";
                    ctx.beginPath();
                    ctx.moveTo(x+91, y+96);
                    ctx.bezierCurveTo(x+88, y+96, x+87, y+99, x+87, y+101);
                    ctx.bezierCurveTo(x+87, y+103, x+88, y+106, x+91, y+106);
                    ctx.bezierCurveTo(x+94, y+106, x+95, y+103, x+95, y+101);
                    ctx.bezierCurveTo(x+95, y+99, x+94, y+96, x+91, y+96);
                    ctx.moveTo(x+103, y+96);
                    ctx.bezierCurveTo(x+100, y+96, x+99, y+99, x+99, y+101);
                    ctx.bezierCurveTo(x+99, y+103, x+100, y+106, x+103, y+106);
                    ctx.bezierCurveTo(x+106, y+106, x+107, y+103, x+107, y+101);
                    ctx.bezierCurveTo(x+107, y+99, x+106, y+96, x+103, y+96);
                    ctx.fill();
              
                    // ghost eyes inner
                    ctx.fillStyle = "black";
                    ctx.beginPath();
                    ctx.arc(x+101, y+102, 2, 0, Math.PI*2, true);
                    ctx.fill();
              
                    ctx.beginPath();
                    ctx.arc(x+89, y+102, 2, 0, Math.PI*2, true);
                    ctx.fill();

                    ctx.fillStyle = _fillStyle;
                }
              
                // A utility function to draw a rectangle with rounded corners.
                function roundedRect(ctx, x, y, width, height, radius) {
                    ctx.beginPath();
                    ctx.moveTo(x, y+radius);
                    ctx.lineTo(x, y+height-radius);
                    ctx.arcTo(x, y+height, x+radius, y+height, radius);
                    ctx.lineTo(x+width-radius, y+height);
                    ctx.arcTo(x+width, y+height, x+width, y+height-radius, radius);
                    ctx.lineTo(x+width, y+radius);
                    ctx.arcTo(x+width, y, x+width-radius, y, radius);
                    ctx.lineTo(x+radius, y);
                    ctx.arcTo(x, y, x, y+radius, radius);
                    ctx.stroke();
                }
            }
        }
    }

    new Renderable(this);
    new Moveable(this);
}

module.exports = Pacman;

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var moverSystem = require('../systems/moverSystem');

function Moveable(entity) {
    this.entity = entity;
    moverSystem.register(this);
}

Moveable.prototype.invoke = function() {
    var entity = this.entity;

    if (!entity.isActive) return;

    entity.x += entity.xSpeed;
    entity.y += entity.ySpeed;
}

module.exports = Moveable;

},{"../systems/moverSystem":7}],2:[function(require,module,exports){
var renderSystem = require('../systems/renderSystem');

function Renderable(entity) {
    this.entity = entity;
    renderSystem.register(this);
}

Renderable._types = {
    rectangle: function(opts) {
        opts = opts || {};

        var projectedX = opts.entity.x * opts.viewport.width
          , projectedY = opts.entity.y * opts.viewport.height
          , projectedWidth = opts.entity.width * opts.viewport.width
          , projectedHeight = opts.entity.height * opts.viewport.height
        ;

        opts.context.fillRect(projectedX, projectedY, projectedWidth, projectedHeight);
    }

  , circle: function(opts) {
        opts = opts || {};

        var projectedX = opts.entity.x * opts.viewport.width
          , projectedY = opts.entity.y * opts.viewport.height
          , projectedRadius = opts.entity.radius * opts.viewport.width
        ;

        opts.context.beginPath();
        opts.context.arc(projectedX, projectedY, projectedRadius, 0, Math.PI * 2);
        opts.context.fill();
    }

  , geometry: function(opts) {
        opts = opts || {};

        var geometry = opts.entity;

        opts.context.beginPath();

        [].forEach.call(geometry, function(point) {
            opts.context.lineTo(point.x * opts.viewport.width, point.y * opts.viewport.height);
        });

        opts.context.fill();
    }

  , surface: function() {
        /*  drawing handled in fillStyle, anything added here will be drawn overtop
            which may be useful for huds, life bars, tags, badges etc
        */
    }
};

Renderable._fillStyles = {
    colour: function(opts) {
        opts = opts || {};

        opts.context.fillStyle = opts.fillStyle.colour;
    }

  , gradient: function(opts) {
        opts = opts || {};

        var projectedX = opts.entity.x * opts.viewport.width
          , projectedY = opts.entity.y * opts.viewport.height
          , projectedHeight = opts.entity.height * opts.viewport.height
          , gradient = opts.context.createLinearGradient(projectedX, projectedY, projectedX, projectedY + projectedHeight)
        ;

        gradient.addColorStop(0, opts.fillStyle.firstStep);
        gradient.addColorStop(1, opts.fillStyle.secondStep);

        opts.context.fillStyle = gradient;
    }

  , pattern: function(opts) {
        opts = opts || {};

        var pattern = opts.context.createPattern(opts.fillStyle.source, 'repeat');

        opts.context.fillStyle = pattern;
    }

  , drawable: function(opts) {
        opts = opts || {};
        opts.fillStyle.draw(opts);
    }
};

Renderable._clearContext = function(opts) {
    opts = opts || {};

    var projectedX = entity.x * viewport.width
      , projectedY = entity.y * viewport.height
      , projectedWidth = entity.width * viewport.width
      , projectedHeight = entity.height * viewport.height
    ;

    opts.context.clearRect(projectedX, projectedY, projectedWidth, projectedHeight);
}

Renderable.prototype.invoke = function(context, viewport) {
    var entity = this.entity
      , renderOpts = entity.renderOpts
    ;

    if (!entity.isActive) return;

    Renderable._fillStyles[renderOpts.fillStyle.type]({
        entity: entity
      , fillStyle: renderOpts.fillStyle
      , context: context
      , viewport: viewport
    });

    Renderable._types[renderOpts.type]({
        entity: entity
      , context: context
      , viewport: viewport
    });
}

module.exports = Renderable;

},{"../systems/renderSystem":8}],3:[function(require,module,exports){
var Renderable = require('../components/Renderable')
  , Moveable = require('../components/Moveable')
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
          , colour: 'black'
        }
    }

    new Renderable(this);
    new Moveable(this);
}

module.exports = Ball;

},{"../components/Moveable":1,"../components/Renderable":2}],4:[function(require,module,exports){
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

},{"../components/Moveable":1,"../components/Renderable":2}],5:[function(require,module,exports){
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

},{"./entities/Ball":3,"./entities/Pacman":4}],6:[function(require,module,exports){
var outbrk = function(opts) {
    opts = opts || {};

    var objectPool = opts.objectPool || require('./objectPool')
      , renderSystem = require('./systems/renderSystem')
      , moverSystem = require('./systems/moverSystem')
      , $ = function(sel) { return document.querySelector(sel); }
      , $$ = function(sel) { return document.querySelectorAll(sel); }
      , $canvas = $('canvas')
      , ctx2d = $canvas.getContext('2d')
      , viewport = { width: $canvas.width, height: $canvas.height }
    ;

    if (renderSystem.init({ context: ctx2d, viewport: viewport })) {
        moverSystem.init();

        objectPool.create();
        window.objectPool = objectPool;

        function gameloop() {
            ctx2d.clearRect(0, 0, viewport.width, viewport.height);
            moverSystem.invoke();
            renderSystem.invoke();

            //console.log('tick');
            requestAnimationFrame(gameloop);
        }

        gameloop();

    } else {
        console.warn('outbrk: unable to initialize');
    }
};

module.exports = outbrk;

},{"./objectPool":5,"./systems/moverSystem":7,"./systems/renderSystem":8}],7:[function(require,module,exports){
module.exports = {
    init: function() {
        this.components = [];

        console.log('moverSystem initialized');
    },

    register: function(component) {
        this.components.push(component);

        console.log('moverSystem: registered component:', component);
    },

    invoke: function() {
        [].forEach.call(this.components, function(component) {
            component.invoke();
        });
    }
}

},{}],8:[function(require,module,exports){
module.exports = {
    init: function(opts) {
        if (!opts || !opts.context || !opts.viewport ) {
            console.warn('render system failed to initialize, a context & viewport are required');
            return false;
        }

        this.components = [];
        this.context = opts.context;
        this.viewport = opts.viewport; 

        console.log('renderSystem initialized, using context & viewport:', this.context, this.viewport);
        return true;
    },

    register: function(component) {
        this.components.push(component);

        console.log('renderSystem: registered component:', component);
    },

    invoke: function() {
        var context = this.context
          , viewport = this.viewport
        ;

        [].forEach.call(this.components, function(component) {
            component.invoke(context, viewport);
        });
    }
}

},{}],9:[function(require,module,exports){
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

},{"../../outbrk/src/components/Moveable":1,"../../outbrk/src/components/Renderable":2}],10:[function(require,module,exports){
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

},{"../../outbrk/src/components/Moveable":1,"../../outbrk/src/components/Renderable":2}],11:[function(require,module,exports){
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

},{"../../outbrk/src/components/Moveable":1,"../../outbrk/src/components/Renderable":2}],12:[function(require,module,exports){
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

},{"./entities/Ball":9,"./entities/Box":10,"./entities/Pacman":11}],13:[function(require,module,exports){
var outbrk = require('../outbrk/src/outbrk')
  , objectPool = require('./objectPool')
;

window.addEventListener('load', function() {
    console.log('load');
    window.game = new outbrk({ objectPool: objectPool });
});

},{"../outbrk/src/outbrk":6,"./objectPool":12}]},{},[13])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJvdXRicmsvc3JjL2NvbXBvbmVudHMvTW92ZWFibGUuanMiLCJvdXRicmsvc3JjL2NvbXBvbmVudHMvUmVuZGVyYWJsZS5qcyIsIm91dGJyay9zcmMvZW50aXRpZXMvQmFsbC5qcyIsIm91dGJyay9zcmMvZW50aXRpZXMvUGFjbWFuLmpzIiwib3V0YnJrL3NyYy9vYmplY3RQb29sLmpzIiwib3V0YnJrL3NyYy9vdXRicmsuanMiLCJvdXRicmsvc3JjL3N5c3RlbXMvbW92ZXJTeXN0ZW0uanMiLCJvdXRicmsvc3JjL3N5c3RlbXMvcmVuZGVyU3lzdGVtLmpzIiwic3JjL2VudGl0aWVzL0JhbGwuanMiLCJzcmMvZW50aXRpZXMvQm94LmpzIiwic3JjL2VudGl0aWVzL1BhY21hbi5qcyIsInNyYy9vYmplY3RQb29sLmpzIiwic3JjL3NpbHZlci1jYXJuaXZhbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIG1vdmVyU3lzdGVtID0gcmVxdWlyZSgnLi4vc3lzdGVtcy9tb3ZlclN5c3RlbScpO1xuXG5mdW5jdGlvbiBNb3ZlYWJsZShlbnRpdHkpIHtcbiAgICB0aGlzLmVudGl0eSA9IGVudGl0eTtcbiAgICBtb3ZlclN5c3RlbS5yZWdpc3Rlcih0aGlzKTtcbn1cblxuTW92ZWFibGUucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbnRpdHkgPSB0aGlzLmVudGl0eTtcblxuICAgIGlmICghZW50aXR5LmlzQWN0aXZlKSByZXR1cm47XG5cbiAgICBlbnRpdHkueCArPSBlbnRpdHkueFNwZWVkO1xuICAgIGVudGl0eS55ICs9IGVudGl0eS55U3BlZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW92ZWFibGU7XG4iLCJ2YXIgcmVuZGVyU3lzdGVtID0gcmVxdWlyZSgnLi4vc3lzdGVtcy9yZW5kZXJTeXN0ZW0nKTtcblxuZnVuY3Rpb24gUmVuZGVyYWJsZShlbnRpdHkpIHtcbiAgICB0aGlzLmVudGl0eSA9IGVudGl0eTtcbiAgICByZW5kZXJTeXN0ZW0ucmVnaXN0ZXIodGhpcyk7XG59XG5cblJlbmRlcmFibGUuX3R5cGVzID0ge1xuICAgIHJlY3RhbmdsZTogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICB2YXIgcHJvamVjdGVkWCA9IG9wdHMuZW50aXR5LnggKiBvcHRzLnZpZXdwb3J0LndpZHRoXG4gICAgICAgICAgLCBwcm9qZWN0ZWRZID0gb3B0cy5lbnRpdHkueSAqIG9wdHMudmlld3BvcnQuaGVpZ2h0XG4gICAgICAgICAgLCBwcm9qZWN0ZWRXaWR0aCA9IG9wdHMuZW50aXR5LndpZHRoICogb3B0cy52aWV3cG9ydC53aWR0aFxuICAgICAgICAgICwgcHJvamVjdGVkSGVpZ2h0ID0gb3B0cy5lbnRpdHkuaGVpZ2h0ICogb3B0cy52aWV3cG9ydC5oZWlnaHRcbiAgICAgICAgO1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5maWxsUmVjdChwcm9qZWN0ZWRYLCBwcm9qZWN0ZWRZLCBwcm9qZWN0ZWRXaWR0aCwgcHJvamVjdGVkSGVpZ2h0KTtcbiAgICB9XG5cbiAgLCBjaXJjbGU6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgdmFyIHByb2plY3RlZFggPSBvcHRzLmVudGl0eS54ICogb3B0cy52aWV3cG9ydC53aWR0aFxuICAgICAgICAgICwgcHJvamVjdGVkWSA9IG9wdHMuZW50aXR5LnkgKiBvcHRzLnZpZXdwb3J0LmhlaWdodFxuICAgICAgICAgICwgcHJvamVjdGVkUmFkaXVzID0gb3B0cy5lbnRpdHkucmFkaXVzICogb3B0cy52aWV3cG9ydC53aWR0aFxuICAgICAgICA7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICBvcHRzLmNvbnRleHQuYXJjKHByb2plY3RlZFgsIHByb2plY3RlZFksIHByb2plY3RlZFJhZGl1cywgMCwgTWF0aC5QSSAqIDIpO1xuICAgICAgICBvcHRzLmNvbnRleHQuZmlsbCgpO1xuICAgIH1cblxuICAsIGdlb21ldHJ5OiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBnZW9tZXRyeSA9IG9wdHMuZW50aXR5O1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5iZWdpblBhdGgoKTtcblxuICAgICAgICBbXS5mb3JFYWNoLmNhbGwoZ2VvbWV0cnksIGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICAgICAgICBvcHRzLmNvbnRleHQubGluZVRvKHBvaW50LnggKiBvcHRzLnZpZXdwb3J0LndpZHRoLCBwb2ludC55ICogb3B0cy52aWV3cG9ydC5oZWlnaHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBvcHRzLmNvbnRleHQuZmlsbCgpO1xuICAgIH1cblxuICAsIHN1cmZhY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvKiAgZHJhd2luZyBoYW5kbGVkIGluIGZpbGxTdHlsZSwgYW55dGhpbmcgYWRkZWQgaGVyZSB3aWxsIGJlIGRyYXduIG92ZXJ0b3BcbiAgICAgICAgICAgIHdoaWNoIG1heSBiZSB1c2VmdWwgZm9yIGh1ZHMsIGxpZmUgYmFycywgdGFncywgYmFkZ2VzIGV0Y1xuICAgICAgICAqL1xuICAgIH1cbn07XG5cblJlbmRlcmFibGUuX2ZpbGxTdHlsZXMgPSB7XG4gICAgY29sb3VyOiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5maWxsU3R5bGUgPSBvcHRzLmZpbGxTdHlsZS5jb2xvdXI7XG4gICAgfVxuXG4gICwgZ3JhZGllbnQ6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgdmFyIHByb2plY3RlZFggPSBvcHRzLmVudGl0eS54ICogb3B0cy52aWV3cG9ydC53aWR0aFxuICAgICAgICAgICwgcHJvamVjdGVkWSA9IG9wdHMuZW50aXR5LnkgKiBvcHRzLnZpZXdwb3J0LmhlaWdodFxuICAgICAgICAgICwgcHJvamVjdGVkSGVpZ2h0ID0gb3B0cy5lbnRpdHkuaGVpZ2h0ICogb3B0cy52aWV3cG9ydC5oZWlnaHRcbiAgICAgICAgICAsIGdyYWRpZW50ID0gb3B0cy5jb250ZXh0LmNyZWF0ZUxpbmVhckdyYWRpZW50KHByb2plY3RlZFgsIHByb2plY3RlZFksIHByb2plY3RlZFgsIHByb2plY3RlZFkgKyBwcm9qZWN0ZWRIZWlnaHQpXG4gICAgICAgIDtcblxuICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgb3B0cy5maWxsU3R5bGUuZmlyc3RTdGVwKTtcbiAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsIG9wdHMuZmlsbFN0eWxlLnNlY29uZFN0ZXApO1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5maWxsU3R5bGUgPSBncmFkaWVudDtcbiAgICB9XG5cbiAgLCBwYXR0ZXJuOiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBwYXR0ZXJuID0gb3B0cy5jb250ZXh0LmNyZWF0ZVBhdHRlcm4ob3B0cy5maWxsU3R5bGUuc291cmNlLCAncmVwZWF0Jyk7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmZpbGxTdHlsZSA9IHBhdHRlcm47XG4gICAgfVxuXG4gICwgZHJhd2FibGU6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgICAgIG9wdHMuZmlsbFN0eWxlLmRyYXcob3B0cyk7XG4gICAgfVxufTtcblxuUmVuZGVyYWJsZS5fY2xlYXJDb250ZXh0ID0gZnVuY3Rpb24ob3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgdmFyIHByb2plY3RlZFggPSBlbnRpdHkueCAqIHZpZXdwb3J0LndpZHRoXG4gICAgICAsIHByb2plY3RlZFkgPSBlbnRpdHkueSAqIHZpZXdwb3J0LmhlaWdodFxuICAgICAgLCBwcm9qZWN0ZWRXaWR0aCA9IGVudGl0eS53aWR0aCAqIHZpZXdwb3J0LndpZHRoXG4gICAgICAsIHByb2plY3RlZEhlaWdodCA9IGVudGl0eS5oZWlnaHQgKiB2aWV3cG9ydC5oZWlnaHRcbiAgICA7XG5cbiAgICBvcHRzLmNvbnRleHQuY2xlYXJSZWN0KHByb2plY3RlZFgsIHByb2plY3RlZFksIHByb2plY3RlZFdpZHRoLCBwcm9qZWN0ZWRIZWlnaHQpO1xufVxuXG5SZW5kZXJhYmxlLnByb3RvdHlwZS5pbnZva2UgPSBmdW5jdGlvbihjb250ZXh0LCB2aWV3cG9ydCkge1xuICAgIHZhciBlbnRpdHkgPSB0aGlzLmVudGl0eVxuICAgICAgLCByZW5kZXJPcHRzID0gZW50aXR5LnJlbmRlck9wdHNcbiAgICA7XG5cbiAgICBpZiAoIWVudGl0eS5pc0FjdGl2ZSkgcmV0dXJuO1xuXG4gICAgUmVuZGVyYWJsZS5fZmlsbFN0eWxlc1tyZW5kZXJPcHRzLmZpbGxTdHlsZS50eXBlXSh7XG4gICAgICAgIGVudGl0eTogZW50aXR5XG4gICAgICAsIGZpbGxTdHlsZTogcmVuZGVyT3B0cy5maWxsU3R5bGVcbiAgICAgICwgY29udGV4dDogY29udGV4dFxuICAgICAgLCB2aWV3cG9ydDogdmlld3BvcnRcbiAgICB9KTtcblxuICAgIFJlbmRlcmFibGUuX3R5cGVzW3JlbmRlck9wdHMudHlwZV0oe1xuICAgICAgICBlbnRpdHk6IGVudGl0eVxuICAgICAgLCBjb250ZXh0OiBjb250ZXh0XG4gICAgICAsIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmFibGU7XG4iLCJ2YXIgUmVuZGVyYWJsZSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvUmVuZGVyYWJsZScpXG4gICwgTW92ZWFibGUgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL01vdmVhYmxlJylcbiAgLCB4ID0gMC4wMCAgICAvLyBwZXJjZW50YWdlc1xuICAsIHkgPSAwLjAwXG4gICwgU1BFRUQgPSAwLjAwNFxuICAsIFJBRElVUyA9IDAuMDJcbjtcblxuZnVuY3Rpb24gQmFsbCgpIHtcbiAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnJhZGl1cyA9IFJBRElVUztcblxuICAgIHRoaXMueFNwZWVkID0gU1BFRUQ7XG4gICAgdGhpcy55U3BlZWQgPSBTUEVFRDtcblxuICAgIHRoaXMucmVuZGVyT3B0cyA9IHtcbiAgICAgICAgdHlwZTogJ2NpcmNsZSdcblxuICAgICAgLCBmaWxsU3R5bGU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdjb2xvdXInXG4gICAgICAgICAgLCBjb2xvdXI6ICdibGFjaydcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ldyBSZW5kZXJhYmxlKHRoaXMpO1xuICAgIG5ldyBNb3ZlYWJsZSh0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCYWxsO1xuIiwidmFyIFJlbmRlcmFibGUgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL1JlbmRlcmFibGUnKVxuICAsIE1vdmVhYmxlID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9Nb3ZlYWJsZScpXG4gICwgeCA9IDAuMDAgICAgLy8gcGVyY2VudGFnZXNcbiAgLCB5ID0gMC4wMFxuICAsIFNQRUVEID0gMC4wMDI1XG4gICwgV0lEVEggPSAwLjVcbiAgLCBIRUlHSFQgPSAwLjVcbjtcblxuZnVuY3Rpb24gUGFjbWFuKCkge1xuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMud2lkdGggPSBXSURUSDtcbiAgICB0aGlzLmhlaWdodCA9IEhFSUdIVDtcbiAgICB0aGlzLnhTcGVlZCA9IFNQRUVEO1xuICAgIHRoaXMueVNwZWVkID0gU1BFRUQ7XG5cbiAgICB0aGlzLnJlbmRlck9wdHMgPSB7XG4gICAgICAgIHR5cGU6ICdzdXJmYWNlJ1xuXG4gICAgICAsIGZpbGxTdHlsZToge1xuICAgICAgICAgICAgdHlwZTogJ2RyYXdhYmxlJ1xuXG4gICAgICAgICAgLCBkcmF3OiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdHMuY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gb3B0cy5jb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgLCB2cCA9IG9wdHMudmlld3BvcnRcbiAgICAgICAgICAgICAgICAgICAgICAsIHggPSBvcHRzLmVudGl0eS54ICogdnAud2lkdGggLSAob3B0cy5lbnRpdHkud2lkdGggLyAyKVxuICAgICAgICAgICAgICAgICAgICAgICwgeSA9IG9wdHMuZW50aXR5LnkgKiB2cC5oZWlnaHQgLSAob3B0cy5lbnRpdHkuaGVpZ2h0IC8gMilcbiAgICAgICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHBhY21hblxuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmMoeCszNywgeSszNywgMTMsIE1hdGguUEkvNywgLU1hdGguUEkvNywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgrMzEsIHkrMzcpO1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ldyBSZW5kZXJhYmxlKHRoaXMpO1xuICAgIG5ldyBNb3ZlYWJsZSh0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYWNtYW47XG4iLCJ2YXIgQmFsbCA9IHJlcXVpcmUoJy4vZW50aXRpZXMvQmFsbCcpXG4gICwgUGFjbWFuID0gcmVxdWlyZSgnLi9lbnRpdGllcy9QYWNtYW4nKVxuICAsIHBvb2wgPSB7fVxuO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gcG9vbFtrZXldO1xuICAgIH1cblxuICAsIGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHBvb2wuYmFsbCA9IG5ldyBCYWxsKCk7XG4gICAgICAgIHBvb2wucGFjbWFuID0gbmV3IFBhY21hbigpO1xuICAgIH1cbn1cbiIsInZhciBvdXRicmsgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICB2YXIgb2JqZWN0UG9vbCA9IG9wdHMub2JqZWN0UG9vbCB8fCByZXF1aXJlKCcuL29iamVjdFBvb2wnKVxuICAgICAgLCByZW5kZXJTeXN0ZW0gPSByZXF1aXJlKCcuL3N5c3RlbXMvcmVuZGVyU3lzdGVtJylcbiAgICAgICwgbW92ZXJTeXN0ZW0gPSByZXF1aXJlKCcuL3N5c3RlbXMvbW92ZXJTeXN0ZW0nKVxuICAgICAgLCAkID0gZnVuY3Rpb24oc2VsKSB7IHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbCk7IH1cbiAgICAgICwgJCQgPSBmdW5jdGlvbihzZWwpIHsgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsKTsgfVxuICAgICAgLCAkY2FudmFzID0gJCgnY2FudmFzJylcbiAgICAgICwgY3R4MmQgPSAkY2FudmFzLmdldENvbnRleHQoJzJkJylcbiAgICAgICwgdmlld3BvcnQgPSB7IHdpZHRoOiAkY2FudmFzLndpZHRoLCBoZWlnaHQ6ICRjYW52YXMuaGVpZ2h0IH1cbiAgICA7XG5cbiAgICBpZiAocmVuZGVyU3lzdGVtLmluaXQoeyBjb250ZXh0OiBjdHgyZCwgdmlld3BvcnQ6IHZpZXdwb3J0IH0pKSB7XG4gICAgICAgIG1vdmVyU3lzdGVtLmluaXQoKTtcblxuICAgICAgICBvYmplY3RQb29sLmNyZWF0ZSgpO1xuICAgICAgICB3aW5kb3cub2JqZWN0UG9vbCA9IG9iamVjdFBvb2w7XG5cbiAgICAgICAgZnVuY3Rpb24gZ2FtZWxvb3AoKSB7XG4gICAgICAgICAgICBjdHgyZC5jbGVhclJlY3QoMCwgMCwgdmlld3BvcnQud2lkdGgsIHZpZXdwb3J0LmhlaWdodCk7XG4gICAgICAgICAgICBtb3ZlclN5c3RlbS5pbnZva2UoKTtcbiAgICAgICAgICAgIHJlbmRlclN5c3RlbS5pbnZva2UoKTtcblxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygndGljaycpO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGdhbWVsb29wKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdhbWVsb29wKCk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oJ291dGJyazogdW5hYmxlIHRvIGluaXRpYWxpemUnKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG91dGJyaztcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcblxuICAgICAgICBjb25zb2xlLmxvZygnbW92ZXJTeXN0ZW0gaW5pdGlhbGl6ZWQnKTtcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKGNvbXBvbmVudCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCdtb3ZlclN5c3RlbTogcmVnaXN0ZXJlZCBjb21wb25lbnQ6JywgY29tcG9uZW50KTtcbiAgICB9LFxuXG4gICAgaW52b2tlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKHRoaXMuY29tcG9uZW50cywgZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjb21wb25lbnQuaW52b2tlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgaWYgKCFvcHRzIHx8ICFvcHRzLmNvbnRleHQgfHwgIW9wdHMudmlld3BvcnQgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3JlbmRlciBzeXN0ZW0gZmFpbGVkIHRvIGluaXRpYWxpemUsIGEgY29udGV4dCAmIHZpZXdwb3J0IGFyZSByZXF1aXJlZCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG4gICAgICAgIHRoaXMuY29udGV4dCA9IG9wdHMuY29udGV4dDtcbiAgICAgICAgdGhpcy52aWV3cG9ydCA9IG9wdHMudmlld3BvcnQ7IFxuXG4gICAgICAgIGNvbnNvbGUubG9nKCdyZW5kZXJTeXN0ZW0gaW5pdGlhbGl6ZWQsIHVzaW5nIGNvbnRleHQgJiB2aWV3cG9ydDonLCB0aGlzLmNvbnRleHQsIHRoaXMudmlld3BvcnQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKGNvbXBvbmVudCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCdyZW5kZXJTeXN0ZW06IHJlZ2lzdGVyZWQgY29tcG9uZW50OicsIGNvbXBvbmVudCk7XG4gICAgfSxcblxuICAgIGludm9rZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0XG4gICAgICAgICAgLCB2aWV3cG9ydCA9IHRoaXMudmlld3BvcnRcbiAgICAgICAgO1xuXG4gICAgICAgIFtdLmZvckVhY2guY2FsbCh0aGlzLmNvbXBvbmVudHMsIGZ1bmN0aW9uKGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY29tcG9uZW50Lmludm9rZShjb250ZXh0LCB2aWV3cG9ydCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsInZhciBSZW5kZXJhYmxlID0gcmVxdWlyZSgnLi4vLi4vb3V0YnJrL3NyYy9jb21wb25lbnRzL1JlbmRlcmFibGUnKVxuICAsIE1vdmVhYmxlID0gcmVxdWlyZSgnLi4vLi4vb3V0YnJrL3NyYy9jb21wb25lbnRzL01vdmVhYmxlJylcbiAgLCB4ID0gMC4wMCAgICAvLyBwZXJjZW50YWdlc1xuICAsIHkgPSAwLjAwXG4gICwgU1BFRUQgPSAwLjAwNFxuICAsIFJBRElVUyA9IDAuMDJcbjtcblxuZnVuY3Rpb24gQmFsbCgpIHtcbiAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnJhZGl1cyA9IFJBRElVUztcblxuICAgIHRoaXMueFNwZWVkID0gU1BFRUQ7XG4gICAgdGhpcy55U3BlZWQgPSBTUEVFRDtcblxuICAgIHRoaXMucmVuZGVyT3B0cyA9IHtcbiAgICAgICAgdHlwZTogJ2NpcmNsZSdcblxuICAgICAgLCBmaWxsU3R5bGU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdjb2xvdXInXG4gICAgICAgICAgLCBjb2xvdXI6ICdyZWQnXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXcgUmVuZGVyYWJsZSh0aGlzKTtcbiAgICBuZXcgTW92ZWFibGUodGhpcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQmFsbDtcbiIsInZhciBSZW5kZXJhYmxlID0gcmVxdWlyZSgnLi4vLi4vb3V0YnJrL3NyYy9jb21wb25lbnRzL1JlbmRlcmFibGUnKVxuICAsIE1vdmVhYmxlID0gcmVxdWlyZSgnLi4vLi4vb3V0YnJrL3NyYy9jb21wb25lbnRzL01vdmVhYmxlJylcbiAgLCB4ID0gMS4wMCAgICAvLyBwZXJjZW50YWdlc1xuICAsIHkgPSAwLjAwXG4gICwgU1BFRUQgPSAwLjAwMlxuICAsIFdJRFRIID0gMC4xMjVcbiAgLCBIRUlHSFQgPSAwLjEyNVxuO1xuXG5mdW5jdGlvbiBCb3goKSB7XG4gICAgdGhpcy5pc0FjdGl2ZSA9IHRydWU7XG5cbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy53aWR0aCA9IFdJRFRIO1xuICAgIHRoaXMuaGVpZ2h0ID0gSEVJR0hUO1xuXG4gICAgdGhpcy54U3BlZWQgPSAtMSAqIFNQRUVEO1xuICAgIHRoaXMueVNwZWVkID0gU1BFRUQ7XG5cbiAgICB0aGlzLnJlbmRlck9wdHMgPSB7XG4gICAgICAgIHR5cGU6ICdyZWN0YW5nbGUnXG5cbiAgICAgICwgZmlsbFN0eWxlOiB7XG4gICAgICAgICAgICB0eXBlOiAnY29sb3VyJ1xuICAgICAgICAgICwgY29sb3VyOiAnYmx1ZSdcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ldyBSZW5kZXJhYmxlKHRoaXMpO1xuICAgIG5ldyBNb3ZlYWJsZSh0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCb3g7XG4iLCJ2YXIgUmVuZGVyYWJsZSA9IHJlcXVpcmUoJy4uLy4uL291dGJyay9zcmMvY29tcG9uZW50cy9SZW5kZXJhYmxlJylcbiAgLCBNb3ZlYWJsZSA9IHJlcXVpcmUoJy4uLy4uL291dGJyay9zcmMvY29tcG9uZW50cy9Nb3ZlYWJsZScpXG4gICwgeCA9IDAuMDAgICAgLy8gcGVyY2VudGFnZXNcbiAgLCB5ID0gMC4wMFxuICAsIFNQRUVEID0gMC4wMDRcbiAgLCBXSURUSCA9IDAuNVxuICAsIEhFSUdIVCA9IDAuNVxuO1xuXG5mdW5jdGlvbiBQYWNtYW4oKSB7XG4gICAgdGhpcy5pc0FjdGl2ZSA9IHRydWU7XG5cbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy53aWR0aCA9IFdJRFRIO1xuICAgIHRoaXMuaGVpZ2h0ID0gSEVJR0hUO1xuICAgIHRoaXMueFNwZWVkID0gU1BFRUQ7XG4gICAgdGhpcy55U3BlZWQgPSBTUEVFRDtcblxuICAgIHRoaXMucmVuZGVyT3B0cyA9IHtcbiAgICAgICAgdHlwZTogJ3N1cmZhY2UnXG5cbiAgICAgICwgZmlsbFN0eWxlOiB7XG4gICAgICAgICAgICB0eXBlOiAnZHJhd2FibGUnXG5cbiAgICAgICAgICAsIGRyYXc6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgICAgICAgICAvLyBtb2RpZmllZCBmcm9tIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNfQVBJL1R1dG9yaWFsL0RyYXdpbmdfc2hhcGVzXG4gICAgICAgICAgICAgICAgaWYgKG9wdHMuY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gb3B0cy5jb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgLCBfZmlsbFN0eWxlID0gY3R4LmZpbGxTdHlsZVxuICAgICAgICAgICAgICAgICAgICAgICwgdnAgPSBvcHRzLnZpZXdwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgLCB4ID0gb3B0cy5lbnRpdHkueCAqIHZwLndpZHRoIC0gKG9wdHMuZW50aXR5LndpZHRoIC8gMilcbiAgICAgICAgICAgICAgICAgICAgICAsIHkgPSBvcHRzLmVudGl0eS55ICogdnAuaGVpZ2h0IC0gKG9wdHMuZW50aXR5LmhlaWdodCAvIDIpXG4gICAgICAgICAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBvdXRlciB3YWxsc1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJ2JsYWNrJztcbiAgICAgICAgICAgICAgICAgICAgcm91bmRlZFJlY3QoY3R4LCB4KzEyLCB5KzEyLCAxOTAsIDE4MCwgMTUpO1xuICAgICAgICAgICAgICAgICAgICByb3VuZGVkUmVjdChjdHgsIHgrMTksIHkrMTksIDE3NSwgMTY1LCA5KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBpbm5lciB3YWxsc1xuICAgICAgICAgICAgICAgICAgICByb3VuZGVkUmVjdChjdHgsIHgrNTMsIHkrNTMsIDQ5LCAzMywgMTApO1xuICAgICAgICAgICAgICAgICAgICByb3VuZGVkUmVjdChjdHgsIHgrNTMsIHkrMTE5LCA0OSwgMTYsIDYpO1xuICAgICAgICAgICAgICAgICAgICByb3VuZGVkUmVjdChjdHgsIHgrMTM1LCB5KzUzLCA0OSwgMzMsIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgcm91bmRlZFJlY3QoY3R4LCB4KzEzNSwgeSsxMTksIDI1LCA0OSwgMTApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHBhY21hblxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJ3llbGxvdyc7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyh4KzM3LCB5KzM3LCAxMywgTWF0aC5QSS83LCAtTWF0aC5QSS83LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCszMSwgeSszNyk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gcm93IDEgZG90c1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJyNBQUFBQUEnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8ODsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoeCs1MStpKjE2LCB5KzM0LCA0LCA0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbCAxIGRvdHMgXG4gICAgICAgICAgICAgICAgICAgIGZvcihpPTA7IGk8NjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoeCsxMTUsIHkrNTEraSoxNiwgNCwgNCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIHJvdyAyIGRvdHNcbiAgICAgICAgICAgICAgICAgICAgZm9yKGk9MDsgaTw4OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh4KzUxK2kqMTYsIHkrOTksIDQsIDQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZ2hvc3QgYm9keVxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJ3JlZCc7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh4KzgzLCB5KzExNik7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCs4MywgeSsxMDIpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh4KzgzLCB5Kzk0LCB4Kzg5LCB5Kzg4LCB4Kzk3LCB5Kzg4KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oeCsxMDUsIHkrODgsIHgrMTExLCB5Kzk0LCB4KzExMSwgeSsxMDIpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgrMTExLCB5KzExNik7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCsxMDYuMzMzLCB5KzExMS4zMzMpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgrMTAxLjY2NiwgeSsxMTYpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgrOTcsIHkrMTExLjMzMyk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCs5Mi4zMzMsIHkrMTE2KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4Kzg3LjY2NiwgeSsxMTEuMzMzKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4KzgzLCB5KzExNik7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBnaG9zdCBleWVzIG91dGVyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIndoaXRlXCI7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh4KzkxLCB5Kzk2KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oeCs4OCwgeSs5NiwgeCs4NywgeSs5OSwgeCs4NywgeSsxMDEpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh4Kzg3LCB5KzEwMywgeCs4OCwgeSsxMDYsIHgrOTEsIHkrMTA2KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oeCs5NCwgeSsxMDYsIHgrOTUsIHkrMTAzLCB4Kzk1LCB5KzEwMSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHgrOTUsIHkrOTksIHgrOTQsIHkrOTYsIHgrOTEsIHkrOTYpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHgrMTAzLCB5Kzk2KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oeCsxMDAsIHkrOTYsIHgrOTksIHkrOTksIHgrOTksIHkrMTAxKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oeCs5OSwgeSsxMDMsIHgrMTAwLCB5KzEwNiwgeCsxMDMsIHkrMTA2KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oeCsxMDYsIHkrMTA2LCB4KzEwNywgeSsxMDMsIHgrMTA3LCB5KzEwMSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHgrMTA3LCB5Kzk5LCB4KzEwNiwgeSs5NiwgeCsxMDMsIHkrOTYpO1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2hvc3QgZXllcyBpbm5lclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmMoeCsxMDEsIHkrMTAyLCAyLCAwLCBNYXRoLlBJKjIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKHgrODksIHkrMTAyLCAyLCAwLCBNYXRoLlBJKjIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBfZmlsbFN0eWxlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gQSB1dGlsaXR5IGZ1bmN0aW9uIHRvIGRyYXcgYSByZWN0YW5nbGUgd2l0aCByb3VuZGVkIGNvcm5lcnMuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcm91bmRlZFJlY3QoY3R4LCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCByYWRpdXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHgsIHkrcmFkaXVzKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4LCB5K2hlaWdodC1yYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYXJjVG8oeCwgeStoZWlnaHQsIHgrcmFkaXVzLCB5K2hlaWdodCwgcmFkaXVzKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4K3dpZHRoLXJhZGl1cywgeStoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYXJjVG8oeCt3aWR0aCwgeStoZWlnaHQsIHgrd2lkdGgsIHkraGVpZ2h0LXJhZGl1cywgcmFkaXVzKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4K3dpZHRoLCB5K3JhZGl1cyk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmNUbyh4K3dpZHRoLCB5LCB4K3dpZHRoLXJhZGl1cywgeSwgcmFkaXVzKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4K3JhZGl1cywgeSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmNUbyh4LCB5LCB4LCB5K3JhZGl1cywgcmFkaXVzKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ldyBSZW5kZXJhYmxlKHRoaXMpO1xuICAgIG5ldyBNb3ZlYWJsZSh0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYWNtYW47XG4iLCJ2YXIgQmFsbCA9IHJlcXVpcmUoJy4vZW50aXRpZXMvQmFsbCcpXG4gICwgQm94ID0gcmVxdWlyZSgnLi9lbnRpdGllcy9Cb3gnKVxuICAsIFBhY21hbiA9IHJlcXVpcmUoJy4vZW50aXRpZXMvUGFjbWFuJylcbiAgLCBwb29sID0ge31cbjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHBvb2xba2V5XTtcbiAgICB9XG5cbiAgLCBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBwb29sLmJhbGwgPSBuZXcgQmFsbCgpO1xuICAgICAgICBwb29sLmJveCA9IG5ldyBCb3goKTtcbiAgICAgICAgcG9vbC5wYWNtYW4gPSBuZXcgUGFjbWFuKCk7XG4gICAgfVxufVxuIiwidmFyIG91dGJyayA9IHJlcXVpcmUoJy4uL291dGJyay9zcmMvb3V0YnJrJylcbiAgLCBvYmplY3RQb29sID0gcmVxdWlyZSgnLi9vYmplY3RQb29sJylcbjtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnbG9hZCcpO1xuICAgIHdpbmRvdy5nYW1lID0gbmV3IG91dGJyayh7IG9iamVjdFBvb2w6IG9iamVjdFBvb2wgfSk7XG59KTtcbiJdfQ==

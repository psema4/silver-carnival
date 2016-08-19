(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function MessageBus() {
    var handlers = {};

    function subscribe(eventName, cb) {
        if (! handlers.hasOwnProperty(eventName)) {
            handlers[eventName] = [];
        }

        handlers[eventName].push(cb);
    }

    function unsubscribe(eventName, cb) {
        //FIXME: stub
    }

    function publish(eventName, opts) {
        var callbacks = handlers[eventName];
        if (callbacks) {
            [].forEach.call(callbacks, function(callback) {
                callback(opts);
            });
        }
    }

    return {
        subscribe: subscribe
//      , unsubscribe: unsubscribe
      , publish: publish
    }
}

module.exports = MessageBus;

},{}],2:[function(require,module,exports){
var collisionSystem = require('../systems/collisionSystem');

function Collideable(entity) {
	this.entity = entity;
	collisionSystem.register(this);
}

Collideable._actions = {
	deflect: function (opts) {
        opts = opts || {};

        var other = opts.other
          , entity = opts.entity
          , speedProp = opts.speedProp
        ;

        other[speedProp] *= -1;
	},

	deactivate: function(opts) {
        opts = opts || {};

        var other = opts.other
          , entity = opts.entity
          , speedProp = opts.speedProp
        ;

		entity.isActive = false;
		//this.deflect({ other: other, entity: entity, speedProp: speedProp });
	}
};

Collideable._getClosestPoint = function getPoint(opts) {
    opts = opts || {};

    var point = opts.point
      , minimum = opts.minimum
      , maximum = opts.maximum
    ;

	return Math.max(minimum, Math.min(maximum, point));
};

Collideable._getBoundingBox = function(entity) {
    function xProjection(x) {
        return x * 640; // FIXME: viewport width
    }

    function yProjection(y) {
        return y * 480; // FIXME: viewport height
    }

    var boundingBox = {
            x: xProjection(entity.x) - xProjection(entity.width)/2
          , y: yProjection(entity.y) - yProjection(entity.height)/2
          , w: xProjection(entity.width)
          , h: yProjection(entity.height)
        }
    ;

    return boundingBox;
};

Collideable.prototype.invoke = function(other) {
	var entity = this.entity
	  , isActive = entity.isActive
      , collisionOptions = entity.collisionOpts
	  , action = collisionOptions.action
      , speedProp = collisionOptions.speedProp
      , hasIntersect = false
    ;

	if (!isActive || ! (other && other.name) || other.name === entity.name) return;

    switch (collisionOptions.type) {
        case 'circle':
            var closestX = Collideable._getClosestPoint({
                    point: other.x + (other.width/2 * 640) // FIXME: viewport width
                  , minimum: entity.x
                  , maximum: entity.x + entity.radius/2
                })

              , closestY = Collideable._getClosestPoint({
                    point: other.y + (other.height/2 * 480) // FIXME: viewport height
                  , minimum: entity.y
                  , maximum: entity.y + entity.radius/2
                })

    	      , distanceX = other.x - closestX
	          , distanceY = other.y - closestY
        	  , distanceSquared = distanceX * distanceX + distanceY * distanceY
            ;

        	hasIntersect = distanceSquared < entity.radius * entity.radius
            break;

        case 'box':
        default:
            var boxEntity = Collideable._getBoundingBox(entity)
              , boxOther = Collideable._getBoundingBox(other)
            ;

            hasIntersect = (
                boxEntity.x < boxOther.x + boxOther.w  &&
                boxEntity.x + boxEntity.w > boxOther.x &&
                boxEntity.y < boxOther.y + boxOther.h  &&
                boxEntity.y + boxEntity.h > boxOther.y
            );
    }

	if (hasIntersect) {
        Collideable._actions[action]({ other: other, entity: entity, speedProp: speedProp });
        entity.msgbus.publish('collision', { entity: entity, other: other });
    }
};

module.exports = Collideable;

},{"../systems/collisionSystem":10}],3:[function(require,module,exports){
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

},{"../systems/moverSystem":11}],4:[function(require,module,exports){
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
          , _fillStyle = opts.context.fillStyle
        ;

        opts.context.fillStyle = _fillStyle;
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

},{"../systems/renderSystem":12}],5:[function(require,module,exports){
var Renderable = require('../components/Renderable')
  , Moveable = require('../components/Moveable')
  , Collideable = require('../components/Collideable')
  , x = 0.00    // percentages
  , y = 0.00
  , SPEED = 0.004
  , RADIUS = 0.01
;

function Ball(opts) {
    opts = opts || {};

    this.name = opts.name || 'Ball';
    this.isActive = true;
    this.msgbus = opts.msgbus;

    this.x = opts.x || x;
    this.y = opts.y || y;
    this.radius = opts.radius || RADIUS;

    //FIXME: make collision bounds more clear
    this.width = opts.width || 0.02;
    this.height = opts.height || 0.02;

    this.xSpeed = opts.xSpeed || SPEED;
    this.ySpeed = opts.ySpeed || SPEED;

    this.renderOpts = opts.renderOpts || {
        type: 'circle'

      , fillStyle: {
            type: 'colour'
          , colour: 'red'
        }
    };

    this.collisionOpts = opts.collisionOpts || {
        type: 'box'
      , action: 'deflect'
      , speedProp: 'ySpeed'
    }

    new Renderable(this);
    new Moveable(this);
    new Collideable(this);
}

module.exports = Ball;

},{"../components/Collideable":2,"../components/Moveable":3,"../components/Renderable":4}],6:[function(require,module,exports){
var Renderable = require('../components/Renderable')
  , Moveable = require('../components/Moveable')
  , Collideable = require('../components/Collideable')
  , x = 0.10    // percentages
  , y = 0.10
  , SPEED = 0.0025
  , WIDTH = 0.035
  , HEIGHT = 0.05
;

function Pacman(opts) {
    opts = opts || {};

    this.name = opts.name || 'Pacman';
    this.isActive = true;
    this.msgbus = opts.msgbus;

    this.x = opts.x || x;
    this.y = opts.y || y;
    this.width = opts.width || WIDTH;
    this.height = opts.height || HEIGHT;
    this.xSpeed = opts.xSpeed || SPEED;
    this.ySpeed = opts.ySpeed || SPEED;

    this.renderOpts = opts.renderOpts || {
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

                    ctx.fillStyle='#FFDF00';

                    // pacman
                    ctx.beginPath();
                    ctx.arc(x+(10), y+(10), 13, Math.PI/7, -Math.PI/7, false);
                    ctx.lineTo(x+(5), y+(10));
                    ctx.fill();
                }
            }
        }
    }

    this.collisionOpts = opts.collisionOpts || {
        type: 'box'
      , action: 'deflect'
      , speedProp: 'ySpeed'
    }

    new Renderable(this);
    new Moveable(this);
    new Collideable(this);
}

module.exports = Pacman;

},{"../components/Collideable":2,"../components/Moveable":3,"../components/Renderable":4}],7:[function(require,module,exports){
var Renderable = require('../components/Renderable')
  , Moveable = require('../components/Moveable')
  , Collideable = require('../components/Collideable')
  , x = 1.10    // percentages
  , y = 1.00
  , SPEED = -0.004
  , RADIUS = 0.02
;

function Player(opts) {
    opts = opts || {};

    this.name = opts.name || 'Player';
    this.isActive = true;
    this.msgbus = opts.msgbus;

    this.x = opts.x || x;
    this.y = opts.y || y;
    this.radius = opts.radius || RADIUS;

    //FIXME: make collision bounds more clear
    this.width = opts.width || 0.04;
    this.height = opts.height || 0.04;

    this.xSpeed = opts.xSpeed || SPEED;
    this.ySpeed = opts.ySpeed || SPEED;

    this.renderOpts = opts.renderOpts || {
        type: 'circle'

      , fillStyle: {
            type: 'colour'
          , colour: 'blue'
        }
    };

    this.collisionOpts = opts.collisionOpts || {
        type: 'box'
      , action: 'deflect'
      , speedProp: 'ySpeed'
    }


    new Renderable(this);
    new Moveable(this);
    new Collideable(this);
}

module.exports = Player;

},{"../components/Collideable":2,"../components/Moveable":3,"../components/Renderable":4}],8:[function(require,module,exports){
var Ball = require('./entities/Ball')
  , Player = require('./entities/Player')
  , Pacman = require('./entities/Pacman')
  , pool = {}
;

function ObjectPool(opts) {
    opts = opts || {};

    this.msgbus = opts.msgbus;
}

ObjectPool.prototype.get = function(key) {
    return pool[key];
};

ObjectPool.prototype.set = function(key, obj) {
    pool[key] = obj;
}

ObjectPool.prototype.getPool = function() {
    return pool;
};

ObjectPool.prototype.create = function(fn) {
    if (fn && typeof fn === 'function') {
        fn(pool);
    }
}

module.exports = ObjectPool;

},{"./entities/Ball":5,"./entities/Pacman":6,"./entities/Player":7}],9:[function(require,module,exports){
var outbrk = function(opts) {
        opts = opts || {};

            // core
        var ObjectPool = require('./objectPool')
          , MessageBus = require('./MessageBus')

            // systems
          , renderSystem = require('./systems/renderSystem')
          , moverSystem = require('./systems/moverSystem')
          , collisionSystem = require('./systems/collisionSystem')

            // entities/prefabs
          , Ball = require('./entities/Ball')
          , Player = require('./entities/Player')
          , Pacman = require('./entities/Pacman')

            // configurables
          , msgbus = opts.msgbus || new MessageBus()
          , objectPool = opts.objectPool || new ObjectPool()

          , createPool = opts.createPool || function(pool) {
                pool.ball = new Ball({ x: 0.15, msgbus: msgbus });
                pool.player = new Player({ msgbus: msgbus });
                pool.pacman = new Pacman({ msgbus: msgbus });
            }

            // rendering setup
          , $ = function(sel) { return document.querySelector(sel); }
          , $$ = function(sel) { return document.querySelectorAll(sel); }
          , $canvas = $('canvas')
          , ctx2d = $canvas.getContext('2d')
          , viewport = { width: $canvas.width, height: $canvas.height }
        ;

        // setup engine interface
        this.msgbus = msgbus;
        this.viewport = viewport;
        this.objectPool = objectPool;
        this.prefabs = {
            Ball: Ball
          , Player: Player
          , Pacman: Pacman
        };

        // init and run
        if (renderSystem.init({ msgbus: msgbus, context: ctx2d, viewport: viewport })) {
            moverSystem.init({ msgbus: msgbus });
            collisionSystem.init({ msgbus: msgbus });

            objectPool.create(createPool);

            collisionSystem.setPlayer(objectPool.get('player'));

            msgbus.publish('gameStart');

            function gameloop() {
                var pool = objectPool.getPool();

                ctx2d.clearRect(0, 0, viewport.width, viewport.height);
                moverSystem.invoke();

                collisionSystem.invoke(pool);
                renderSystem.invoke();

                requestAnimationFrame(gameloop);
            }

            gameloop();

        } else {
            console.warn('outbrk: unable to initialize');
        }
    }
;

module.exports = outbrk;

},{"./MessageBus":1,"./entities/Ball":5,"./entities/Pacman":6,"./entities/Player":7,"./objectPool":8,"./systems/collisionSystem":10,"./systems/moverSystem":11,"./systems/renderSystem":12}],10:[function(require,module,exports){
module.exports = {
    init: function(opts) {
        opts = opts || {};
        this.components = [];
        this.msgbus = opts.msgbus;
    }

  , register: function(component) {
        this.components.push(component);
        this.msgbus.publish('componentRegistered', { system: 'collisionSystem', component: component });
    }

  , setPlayer: function(entity) {
        this.player = entity;
    }

  , invoke: function(pool) {
        var player = this.player
          , objects = Object.keys(pool)
        ;

        [].forEach.call(this.components, function(component) {
            [].forEach.call(objects, function(object) {
                component.invoke(pool[object]);
            });
        });
    }
}

},{}],11:[function(require,module,exports){
module.exports = {
    init: function(opts) {
        opts = opts || {};
        this.components = [];
        this.msgbus = opts.msgbus;
    },

    register: function(component) {
        this.components.push(component);
        this.msgbus.publish('componentRegistered', { system: 'moverSystem', component: component });
    },

    invoke: function() {
        [].forEach.call(this.components, function(component) {
            component.invoke();
        });
    }
}

},{}],12:[function(require,module,exports){
module.exports = {
    init: function(opts) {
        if (!opts || !opts.context || !opts.viewport ) {
            console.warn('render system failed to initialize, a context & viewport are required');
            return false;
        }

        this.components = [];
        this.context = opts.context;
        this.viewport = opts.viewport; 
        this.msgbus = opts.msgbus;

        return true;
    },

    register: function(component) {
        this.components.push(component);
        this.msgbus.publish('componentRegistered', { system: 'renderSystem', component: component });
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

},{}],13:[function(require,module,exports){
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

},{"../../outbrk/src/components/Moveable":3,"../../outbrk/src/components/Renderable":4}],14:[function(require,module,exports){
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

},{"../../outbrk/src/components/Moveable":3,"../../outbrk/src/components/Renderable":4}],15:[function(require,module,exports){
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

},{"../../outbrk/src/components/Moveable":3,"../../outbrk/src/components/Renderable":4}],16:[function(require,module,exports){
var outbrk = require('../outbrk/src/outbrk')
  , MessageBus = require('../outbrk/src/MessageBus')
//  , objectPool = require('./objectPool')
  , Ball = require('./entities/Ball')
  , Box = require('./entities/Box')
  , Pacman = require('./entities/Pacman')
;

window.addEventListener('load', function() {
    var msgbus = new MessageBus()
    window.game = new outbrk({
        msgbus: msgbus

      , createPool: function(pool) {
            pool.ball = new Ball({ x: 0.15, msgbus: msgbus });
            pool.box = new Box({ msgbus: msgbus });
            pool.pacman = new Pacman({ msgbus: msgbus });
        }
    });
});

},{"../outbrk/src/MessageBus":1,"../outbrk/src/outbrk":9,"./entities/Ball":13,"./entities/Box":14,"./entities/Pacman":15}]},{},[16])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJvdXRicmsvc3JjL01lc3NhZ2VCdXMuanMiLCJvdXRicmsvc3JjL2NvbXBvbmVudHMvQ29sbGlkZWFibGUuanMiLCJvdXRicmsvc3JjL2NvbXBvbmVudHMvTW92ZWFibGUuanMiLCJvdXRicmsvc3JjL2NvbXBvbmVudHMvUmVuZGVyYWJsZS5qcyIsIm91dGJyay9zcmMvZW50aXRpZXMvQmFsbC5qcyIsIm91dGJyay9zcmMvZW50aXRpZXMvUGFjbWFuLmpzIiwib3V0YnJrL3NyYy9lbnRpdGllcy9QbGF5ZXIuanMiLCJvdXRicmsvc3JjL29iamVjdFBvb2wuanMiLCJvdXRicmsvc3JjL291dGJyay5qcyIsIm91dGJyay9zcmMvc3lzdGVtcy9jb2xsaXNpb25TeXN0ZW0uanMiLCJvdXRicmsvc3JjL3N5c3RlbXMvbW92ZXJTeXN0ZW0uanMiLCJvdXRicmsvc3JjL3N5c3RlbXMvcmVuZGVyU3lzdGVtLmpzIiwic3JjL2VudGl0aWVzL0JhbGwuanMiLCJzcmMvZW50aXRpZXMvQm94LmpzIiwic3JjL2VudGl0aWVzL1BhY21hbi5qcyIsInNyYy9zaWx2ZXItY2Fybml2YWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gTWVzc2FnZUJ1cygpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShldmVudE5hbWUsIGNiKSB7XG4gICAgICAgIGlmICghIGhhbmRsZXJzLmhhc093blByb3BlcnR5KGV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChjYik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5zdWJzY3JpYmUoZXZlbnROYW1lLCBjYikge1xuICAgICAgICAvL0ZJWE1FOiBzdHViXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHVibGlzaChldmVudE5hbWUsIG9wdHMpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGhhbmRsZXJzW2V2ZW50TmFtZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIFtdLmZvckVhY2guY2FsbChjYWxsYmFja3MsIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sob3B0cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHN1YnNjcmliZTogc3Vic2NyaWJlXG4vLyAgICAgICwgdW5zdWJzY3JpYmU6IHVuc3Vic2NyaWJlXG4gICAgICAsIHB1Ymxpc2g6IHB1Ymxpc2hcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZUJ1cztcbiIsInZhciBjb2xsaXNpb25TeXN0ZW0gPSByZXF1aXJlKCcuLi9zeXN0ZW1zL2NvbGxpc2lvblN5c3RlbScpO1xuXG5mdW5jdGlvbiBDb2xsaWRlYWJsZShlbnRpdHkpIHtcblx0dGhpcy5lbnRpdHkgPSBlbnRpdHk7XG5cdGNvbGxpc2lvblN5c3RlbS5yZWdpc3Rlcih0aGlzKTtcbn1cblxuQ29sbGlkZWFibGUuX2FjdGlvbnMgPSB7XG5cdGRlZmxlY3Q6IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBvdGhlciA9IG9wdHMub3RoZXJcbiAgICAgICAgICAsIGVudGl0eSA9IG9wdHMuZW50aXR5XG4gICAgICAgICAgLCBzcGVlZFByb3AgPSBvcHRzLnNwZWVkUHJvcFxuICAgICAgICA7XG5cbiAgICAgICAgb3RoZXJbc3BlZWRQcm9wXSAqPSAtMTtcblx0fSxcblxuXHRkZWFjdGl2YXRlOiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBvdGhlciA9IG9wdHMub3RoZXJcbiAgICAgICAgICAsIGVudGl0eSA9IG9wdHMuZW50aXR5XG4gICAgICAgICAgLCBzcGVlZFByb3AgPSBvcHRzLnNwZWVkUHJvcFxuICAgICAgICA7XG5cblx0XHRlbnRpdHkuaXNBY3RpdmUgPSBmYWxzZTtcblx0XHQvL3RoaXMuZGVmbGVjdCh7IG90aGVyOiBvdGhlciwgZW50aXR5OiBlbnRpdHksIHNwZWVkUHJvcDogc3BlZWRQcm9wIH0pO1xuXHR9XG59O1xuXG5Db2xsaWRlYWJsZS5fZ2V0Q2xvc2VzdFBvaW50ID0gZnVuY3Rpb24gZ2V0UG9pbnQob3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgdmFyIHBvaW50ID0gb3B0cy5wb2ludFxuICAgICAgLCBtaW5pbXVtID0gb3B0cy5taW5pbXVtXG4gICAgICAsIG1heGltdW0gPSBvcHRzLm1heGltdW1cbiAgICA7XG5cblx0cmV0dXJuIE1hdGgubWF4KG1pbmltdW0sIE1hdGgubWluKG1heGltdW0sIHBvaW50KSk7XG59O1xuXG5Db2xsaWRlYWJsZS5fZ2V0Qm91bmRpbmdCb3ggPSBmdW5jdGlvbihlbnRpdHkpIHtcbiAgICBmdW5jdGlvbiB4UHJvamVjdGlvbih4KSB7XG4gICAgICAgIHJldHVybiB4ICogNjQwOyAvLyBGSVhNRTogdmlld3BvcnQgd2lkdGhcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB5UHJvamVjdGlvbih5KSB7XG4gICAgICAgIHJldHVybiB5ICogNDgwOyAvLyBGSVhNRTogdmlld3BvcnQgaGVpZ2h0XG4gICAgfVxuXG4gICAgdmFyIGJvdW5kaW5nQm94ID0ge1xuICAgICAgICAgICAgeDogeFByb2plY3Rpb24oZW50aXR5LngpIC0geFByb2plY3Rpb24oZW50aXR5LndpZHRoKS8yXG4gICAgICAgICAgLCB5OiB5UHJvamVjdGlvbihlbnRpdHkueSkgLSB5UHJvamVjdGlvbihlbnRpdHkuaGVpZ2h0KS8yXG4gICAgICAgICAgLCB3OiB4UHJvamVjdGlvbihlbnRpdHkud2lkdGgpXG4gICAgICAgICAgLCBoOiB5UHJvamVjdGlvbihlbnRpdHkuaGVpZ2h0KVxuICAgICAgICB9XG4gICAgO1xuXG4gICAgcmV0dXJuIGJvdW5kaW5nQm94O1xufTtcblxuQ29sbGlkZWFibGUucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uKG90aGVyKSB7XG5cdHZhciBlbnRpdHkgPSB0aGlzLmVudGl0eVxuXHQgICwgaXNBY3RpdmUgPSBlbnRpdHkuaXNBY3RpdmVcbiAgICAgICwgY29sbGlzaW9uT3B0aW9ucyA9IGVudGl0eS5jb2xsaXNpb25PcHRzXG5cdCAgLCBhY3Rpb24gPSBjb2xsaXNpb25PcHRpb25zLmFjdGlvblxuICAgICAgLCBzcGVlZFByb3AgPSBjb2xsaXNpb25PcHRpb25zLnNwZWVkUHJvcFxuICAgICAgLCBoYXNJbnRlcnNlY3QgPSBmYWxzZVxuICAgIDtcblxuXHRpZiAoIWlzQWN0aXZlIHx8ICEgKG90aGVyICYmIG90aGVyLm5hbWUpIHx8IG90aGVyLm5hbWUgPT09IGVudGl0eS5uYW1lKSByZXR1cm47XG5cbiAgICBzd2l0Y2ggKGNvbGxpc2lvbk9wdGlvbnMudHlwZSkge1xuICAgICAgICBjYXNlICdjaXJjbGUnOlxuICAgICAgICAgICAgdmFyIGNsb3Nlc3RYID0gQ29sbGlkZWFibGUuX2dldENsb3Nlc3RQb2ludCh7XG4gICAgICAgICAgICAgICAgICAgIHBvaW50OiBvdGhlci54ICsgKG90aGVyLndpZHRoLzIgKiA2NDApIC8vIEZJWE1FOiB2aWV3cG9ydCB3aWR0aFxuICAgICAgICAgICAgICAgICAgLCBtaW5pbXVtOiBlbnRpdHkueFxuICAgICAgICAgICAgICAgICAgLCBtYXhpbXVtOiBlbnRpdHkueCArIGVudGl0eS5yYWRpdXMvMlxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgLCBjbG9zZXN0WSA9IENvbGxpZGVhYmxlLl9nZXRDbG9zZXN0UG9pbnQoe1xuICAgICAgICAgICAgICAgICAgICBwb2ludDogb3RoZXIueSArIChvdGhlci5oZWlnaHQvMiAqIDQ4MCkgLy8gRklYTUU6IHZpZXdwb3J0IGhlaWdodFxuICAgICAgICAgICAgICAgICAgLCBtaW5pbXVtOiBlbnRpdHkueVxuICAgICAgICAgICAgICAgICAgLCBtYXhpbXVtOiBlbnRpdHkueSArIGVudGl0eS5yYWRpdXMvMlxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICBcdCAgICAgICwgZGlzdGFuY2VYID0gb3RoZXIueCAtIGNsb3Nlc3RYXG5cdCAgICAgICAgICAsIGRpc3RhbmNlWSA9IG90aGVyLnkgLSBjbG9zZXN0WVxuICAgICAgICBcdCAgLCBkaXN0YW5jZVNxdWFyZWQgPSBkaXN0YW5jZVggKiBkaXN0YW5jZVggKyBkaXN0YW5jZVkgKiBkaXN0YW5jZVlcbiAgICAgICAgICAgIDtcblxuICAgICAgICBcdGhhc0ludGVyc2VjdCA9IGRpc3RhbmNlU3F1YXJlZCA8IGVudGl0eS5yYWRpdXMgKiBlbnRpdHkucmFkaXVzXG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdib3gnOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIGJveEVudGl0eSA9IENvbGxpZGVhYmxlLl9nZXRCb3VuZGluZ0JveChlbnRpdHkpXG4gICAgICAgICAgICAgICwgYm94T3RoZXIgPSBDb2xsaWRlYWJsZS5fZ2V0Qm91bmRpbmdCb3gob3RoZXIpXG4gICAgICAgICAgICA7XG5cbiAgICAgICAgICAgIGhhc0ludGVyc2VjdCA9IChcbiAgICAgICAgICAgICAgICBib3hFbnRpdHkueCA8IGJveE90aGVyLnggKyBib3hPdGhlci53ICAmJlxuICAgICAgICAgICAgICAgIGJveEVudGl0eS54ICsgYm94RW50aXR5LncgPiBib3hPdGhlci54ICYmXG4gICAgICAgICAgICAgICAgYm94RW50aXR5LnkgPCBib3hPdGhlci55ICsgYm94T3RoZXIuaCAgJiZcbiAgICAgICAgICAgICAgICBib3hFbnRpdHkueSArIGJveEVudGl0eS5oID4gYm94T3RoZXIueVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cblx0aWYgKGhhc0ludGVyc2VjdCkge1xuICAgICAgICBDb2xsaWRlYWJsZS5fYWN0aW9uc1thY3Rpb25dKHsgb3RoZXI6IG90aGVyLCBlbnRpdHk6IGVudGl0eSwgc3BlZWRQcm9wOiBzcGVlZFByb3AgfSk7XG4gICAgICAgIGVudGl0eS5tc2didXMucHVibGlzaCgnY29sbGlzaW9uJywgeyBlbnRpdHk6IGVudGl0eSwgb3RoZXI6IG90aGVyIH0pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGlkZWFibGU7XG4iLCJ2YXIgbW92ZXJTeXN0ZW0gPSByZXF1aXJlKCcuLi9zeXN0ZW1zL21vdmVyU3lzdGVtJyk7XG5cbmZ1bmN0aW9uIE1vdmVhYmxlKGVudGl0eSkge1xuICAgIHRoaXMuZW50aXR5ID0gZW50aXR5O1xuICAgIG1vdmVyU3lzdGVtLnJlZ2lzdGVyKHRoaXMpO1xufVxuXG5Nb3ZlYWJsZS5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVudGl0eSA9IHRoaXMuZW50aXR5O1xuXG4gICAgaWYgKCFlbnRpdHkuaXNBY3RpdmUpIHJldHVybjtcblxuICAgIGVudGl0eS54ICs9IGVudGl0eS54U3BlZWQ7XG4gICAgZW50aXR5LnkgKz0gZW50aXR5LnlTcGVlZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb3ZlYWJsZTtcbiIsInZhciByZW5kZXJTeXN0ZW0gPSByZXF1aXJlKCcuLi9zeXN0ZW1zL3JlbmRlclN5c3RlbScpO1xuXG5mdW5jdGlvbiBSZW5kZXJhYmxlKGVudGl0eSkge1xuICAgIHRoaXMuZW50aXR5ID0gZW50aXR5O1xuICAgIHJlbmRlclN5c3RlbS5yZWdpc3Rlcih0aGlzKTtcbn1cblxuUmVuZGVyYWJsZS5fdHlwZXMgPSB7XG4gICAgcmVjdGFuZ2xlOiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBwcm9qZWN0ZWRYID0gb3B0cy5lbnRpdHkueCAqIG9wdHMudmlld3BvcnQud2lkdGhcbiAgICAgICAgICAsIHByb2plY3RlZFkgPSBvcHRzLmVudGl0eS55ICogb3B0cy52aWV3cG9ydC5oZWlnaHRcbiAgICAgICAgICAsIHByb2plY3RlZFdpZHRoID0gb3B0cy5lbnRpdHkud2lkdGggKiBvcHRzLnZpZXdwb3J0LndpZHRoXG4gICAgICAgICAgLCBwcm9qZWN0ZWRIZWlnaHQgPSBvcHRzLmVudGl0eS5oZWlnaHQgKiBvcHRzLnZpZXdwb3J0LmhlaWdodFxuICAgICAgICA7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmZpbGxSZWN0KHByb2plY3RlZFgsIHByb2plY3RlZFksIHByb2plY3RlZFdpZHRoLCBwcm9qZWN0ZWRIZWlnaHQpO1xuICAgIH1cblxuICAsIGNpcmNsZTogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICB2YXIgcHJvamVjdGVkWCA9IG9wdHMuZW50aXR5LnggKiBvcHRzLnZpZXdwb3J0LndpZHRoXG4gICAgICAgICAgLCBwcm9qZWN0ZWRZID0gb3B0cy5lbnRpdHkueSAqIG9wdHMudmlld3BvcnQuaGVpZ2h0XG4gICAgICAgICAgLCBwcm9qZWN0ZWRSYWRpdXMgPSBvcHRzLmVudGl0eS5yYWRpdXMgKiBvcHRzLnZpZXdwb3J0LndpZHRoXG4gICAgICAgICAgLCBfZmlsbFN0eWxlID0gb3B0cy5jb250ZXh0LmZpbGxTdHlsZVxuICAgICAgICA7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmZpbGxTdHlsZSA9IF9maWxsU3R5bGU7XG4gICAgICAgIG9wdHMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgb3B0cy5jb250ZXh0LmFyYyhwcm9qZWN0ZWRYLCBwcm9qZWN0ZWRZLCBwcm9qZWN0ZWRSYWRpdXMsIDAsIE1hdGguUEkgKiAyKTtcbiAgICAgICAgb3B0cy5jb250ZXh0LmZpbGwoKTtcbiAgICB9XG5cbiAgLCBnZW9tZXRyeTogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICB2YXIgZ2VvbWV0cnkgPSBvcHRzLmVudGl0eTtcblxuICAgICAgICBvcHRzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKGdlb21ldHJ5LCBmdW5jdGlvbihwb2ludCkge1xuICAgICAgICAgICAgb3B0cy5jb250ZXh0LmxpbmVUbyhwb2ludC54ICogb3B0cy52aWV3cG9ydC53aWR0aCwgcG9pbnQueSAqIG9wdHMudmlld3BvcnQuaGVpZ2h0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmZpbGwoKTtcbiAgICB9XG5cbiAgLCBzdXJmYWNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLyogIGRyYXdpbmcgaGFuZGxlZCBpbiBmaWxsU3R5bGUsIGFueXRoaW5nIGFkZGVkIGhlcmUgd2lsbCBiZSBkcmF3biBvdmVydG9wXG4gICAgICAgICAgICB3aGljaCBtYXkgYmUgdXNlZnVsIGZvciBodWRzLCBsaWZlIGJhcnMsIHRhZ3MsIGJhZGdlcyBldGNcbiAgICAgICAgKi9cbiAgICB9XG59O1xuXG5SZW5kZXJhYmxlLl9maWxsU3R5bGVzID0ge1xuICAgIGNvbG91cjogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICBvcHRzLmNvbnRleHQuZmlsbFN0eWxlID0gb3B0cy5maWxsU3R5bGUuY29sb3VyO1xuICAgIH1cblxuICAsIGdyYWRpZW50OiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBwcm9qZWN0ZWRYID0gb3B0cy5lbnRpdHkueCAqIG9wdHMudmlld3BvcnQud2lkdGhcbiAgICAgICAgICAsIHByb2plY3RlZFkgPSBvcHRzLmVudGl0eS55ICogb3B0cy52aWV3cG9ydC5oZWlnaHRcbiAgICAgICAgICAsIHByb2plY3RlZEhlaWdodCA9IG9wdHMuZW50aXR5LmhlaWdodCAqIG9wdHMudmlld3BvcnQuaGVpZ2h0XG4gICAgICAgICAgLCBncmFkaWVudCA9IG9wdHMuY29udGV4dC5jcmVhdGVMaW5lYXJHcmFkaWVudChwcm9qZWN0ZWRYLCBwcm9qZWN0ZWRZLCBwcm9qZWN0ZWRYLCBwcm9qZWN0ZWRZICsgcHJvamVjdGVkSGVpZ2h0KVxuICAgICAgICA7XG5cbiAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsIG9wdHMuZmlsbFN0eWxlLmZpcnN0U3RlcCk7XG4gICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCBvcHRzLmZpbGxTdHlsZS5zZWNvbmRTdGVwKTtcblxuICAgICAgICBvcHRzLmNvbnRleHQuZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgfVxuXG4gICwgcGF0dGVybjogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICB2YXIgcGF0dGVybiA9IG9wdHMuY29udGV4dC5jcmVhdGVQYXR0ZXJuKG9wdHMuZmlsbFN0eWxlLnNvdXJjZSwgJ3JlcGVhdCcpO1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5maWxsU3R5bGUgPSBwYXR0ZXJuO1xuICAgIH1cblxuICAsIGRyYXdhYmxlOiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgICAgICBvcHRzLmZpbGxTdHlsZS5kcmF3KG9wdHMpO1xuICAgIH1cbn07XG5cblJlbmRlcmFibGUuX2NsZWFyQ29udGV4dCA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgIHZhciBwcm9qZWN0ZWRYID0gZW50aXR5LnggKiB2aWV3cG9ydC53aWR0aFxuICAgICAgLCBwcm9qZWN0ZWRZID0gZW50aXR5LnkgKiB2aWV3cG9ydC5oZWlnaHRcbiAgICAgICwgcHJvamVjdGVkV2lkdGggPSBlbnRpdHkud2lkdGggKiB2aWV3cG9ydC53aWR0aFxuICAgICAgLCBwcm9qZWN0ZWRIZWlnaHQgPSBlbnRpdHkuaGVpZ2h0ICogdmlld3BvcnQuaGVpZ2h0XG4gICAgO1xuXG4gICAgb3B0cy5jb250ZXh0LmNsZWFyUmVjdChwcm9qZWN0ZWRYLCBwcm9qZWN0ZWRZLCBwcm9qZWN0ZWRXaWR0aCwgcHJvamVjdGVkSGVpZ2h0KTtcbn1cblxuUmVuZGVyYWJsZS5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24oY29udGV4dCwgdmlld3BvcnQpIHtcbiAgICB2YXIgZW50aXR5ID0gdGhpcy5lbnRpdHlcbiAgICAgICwgcmVuZGVyT3B0cyA9IGVudGl0eS5yZW5kZXJPcHRzXG4gICAgO1xuXG4gICAgaWYgKCFlbnRpdHkuaXNBY3RpdmUpIHJldHVybjtcblxuICAgIFJlbmRlcmFibGUuX2ZpbGxTdHlsZXNbcmVuZGVyT3B0cy5maWxsU3R5bGUudHlwZV0oe1xuICAgICAgICBlbnRpdHk6IGVudGl0eVxuICAgICAgLCBmaWxsU3R5bGU6IHJlbmRlck9wdHMuZmlsbFN0eWxlXG4gICAgICAsIGNvbnRleHQ6IGNvbnRleHRcbiAgICAgICwgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgfSk7XG5cbiAgICBSZW5kZXJhYmxlLl90eXBlc1tyZW5kZXJPcHRzLnR5cGVdKHtcbiAgICAgICAgZW50aXR5OiBlbnRpdHlcbiAgICAgICwgY29udGV4dDogY29udGV4dFxuICAgICAgLCB2aWV3cG9ydDogdmlld3BvcnRcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJhYmxlO1xuIiwidmFyIFJlbmRlcmFibGUgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL1JlbmRlcmFibGUnKVxuICAsIE1vdmVhYmxlID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9Nb3ZlYWJsZScpXG4gICwgQ29sbGlkZWFibGUgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0NvbGxpZGVhYmxlJylcbiAgLCB4ID0gMC4wMCAgICAvLyBwZXJjZW50YWdlc1xuICAsIHkgPSAwLjAwXG4gICwgU1BFRUQgPSAwLjAwNFxuICAsIFJBRElVUyA9IDAuMDFcbjtcblxuZnVuY3Rpb24gQmFsbChvcHRzKSB7XG4gICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICB0aGlzLm5hbWUgPSBvcHRzLm5hbWUgfHwgJ0JhbGwnO1xuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMubXNnYnVzID0gb3B0cy5tc2didXM7XG5cbiAgICB0aGlzLnggPSBvcHRzLnggfHwgeDtcbiAgICB0aGlzLnkgPSBvcHRzLnkgfHwgeTtcbiAgICB0aGlzLnJhZGl1cyA9IG9wdHMucmFkaXVzIHx8IFJBRElVUztcblxuICAgIC8vRklYTUU6IG1ha2UgY29sbGlzaW9uIGJvdW5kcyBtb3JlIGNsZWFyXG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGggfHwgMC4wMjtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0IHx8IDAuMDI7XG5cbiAgICB0aGlzLnhTcGVlZCA9IG9wdHMueFNwZWVkIHx8IFNQRUVEO1xuICAgIHRoaXMueVNwZWVkID0gb3B0cy55U3BlZWQgfHwgU1BFRUQ7XG5cbiAgICB0aGlzLnJlbmRlck9wdHMgPSBvcHRzLnJlbmRlck9wdHMgfHwge1xuICAgICAgICB0eXBlOiAnY2lyY2xlJ1xuXG4gICAgICAsIGZpbGxTdHlsZToge1xuICAgICAgICAgICAgdHlwZTogJ2NvbG91cidcbiAgICAgICAgICAsIGNvbG91cjogJ3JlZCdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmNvbGxpc2lvbk9wdHMgPSBvcHRzLmNvbGxpc2lvbk9wdHMgfHwge1xuICAgICAgICB0eXBlOiAnYm94J1xuICAgICAgLCBhY3Rpb246ICdkZWZsZWN0J1xuICAgICAgLCBzcGVlZFByb3A6ICd5U3BlZWQnXG4gICAgfVxuXG4gICAgbmV3IFJlbmRlcmFibGUodGhpcyk7XG4gICAgbmV3IE1vdmVhYmxlKHRoaXMpO1xuICAgIG5ldyBDb2xsaWRlYWJsZSh0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCYWxsO1xuIiwidmFyIFJlbmRlcmFibGUgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL1JlbmRlcmFibGUnKVxuICAsIE1vdmVhYmxlID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9Nb3ZlYWJsZScpXG4gICwgQ29sbGlkZWFibGUgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0NvbGxpZGVhYmxlJylcbiAgLCB4ID0gMC4xMCAgICAvLyBwZXJjZW50YWdlc1xuICAsIHkgPSAwLjEwXG4gICwgU1BFRUQgPSAwLjAwMjVcbiAgLCBXSURUSCA9IDAuMDM1XG4gICwgSEVJR0hUID0gMC4wNVxuO1xuXG5mdW5jdGlvbiBQYWNtYW4ob3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgdGhpcy5uYW1lID0gb3B0cy5uYW1lIHx8ICdQYWNtYW4nO1xuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMubXNnYnVzID0gb3B0cy5tc2didXM7XG5cbiAgICB0aGlzLnggPSBvcHRzLnggfHwgeDtcbiAgICB0aGlzLnkgPSBvcHRzLnkgfHwgeTtcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aCB8fCBXSURUSDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0IHx8IEhFSUdIVDtcbiAgICB0aGlzLnhTcGVlZCA9IG9wdHMueFNwZWVkIHx8IFNQRUVEO1xuICAgIHRoaXMueVNwZWVkID0gb3B0cy55U3BlZWQgfHwgU1BFRUQ7XG5cbiAgICB0aGlzLnJlbmRlck9wdHMgPSBvcHRzLnJlbmRlck9wdHMgfHwge1xuICAgICAgICB0eXBlOiAnc3VyZmFjZSdcblxuICAgICAgLCBmaWxsU3R5bGU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdkcmF3YWJsZSdcblxuICAgICAgICAgICwgZHJhdzogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLmNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IG9wdHMuY29udGV4dFxuICAgICAgICAgICAgICAgICAgICAgICwgdnAgPSBvcHRzLnZpZXdwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgLCB4ID0gb3B0cy5lbnRpdHkueCAqIHZwLndpZHRoIC0gKG9wdHMuZW50aXR5LndpZHRoIC8gMilcbiAgICAgICAgICAgICAgICAgICAgICAsIHkgPSBvcHRzLmVudGl0eS55ICogdnAuaGVpZ2h0IC0gKG9wdHMuZW50aXR5LmhlaWdodCAvIDIpXG4gICAgICAgICAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlPScjRkZERjAwJztcblxuICAgICAgICAgICAgICAgICAgICAvLyBwYWNtYW5cbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKHgrKDEwKSwgeSsoMTApLCAxMywgTWF0aC5QSS83LCAtTWF0aC5QSS83LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCsoNSksIHkrKDEwKSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb2xsaXNpb25PcHRzID0gb3B0cy5jb2xsaXNpb25PcHRzIHx8IHtcbiAgICAgICAgdHlwZTogJ2JveCdcbiAgICAgICwgYWN0aW9uOiAnZGVmbGVjdCdcbiAgICAgICwgc3BlZWRQcm9wOiAneVNwZWVkJ1xuICAgIH1cblxuICAgIG5ldyBSZW5kZXJhYmxlKHRoaXMpO1xuICAgIG5ldyBNb3ZlYWJsZSh0aGlzKTtcbiAgICBuZXcgQ29sbGlkZWFibGUodGhpcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFjbWFuO1xuIiwidmFyIFJlbmRlcmFibGUgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL1JlbmRlcmFibGUnKVxuICAsIE1vdmVhYmxlID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9Nb3ZlYWJsZScpXG4gICwgQ29sbGlkZWFibGUgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0NvbGxpZGVhYmxlJylcbiAgLCB4ID0gMS4xMCAgICAvLyBwZXJjZW50YWdlc1xuICAsIHkgPSAxLjAwXG4gICwgU1BFRUQgPSAtMC4wMDRcbiAgLCBSQURJVVMgPSAwLjAyXG47XG5cbmZ1bmN0aW9uIFBsYXllcihvcHRzKSB7XG4gICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICB0aGlzLm5hbWUgPSBvcHRzLm5hbWUgfHwgJ1BsYXllcic7XG4gICAgdGhpcy5pc0FjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5tc2didXMgPSBvcHRzLm1zZ2J1cztcblxuICAgIHRoaXMueCA9IG9wdHMueCB8fCB4O1xuICAgIHRoaXMueSA9IG9wdHMueSB8fCB5O1xuICAgIHRoaXMucmFkaXVzID0gb3B0cy5yYWRpdXMgfHwgUkFESVVTO1xuXG4gICAgLy9GSVhNRTogbWFrZSBjb2xsaXNpb24gYm91bmRzIG1vcmUgY2xlYXJcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aCB8fCAwLjA0O1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0cy5oZWlnaHQgfHwgMC4wNDtcblxuICAgIHRoaXMueFNwZWVkID0gb3B0cy54U3BlZWQgfHwgU1BFRUQ7XG4gICAgdGhpcy55U3BlZWQgPSBvcHRzLnlTcGVlZCB8fCBTUEVFRDtcblxuICAgIHRoaXMucmVuZGVyT3B0cyA9IG9wdHMucmVuZGVyT3B0cyB8fCB7XG4gICAgICAgIHR5cGU6ICdjaXJjbGUnXG5cbiAgICAgICwgZmlsbFN0eWxlOiB7XG4gICAgICAgICAgICB0eXBlOiAnY29sb3VyJ1xuICAgICAgICAgICwgY29sb3VyOiAnYmx1ZSdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmNvbGxpc2lvbk9wdHMgPSBvcHRzLmNvbGxpc2lvbk9wdHMgfHwge1xuICAgICAgICB0eXBlOiAnYm94J1xuICAgICAgLCBhY3Rpb246ICdkZWZsZWN0J1xuICAgICAgLCBzcGVlZFByb3A6ICd5U3BlZWQnXG4gICAgfVxuXG5cbiAgICBuZXcgUmVuZGVyYWJsZSh0aGlzKTtcbiAgICBuZXcgTW92ZWFibGUodGhpcyk7XG4gICAgbmV3IENvbGxpZGVhYmxlKHRoaXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllcjtcbiIsInZhciBCYWxsID0gcmVxdWlyZSgnLi9lbnRpdGllcy9CYWxsJylcbiAgLCBQbGF5ZXIgPSByZXF1aXJlKCcuL2VudGl0aWVzL1BsYXllcicpXG4gICwgUGFjbWFuID0gcmVxdWlyZSgnLi9lbnRpdGllcy9QYWNtYW4nKVxuICAsIHBvb2wgPSB7fVxuO1xuXG5mdW5jdGlvbiBPYmplY3RQb29sKG9wdHMpIHtcbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgIHRoaXMubXNnYnVzID0gb3B0cy5tc2didXM7XG59XG5cbk9iamVjdFBvb2wucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBwb29sW2tleV07XG59O1xuXG5PYmplY3RQb29sLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrZXksIG9iaikge1xuICAgIHBvb2xba2V5XSA9IG9iajtcbn1cblxuT2JqZWN0UG9vbC5wcm90b3R5cGUuZ2V0UG9vbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBwb29sO1xufTtcblxuT2JqZWN0UG9vbC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oZm4pIHtcbiAgICBpZiAoZm4gJiYgdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZuKHBvb2wpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3RQb29sO1xuIiwidmFyIG91dGJyayA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgICAgIC8vIGNvcmVcbiAgICAgICAgdmFyIE9iamVjdFBvb2wgPSByZXF1aXJlKCcuL29iamVjdFBvb2wnKVxuICAgICAgICAgICwgTWVzc2FnZUJ1cyA9IHJlcXVpcmUoJy4vTWVzc2FnZUJ1cycpXG5cbiAgICAgICAgICAgIC8vIHN5c3RlbXNcbiAgICAgICAgICAsIHJlbmRlclN5c3RlbSA9IHJlcXVpcmUoJy4vc3lzdGVtcy9yZW5kZXJTeXN0ZW0nKVxuICAgICAgICAgICwgbW92ZXJTeXN0ZW0gPSByZXF1aXJlKCcuL3N5c3RlbXMvbW92ZXJTeXN0ZW0nKVxuICAgICAgICAgICwgY29sbGlzaW9uU3lzdGVtID0gcmVxdWlyZSgnLi9zeXN0ZW1zL2NvbGxpc2lvblN5c3RlbScpXG5cbiAgICAgICAgICAgIC8vIGVudGl0aWVzL3ByZWZhYnNcbiAgICAgICAgICAsIEJhbGwgPSByZXF1aXJlKCcuL2VudGl0aWVzL0JhbGwnKVxuICAgICAgICAgICwgUGxheWVyID0gcmVxdWlyZSgnLi9lbnRpdGllcy9QbGF5ZXInKVxuICAgICAgICAgICwgUGFjbWFuID0gcmVxdWlyZSgnLi9lbnRpdGllcy9QYWNtYW4nKVxuXG4gICAgICAgICAgICAvLyBjb25maWd1cmFibGVzXG4gICAgICAgICAgLCBtc2didXMgPSBvcHRzLm1zZ2J1cyB8fCBuZXcgTWVzc2FnZUJ1cygpXG4gICAgICAgICAgLCBvYmplY3RQb29sID0gb3B0cy5vYmplY3RQb29sIHx8IG5ldyBPYmplY3RQb29sKClcblxuICAgICAgICAgICwgY3JlYXRlUG9vbCA9IG9wdHMuY3JlYXRlUG9vbCB8fCBmdW5jdGlvbihwb29sKSB7XG4gICAgICAgICAgICAgICAgcG9vbC5iYWxsID0gbmV3IEJhbGwoeyB4OiAwLjE1LCBtc2didXM6IG1zZ2J1cyB9KTtcbiAgICAgICAgICAgICAgICBwb29sLnBsYXllciA9IG5ldyBQbGF5ZXIoeyBtc2didXM6IG1zZ2J1cyB9KTtcbiAgICAgICAgICAgICAgICBwb29sLnBhY21hbiA9IG5ldyBQYWNtYW4oeyBtc2didXM6IG1zZ2J1cyB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcmVuZGVyaW5nIHNldHVwXG4gICAgICAgICAgLCAkID0gZnVuY3Rpb24oc2VsKSB7IHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbCk7IH1cbiAgICAgICAgICAsICQkID0gZnVuY3Rpb24oc2VsKSB7IHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbCk7IH1cbiAgICAgICAgICAsICRjYW52YXMgPSAkKCdjYW52YXMnKVxuICAgICAgICAgICwgY3R4MmQgPSAkY2FudmFzLmdldENvbnRleHQoJzJkJylcbiAgICAgICAgICAsIHZpZXdwb3J0ID0geyB3aWR0aDogJGNhbnZhcy53aWR0aCwgaGVpZ2h0OiAkY2FudmFzLmhlaWdodCB9XG4gICAgICAgIDtcblxuICAgICAgICAvLyBzZXR1cCBlbmdpbmUgaW50ZXJmYWNlXG4gICAgICAgIHRoaXMubXNnYnVzID0gbXNnYnVzO1xuICAgICAgICB0aGlzLnZpZXdwb3J0ID0gdmlld3BvcnQ7XG4gICAgICAgIHRoaXMub2JqZWN0UG9vbCA9IG9iamVjdFBvb2w7XG4gICAgICAgIHRoaXMucHJlZmFicyA9IHtcbiAgICAgICAgICAgIEJhbGw6IEJhbGxcbiAgICAgICAgICAsIFBsYXllcjogUGxheWVyXG4gICAgICAgICAgLCBQYWNtYW46IFBhY21hblxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGluaXQgYW5kIHJ1blxuICAgICAgICBpZiAocmVuZGVyU3lzdGVtLmluaXQoeyBtc2didXM6IG1zZ2J1cywgY29udGV4dDogY3R4MmQsIHZpZXdwb3J0OiB2aWV3cG9ydCB9KSkge1xuICAgICAgICAgICAgbW92ZXJTeXN0ZW0uaW5pdCh7IG1zZ2J1czogbXNnYnVzIH0pO1xuICAgICAgICAgICAgY29sbGlzaW9uU3lzdGVtLmluaXQoeyBtc2didXM6IG1zZ2J1cyB9KTtcblxuICAgICAgICAgICAgb2JqZWN0UG9vbC5jcmVhdGUoY3JlYXRlUG9vbCk7XG5cbiAgICAgICAgICAgIGNvbGxpc2lvblN5c3RlbS5zZXRQbGF5ZXIob2JqZWN0UG9vbC5nZXQoJ3BsYXllcicpKTtcblxuICAgICAgICAgICAgbXNnYnVzLnB1Ymxpc2goJ2dhbWVTdGFydCcpO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBnYW1lbG9vcCgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcG9vbCA9IG9iamVjdFBvb2wuZ2V0UG9vbCgpO1xuXG4gICAgICAgICAgICAgICAgY3R4MmQuY2xlYXJSZWN0KDAsIDAsIHZpZXdwb3J0LndpZHRoLCB2aWV3cG9ydC5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIG1vdmVyU3lzdGVtLmludm9rZSgpO1xuXG4gICAgICAgICAgICAgICAgY29sbGlzaW9uU3lzdGVtLmludm9rZShwb29sKTtcbiAgICAgICAgICAgICAgICByZW5kZXJTeXN0ZW0uaW52b2tlKCk7XG5cbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZ2FtZWxvb3ApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnYW1lbG9vcCgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ291dGJyazogdW5hYmxlIHRvIGluaXRpYWxpemUnKTtcbiAgICAgICAgfVxuICAgIH1cbjtcblxubW9kdWxlLmV4cG9ydHMgPSBvdXRicms7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0OiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgdGhpcy5tc2didXMgPSBvcHRzLm1zZ2J1cztcbiAgICB9XG5cbiAgLCByZWdpc3RlcjogZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHRoaXMubXNnYnVzLnB1Ymxpc2goJ2NvbXBvbmVudFJlZ2lzdGVyZWQnLCB7IHN5c3RlbTogJ2NvbGxpc2lvblN5c3RlbScsIGNvbXBvbmVudDogY29tcG9uZW50IH0pO1xuICAgIH1cblxuICAsIHNldFBsYXllcjogZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgICAgIHRoaXMucGxheWVyID0gZW50aXR5O1xuICAgIH1cblxuICAsIGludm9rZTogZnVuY3Rpb24ocG9vbCkge1xuICAgICAgICB2YXIgcGxheWVyID0gdGhpcy5wbGF5ZXJcbiAgICAgICAgICAsIG9iamVjdHMgPSBPYmplY3Qua2V5cyhwb29sKVxuICAgICAgICA7XG5cbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKHRoaXMuY29tcG9uZW50cywgZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICAgICAgICBbXS5mb3JFYWNoLmNhbGwob2JqZWN0cywgZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50Lmludm9rZShwb29sW29iamVjdF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xuICAgICAgICB0aGlzLm1zZ2J1cyA9IG9wdHMubXNnYnVzO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHRoaXMubXNnYnVzLnB1Ymxpc2goJ2NvbXBvbmVudFJlZ2lzdGVyZWQnLCB7IHN5c3RlbTogJ21vdmVyU3lzdGVtJywgY29tcG9uZW50OiBjb21wb25lbnQgfSk7XG4gICAgfSxcblxuICAgIGludm9rZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIFtdLmZvckVhY2guY2FsbCh0aGlzLmNvbXBvbmVudHMsIGZ1bmN0aW9uKGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY29tcG9uZW50Lmludm9rZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0OiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIGlmICghb3B0cyB8fCAhb3B0cy5jb250ZXh0IHx8ICFvcHRzLnZpZXdwb3J0ICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdyZW5kZXIgc3lzdGVtIGZhaWxlZCB0byBpbml0aWFsaXplLCBhIGNvbnRleHQgJiB2aWV3cG9ydCBhcmUgcmVxdWlyZWQnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBvcHRzLmNvbnRleHQ7XG4gICAgICAgIHRoaXMudmlld3BvcnQgPSBvcHRzLnZpZXdwb3J0OyBcbiAgICAgICAgdGhpcy5tc2didXMgPSBvcHRzLm1zZ2J1cztcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKGNvbXBvbmVudCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICB0aGlzLm1zZ2J1cy5wdWJsaXNoKCdjb21wb25lbnRSZWdpc3RlcmVkJywgeyBzeXN0ZW06ICdyZW5kZXJTeXN0ZW0nLCBjb21wb25lbnQ6IGNvbXBvbmVudCB9KTtcbiAgICB9LFxuXG4gICAgaW52b2tlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHRcbiAgICAgICAgICAsIHZpZXdwb3J0ID0gdGhpcy52aWV3cG9ydFxuICAgICAgICA7XG5cbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKHRoaXMuY29tcG9uZW50cywgZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjb21wb25lbnQuaW52b2tlKGNvbnRleHQsIHZpZXdwb3J0KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwidmFyIFJlbmRlcmFibGUgPSByZXF1aXJlKCcuLi8uLi9vdXRicmsvc3JjL2NvbXBvbmVudHMvUmVuZGVyYWJsZScpXG4gICwgTW92ZWFibGUgPSByZXF1aXJlKCcuLi8uLi9vdXRicmsvc3JjL2NvbXBvbmVudHMvTW92ZWFibGUnKVxuICAsIHggPSAwLjAwICAgIC8vIHBlcmNlbnRhZ2VzXG4gICwgeSA9IDAuMDBcbiAgLCBTUEVFRCA9IDAuMDA0XG4gICwgUkFESVVTID0gMC4wMlxuO1xuXG5mdW5jdGlvbiBCYWxsKCkge1xuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMucmFkaXVzID0gUkFESVVTO1xuXG4gICAgdGhpcy54U3BlZWQgPSBTUEVFRDtcbiAgICB0aGlzLnlTcGVlZCA9IFNQRUVEO1xuXG4gICAgdGhpcy5yZW5kZXJPcHRzID0ge1xuICAgICAgICB0eXBlOiAnY2lyY2xlJ1xuXG4gICAgICAsIGZpbGxTdHlsZToge1xuICAgICAgICAgICAgdHlwZTogJ2NvbG91cidcbiAgICAgICAgICAsIGNvbG91cjogJ3JlZCdcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ldyBSZW5kZXJhYmxlKHRoaXMpO1xuICAgIG5ldyBNb3ZlYWJsZSh0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCYWxsO1xuIiwidmFyIFJlbmRlcmFibGUgPSByZXF1aXJlKCcuLi8uLi9vdXRicmsvc3JjL2NvbXBvbmVudHMvUmVuZGVyYWJsZScpXG4gICwgTW92ZWFibGUgPSByZXF1aXJlKCcuLi8uLi9vdXRicmsvc3JjL2NvbXBvbmVudHMvTW92ZWFibGUnKVxuICAsIHggPSAxLjAwICAgIC8vIHBlcmNlbnRhZ2VzXG4gICwgeSA9IDAuMDBcbiAgLCBTUEVFRCA9IDAuMDAyXG4gICwgV0lEVEggPSAwLjEyNVxuICAsIEhFSUdIVCA9IDAuMTI1XG47XG5cbmZ1bmN0aW9uIEJveCgpIHtcbiAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLndpZHRoID0gV0lEVEg7XG4gICAgdGhpcy5oZWlnaHQgPSBIRUlHSFQ7XG5cbiAgICB0aGlzLnhTcGVlZCA9IC0xICogU1BFRUQ7XG4gICAgdGhpcy55U3BlZWQgPSBTUEVFRDtcblxuICAgIHRoaXMucmVuZGVyT3B0cyA9IHtcbiAgICAgICAgdHlwZTogJ3JlY3RhbmdsZSdcblxuICAgICAgLCBmaWxsU3R5bGU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdjb2xvdXInXG4gICAgICAgICAgLCBjb2xvdXI6ICdibHVlJ1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV3IFJlbmRlcmFibGUodGhpcyk7XG4gICAgbmV3IE1vdmVhYmxlKHRoaXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJveDtcbiIsInZhciBSZW5kZXJhYmxlID0gcmVxdWlyZSgnLi4vLi4vb3V0YnJrL3NyYy9jb21wb25lbnRzL1JlbmRlcmFibGUnKVxuICAsIE1vdmVhYmxlID0gcmVxdWlyZSgnLi4vLi4vb3V0YnJrL3NyYy9jb21wb25lbnRzL01vdmVhYmxlJylcbiAgLCB4ID0gMC4wMCAgICAvLyBwZXJjZW50YWdlc1xuICAsIHkgPSAwLjAwXG4gICwgU1BFRUQgPSAwLjAwNFxuICAsIFdJRFRIID0gMC41XG4gICwgSEVJR0hUID0gMC41XG47XG5cbmZ1bmN0aW9uIFBhY21hbigpIHtcbiAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLndpZHRoID0gV0lEVEg7XG4gICAgdGhpcy5oZWlnaHQgPSBIRUlHSFQ7XG4gICAgdGhpcy54U3BlZWQgPSBTUEVFRDtcbiAgICB0aGlzLnlTcGVlZCA9IFNQRUVEO1xuXG4gICAgdGhpcy5yZW5kZXJPcHRzID0ge1xuICAgICAgICB0eXBlOiAnc3VyZmFjZSdcblxuICAgICAgLCBmaWxsU3R5bGU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdkcmF3YWJsZSdcblxuICAgICAgICAgICwgZHJhdzogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICAgICAgICAgIC8vIG1vZGlmaWVkIGZyb20gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc19BUEkvVHV0b3JpYWwvRHJhd2luZ19zaGFwZXNcbiAgICAgICAgICAgICAgICBpZiAob3B0cy5jb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSBvcHRzLmNvbnRleHRcbiAgICAgICAgICAgICAgICAgICAgICAsIF9maWxsU3R5bGUgPSBjdHguZmlsbFN0eWxlXG4gICAgICAgICAgICAgICAgICAgICAgLCB2cCA9IG9wdHMudmlld3BvcnRcbiAgICAgICAgICAgICAgICAgICAgICAsIHggPSBvcHRzLmVudGl0eS54ICogdnAud2lkdGggLSAob3B0cy5lbnRpdHkud2lkdGggLyAyKVxuICAgICAgICAgICAgICAgICAgICAgICwgeSA9IG9wdHMuZW50aXR5LnkgKiB2cC5oZWlnaHQgLSAob3B0cy5lbnRpdHkuaGVpZ2h0IC8gMilcbiAgICAgICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG91dGVyIHdhbGxzXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAnYmxhY2snO1xuICAgICAgICAgICAgICAgICAgICByb3VuZGVkUmVjdChjdHgsIHgrMTIsIHkrMTIsIDE5MCwgMTgwLCAxNSk7XG4gICAgICAgICAgICAgICAgICAgIHJvdW5kZWRSZWN0KGN0eCwgeCsxOSwgeSsxOSwgMTc1LCAxNjUsIDkpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlubmVyIHdhbGxzXG4gICAgICAgICAgICAgICAgICAgIHJvdW5kZWRSZWN0KGN0eCwgeCs1MywgeSs1MywgNDksIDMzLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIHJvdW5kZWRSZWN0KGN0eCwgeCs1MywgeSsxMTksIDQ5LCAxNiwgNik7XG4gICAgICAgICAgICAgICAgICAgIHJvdW5kZWRSZWN0KGN0eCwgeCsxMzUsIHkrNTMsIDQ5LCAzMywgMTApO1xuICAgICAgICAgICAgICAgICAgICByb3VuZGVkUmVjdChjdHgsIHgrMTM1LCB5KzExOSwgMjUsIDQ5LCAxMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gcGFjbWFuXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAneWVsbG93JztcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKHgrMzcsIHkrMzcsIDEzLCBNYXRoLlBJLzcsIC1NYXRoLlBJLzcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4KzMxLCB5KzM3KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyByb3cgMSBkb3RzXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAnI0FBQUFBQSc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTw4OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh4KzUxK2kqMTYsIHkrMzQsIDQsIDQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY29sIDEgZG90cyBcbiAgICAgICAgICAgICAgICAgICAgZm9yKGk9MDsgaTw2OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh4KzExNSwgeSs1MStpKjE2LCA0LCA0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gcm93IDIgZG90c1xuICAgICAgICAgICAgICAgICAgICBmb3IoaT0wOyBpPDg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHgrNTEraSoxNiwgeSs5OSwgNCwgNCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBnaG9zdCBib2R5XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAncmVkJztcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHgrODMsIHkrMTE2KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4KzgzLCB5KzEwMik7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHgrODMsIHkrOTQsIHgrODksIHkrODgsIHgrOTcsIHkrODgpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh4KzEwNSwgeSs4OCwgeCsxMTEsIHkrOTQsIHgrMTExLCB5KzEwMik7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCsxMTEsIHkrMTE2KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4KzEwNi4zMzMsIHkrMTExLjMzMyk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCsxMDEuNjY2LCB5KzExNik7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCs5NywgeSsxMTEuMzMzKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4KzkyLjMzMywgeSsxMTYpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgrODcuNjY2LCB5KzExMS4zMzMpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgrODMsIHkrMTE2KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIGdob3N0IGV5ZXMgb3V0ZXJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwid2hpdGVcIjtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHgrOTEsIHkrOTYpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh4Kzg4LCB5Kzk2LCB4Kzg3LCB5Kzk5LCB4Kzg3LCB5KzEwMSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHgrODcsIHkrMTAzLCB4Kzg4LCB5KzEwNiwgeCs5MSwgeSsxMDYpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh4Kzk0LCB5KzEwNiwgeCs5NSwgeSsxMDMsIHgrOTUsIHkrMTAxKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oeCs5NSwgeSs5OSwgeCs5NCwgeSs5NiwgeCs5MSwgeSs5Nik7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCsxMDMsIHkrOTYpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh4KzEwMCwgeSs5NiwgeCs5OSwgeSs5OSwgeCs5OSwgeSsxMDEpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh4Kzk5LCB5KzEwMywgeCsxMDAsIHkrMTA2LCB4KzEwMywgeSsxMDYpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh4KzEwNiwgeSsxMDYsIHgrMTA3LCB5KzEwMywgeCsxMDcsIHkrMTAxKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oeCsxMDcsIHkrOTksIHgrMTA2LCB5Kzk2LCB4KzEwMywgeSs5Nik7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBnaG9zdCBleWVzIGlubmVyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyh4KzEwMSwgeSsxMDIsIDIsIDAsIE1hdGguUEkqMiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmMoeCs4OSwgeSsxMDIsIDIsIDAsIE1hdGguUEkqMiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IF9maWxsU3R5bGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBBIHV0aWxpdHkgZnVuY3Rpb24gdG8gZHJhdyBhIHJlY3RhbmdsZSB3aXRoIHJvdW5kZWQgY29ybmVycy5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiByb3VuZGVkUmVjdChjdHgsIHgsIHksIHdpZHRoLCBoZWlnaHQsIHJhZGl1cykge1xuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCwgeStyYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgsIHkraGVpZ2h0LXJhZGl1cyk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmNUbyh4LCB5K2hlaWdodCwgeCtyYWRpdXMsIHkraGVpZ2h0LCByYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgrd2lkdGgtcmFkaXVzLCB5K2hlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmNUbyh4K3dpZHRoLCB5K2hlaWdodCwgeCt3aWR0aCwgeStoZWlnaHQtcmFkaXVzLCByYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgrd2lkdGgsIHkrcmFkaXVzKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyY1RvKHgrd2lkdGgsIHksIHgrd2lkdGgtcmFkaXVzLCB5LCByYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgrcmFkaXVzLCB5KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyY1RvKHgsIHksIHgsIHkrcmFkaXVzLCByYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV3IFJlbmRlcmFibGUodGhpcyk7XG4gICAgbmV3IE1vdmVhYmxlKHRoaXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhY21hbjtcbiIsInZhciBvdXRicmsgPSByZXF1aXJlKCcuLi9vdXRicmsvc3JjL291dGJyaycpXG4gICwgTWVzc2FnZUJ1cyA9IHJlcXVpcmUoJy4uL291dGJyay9zcmMvTWVzc2FnZUJ1cycpXG4vLyAgLCBvYmplY3RQb29sID0gcmVxdWlyZSgnLi9vYmplY3RQb29sJylcbiAgLCBCYWxsID0gcmVxdWlyZSgnLi9lbnRpdGllcy9CYWxsJylcbiAgLCBCb3ggPSByZXF1aXJlKCcuL2VudGl0aWVzL0JveCcpXG4gICwgUGFjbWFuID0gcmVxdWlyZSgnLi9lbnRpdGllcy9QYWNtYW4nKVxuO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBtc2didXMgPSBuZXcgTWVzc2FnZUJ1cygpXG4gICAgd2luZG93LmdhbWUgPSBuZXcgb3V0YnJrKHtcbiAgICAgICAgbXNnYnVzOiBtc2didXNcblxuICAgICAgLCBjcmVhdGVQb29sOiBmdW5jdGlvbihwb29sKSB7XG4gICAgICAgICAgICBwb29sLmJhbGwgPSBuZXcgQmFsbCh7IHg6IDAuMTUsIG1zZ2J1czogbXNnYnVzIH0pO1xuICAgICAgICAgICAgcG9vbC5ib3ggPSBuZXcgQm94KHsgbXNnYnVzOiBtc2didXMgfSk7XG4gICAgICAgICAgICBwb29sLnBhY21hbiA9IG5ldyBQYWNtYW4oeyBtc2didXM6IG1zZ2J1cyB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG4iXX0=

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var moverSystem = require('../systems/moverSystem');

function Moveable(entity) {
    this.entity = entity;
    moverSystem.register(this);
}

Moveable.prototype.invoke = function() {
    var entity = this.entity;

    if (!entity.isActive) return;

    this.entity.x += entity.xSpeed;
    this.entity.y += entity.ySpeed;
}

module.exports = Moveable;

},{"../systems/moverSystem":6}],2:[function(require,module,exports){
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

},{"../systems/renderSystem":7}],3:[function(require,module,exports){
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
var Ball = require('./entities/Ball')
  , pool = {}
;

module.exports = {
    get: function(key) {
        return pool[key];
    }

  , create: function() {
        pool.ball = new Ball();
    }
}

},{"./entities/Ball":3}],5:[function(require,module,exports){
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

},{"./objectPool":4,"./systems/moverSystem":6,"./systems/renderSystem":7}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
//var engine = require('../outbrk/dist/lib/outbrk');

var outbrk = require('../../outbrk/src/outbrk')
  , game = new outbrk()
;

window.addEventListener('load', function() {
    console.log('load, using game:', game);
});

},{"../../outbrk/src/outbrk":5}]},{},[8]);

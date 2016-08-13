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

},{"../../outbrk/src/components/Moveable":1,"../../outbrk/src/components/Renderable":2}],9:[function(require,module,exports){
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

},{"../../outbrk/src/components/Moveable":1,"../../outbrk/src/components/Renderable":2}],10:[function(require,module,exports){
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

},{"./entities/Ball":8,"./entities/Box":9}],11:[function(require,module,exports){
var outbrk = require('../outbrk/src/outbrk')
  , objectPool = require('./objectPool')
;

window.addEventListener('load', function() {
    console.log('load');
    window.game = new outbrk({ objectPool: objectPool });
});

},{"../outbrk/src/outbrk":5,"./objectPool":10}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJvdXRicmsvc3JjL2NvbXBvbmVudHMvTW92ZWFibGUuanMiLCJvdXRicmsvc3JjL2NvbXBvbmVudHMvUmVuZGVyYWJsZS5qcyIsIm91dGJyay9zcmMvZW50aXRpZXMvQmFsbC5qcyIsIm91dGJyay9zcmMvb2JqZWN0UG9vbC5qcyIsIm91dGJyay9zcmMvb3V0YnJrLmpzIiwib3V0YnJrL3NyYy9zeXN0ZW1zL21vdmVyU3lzdGVtLmpzIiwib3V0YnJrL3NyYy9zeXN0ZW1zL3JlbmRlclN5c3RlbS5qcyIsInNyYy9lbnRpdGllcy9CYWxsLmpzIiwic3JjL2VudGl0aWVzL0JveC5qcyIsInNyYy9vYmplY3RQb29sLmpzIiwic3JjL3NpbHZlci1jYXJuaXZhbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBtb3ZlclN5c3RlbSA9IHJlcXVpcmUoJy4uL3N5c3RlbXMvbW92ZXJTeXN0ZW0nKTtcblxuZnVuY3Rpb24gTW92ZWFibGUoZW50aXR5KSB7XG4gICAgdGhpcy5lbnRpdHkgPSBlbnRpdHk7XG4gICAgbW92ZXJTeXN0ZW0ucmVnaXN0ZXIodGhpcyk7XG59XG5cbk1vdmVhYmxlLnByb3RvdHlwZS5pbnZva2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZW50aXR5ID0gdGhpcy5lbnRpdHk7XG5cbiAgICBpZiAoIWVudGl0eS5pc0FjdGl2ZSkgcmV0dXJuO1xuXG4gICAgdGhpcy5lbnRpdHkueCArPSBlbnRpdHkueFNwZWVkO1xuICAgIHRoaXMuZW50aXR5LnkgKz0gZW50aXR5LnlTcGVlZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb3ZlYWJsZTtcbiIsInZhciByZW5kZXJTeXN0ZW0gPSByZXF1aXJlKCcuLi9zeXN0ZW1zL3JlbmRlclN5c3RlbScpO1xuXG5mdW5jdGlvbiBSZW5kZXJhYmxlKGVudGl0eSkge1xuICAgIHRoaXMuZW50aXR5ID0gZW50aXR5O1xuICAgIHJlbmRlclN5c3RlbS5yZWdpc3Rlcih0aGlzKTtcbn1cblxuUmVuZGVyYWJsZS5fdHlwZXMgPSB7XG4gICAgcmVjdGFuZ2xlOiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBwcm9qZWN0ZWRYID0gb3B0cy5lbnRpdHkueCAqIG9wdHMudmlld3BvcnQud2lkdGhcbiAgICAgICAgICAsIHByb2plY3RlZFkgPSBvcHRzLmVudGl0eS55ICogb3B0cy52aWV3cG9ydC5oZWlnaHRcbiAgICAgICAgICAsIHByb2plY3RlZFdpZHRoID0gb3B0cy5lbnRpdHkud2lkdGggKiBvcHRzLnZpZXdwb3J0LndpZHRoXG4gICAgICAgICAgLCBwcm9qZWN0ZWRIZWlnaHQgPSBvcHRzLmVudGl0eS5oZWlnaHQgKiBvcHRzLnZpZXdwb3J0LmhlaWdodFxuICAgICAgICA7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmZpbGxSZWN0KHByb2plY3RlZFgsIHByb2plY3RlZFksIHByb2plY3RlZFdpZHRoLCBwcm9qZWN0ZWRIZWlnaHQpO1xuICAgIH1cblxuICAsIGNpcmNsZTogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICB2YXIgcHJvamVjdGVkWCA9IG9wdHMuZW50aXR5LnggKiBvcHRzLnZpZXdwb3J0LndpZHRoXG4gICAgICAgICAgLCBwcm9qZWN0ZWRZID0gb3B0cy5lbnRpdHkueSAqIG9wdHMudmlld3BvcnQuaGVpZ2h0XG4gICAgICAgICAgLCBwcm9qZWN0ZWRSYWRpdXMgPSBvcHRzLmVudGl0eS5yYWRpdXMgKiBvcHRzLnZpZXdwb3J0LndpZHRoXG4gICAgICAgIDtcblxuICAgICAgICBvcHRzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIG9wdHMuY29udGV4dC5hcmMocHJvamVjdGVkWCwgcHJvamVjdGVkWSwgcHJvamVjdGVkUmFkaXVzLCAwLCBNYXRoLlBJICogMik7XG4gICAgICAgIG9wdHMuY29udGV4dC5maWxsKCk7XG4gICAgfVxuXG4gICwgZ2VvbWV0cnk6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgdmFyIGdlb21ldHJ5ID0gb3B0cy5lbnRpdHk7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuXG4gICAgICAgIFtdLmZvckVhY2guY2FsbChnZW9tZXRyeSwgZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgICAgICAgIG9wdHMuY29udGV4dC5saW5lVG8ocG9pbnQueCAqIG9wdHMudmlld3BvcnQud2lkdGgsIHBvaW50LnkgKiBvcHRzLnZpZXdwb3J0LmhlaWdodCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5maWxsKCk7XG4gICAgfVxufTtcblxuUmVuZGVyYWJsZS5fZmlsbFN0eWxlcyA9IHtcbiAgICBjb2xvdXI6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmZpbGxTdHlsZSA9IG9wdHMuZmlsbFN0eWxlLmNvbG91cjtcbiAgICB9XG5cbiAgLCBncmFkaWVudDogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICB2YXIgcHJvamVjdGVkWCA9IG9wdHMuZW50aXR5LnggKiBvcHRzLnZpZXdwb3J0LndpZHRoXG4gICAgICAgICAgLCBwcm9qZWN0ZWRZID0gb3B0cy5lbnRpdHkueSAqIG9wdHMudmlld3BvcnQuaGVpZ2h0XG4gICAgICAgICAgLCBwcm9qZWN0ZWRIZWlnaHQgPSBvcHRzLmVudGl0eS5oZWlnaHQgKiBvcHRzLnZpZXdwb3J0LmhlaWdodFxuICAgICAgICAgICwgZ3JhZGllbnQgPSBvcHRzLmNvbnRleHQuY3JlYXRlTGluZWFyR3JhZGllbnQocHJvamVjdGVkWCwgcHJvamVjdGVkWSwgcHJvamVjdGVkWCwgcHJvamVjdGVkWSArIHByb2plY3RlZEhlaWdodClcbiAgICAgICAgO1xuXG4gICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCBvcHRzLmZpbGxTdHlsZS5maXJzdFN0ZXApO1xuICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgb3B0cy5maWxsU3R5bGUuc2Vjb25kU3RlcCk7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xuICAgIH1cblxuICAsIHBhdHRlcm46IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgdmFyIHBhdHRlcm4gPSBvcHRzLmNvbnRleHQuY3JlYXRlUGF0dGVybihvcHRzLmZpbGxTdHlsZS5zb3VyY2UsICdyZXBlYXQnKTtcblxuICAgICAgICBvcHRzLmNvbnRleHQuZmlsbFN0eWxlID0gcGF0dGVybjtcbiAgICB9XG59O1xuXG5SZW5kZXJhYmxlLl9jbGVhckNvbnRleHQgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICB2YXIgcHJvamVjdGVkWCA9IGVudGl0eS54ICogdmlld3BvcnQud2lkdGhcbiAgICAgICwgcHJvamVjdGVkWSA9IGVudGl0eS55ICogdmlld3BvcnQuaGVpZ2h0XG4gICAgICAsIHByb2plY3RlZFdpZHRoID0gZW50aXR5LndpZHRoICogdmlld3BvcnQud2lkdGhcbiAgICAgICwgcHJvamVjdGVkSGVpZ2h0ID0gZW50aXR5LmhlaWdodCAqIHZpZXdwb3J0LmhlaWdodFxuICAgIDtcblxuICAgIG9wdHMuY29udGV4dC5jbGVhclJlY3QocHJvamVjdGVkWCwgcHJvamVjdGVkWSwgcHJvamVjdGVkV2lkdGgsIHByb2plY3RlZEhlaWdodCk7XG59XG5cblJlbmRlcmFibGUucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uKGNvbnRleHQsIHZpZXdwb3J0KSB7XG4gICAgdmFyIGVudGl0eSA9IHRoaXMuZW50aXR5XG4gICAgICAsIHJlbmRlck9wdHMgPSBlbnRpdHkucmVuZGVyT3B0c1xuICAgIDtcblxuICAgIGlmICghZW50aXR5LmlzQWN0aXZlKSByZXR1cm47XG5cbiAgICBSZW5kZXJhYmxlLl9maWxsU3R5bGVzW3JlbmRlck9wdHMuZmlsbFN0eWxlLnR5cGVdKHtcbiAgICAgICAgZW50aXR5OiBlbnRpdHlcbiAgICAgICwgZmlsbFN0eWxlOiByZW5kZXJPcHRzLmZpbGxTdHlsZVxuICAgICAgLCBjb250ZXh0OiBjb250ZXh0XG4gICAgICAsIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgIH0pO1xuXG4gICAgUmVuZGVyYWJsZS5fdHlwZXNbcmVuZGVyT3B0cy50eXBlXSh7XG4gICAgICAgIGVudGl0eTogZW50aXR5XG4gICAgICAsIGNvbnRleHQ6IGNvbnRleHRcbiAgICAgICwgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyYWJsZTtcbiIsInZhciBSZW5kZXJhYmxlID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9SZW5kZXJhYmxlJylcbiAgLCBNb3ZlYWJsZSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvTW92ZWFibGUnKVxuICAsIHggPSAwLjAwICAgIC8vIHBlcmNlbnRhZ2VzXG4gICwgeSA9IDAuMDBcbiAgLCBTUEVFRCA9IDAuMDA0XG4gICwgUkFESVVTID0gMC4wMlxuO1xuXG5mdW5jdGlvbiBCYWxsKCkge1xuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMucmFkaXVzID0gUkFESVVTO1xuXG4gICAgdGhpcy54U3BlZWQgPSBTUEVFRDtcbiAgICB0aGlzLnlTcGVlZCA9IFNQRUVEO1xuXG4gICAgdGhpcy5yZW5kZXJPcHRzID0ge1xuICAgICAgICB0eXBlOiAnY2lyY2xlJ1xuXG4gICAgICAsIGZpbGxTdHlsZToge1xuICAgICAgICAgICAgdHlwZTogJ2NvbG91cidcbiAgICAgICAgICAsIGNvbG91cjogJ2JsYWNrJ1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV3IFJlbmRlcmFibGUodGhpcyk7XG4gICAgbmV3IE1vdmVhYmxlKHRoaXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhbGw7XG4iLCJ2YXIgQmFsbCA9IHJlcXVpcmUoJy4vZW50aXRpZXMvQmFsbCcpXG4gICwgcG9vbCA9IHt9XG47XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiBwb29sW2tleV07XG4gICAgfVxuXG4gICwgY3JlYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcG9vbC5iYWxsID0gbmV3IEJhbGwoKTtcbiAgICB9XG59XG4iLCJ2YXIgb3V0YnJrID0gZnVuY3Rpb24ob3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgdmFyIG9iamVjdFBvb2wgPSBvcHRzLm9iamVjdFBvb2wgfHwgcmVxdWlyZSgnLi9vYmplY3RQb29sJylcbiAgICAgICwgcmVuZGVyU3lzdGVtID0gcmVxdWlyZSgnLi9zeXN0ZW1zL3JlbmRlclN5c3RlbScpXG4gICAgICAsIG1vdmVyU3lzdGVtID0gcmVxdWlyZSgnLi9zeXN0ZW1zL21vdmVyU3lzdGVtJylcbiAgICAgICwgJCA9IGZ1bmN0aW9uKHNlbCkgeyByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWwpOyB9XG4gICAgICAsICQkID0gZnVuY3Rpb24oc2VsKSB7IHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbCk7IH1cbiAgICAgICwgJGNhbnZhcyA9ICQoJ2NhbnZhcycpXG4gICAgICAsIGN0eDJkID0gJGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXG4gICAgICAsIHZpZXdwb3J0ID0geyB3aWR0aDogJGNhbnZhcy53aWR0aCwgaGVpZ2h0OiAkY2FudmFzLmhlaWdodCB9XG4gICAgO1xuXG4gICAgaWYgKHJlbmRlclN5c3RlbS5pbml0KHsgY29udGV4dDogY3R4MmQsIHZpZXdwb3J0OiB2aWV3cG9ydCB9KSkge1xuICAgICAgICBtb3ZlclN5c3RlbS5pbml0KCk7XG5cbiAgICAgICAgb2JqZWN0UG9vbC5jcmVhdGUoKTtcbiAgICAgICAgd2luZG93Lm9iamVjdFBvb2wgPSBvYmplY3RQb29sO1xuXG4gICAgICAgIGZ1bmN0aW9uIGdhbWVsb29wKCkge1xuICAgICAgICAgICAgY3R4MmQuY2xlYXJSZWN0KDAsIDAsIHZpZXdwb3J0LndpZHRoLCB2aWV3cG9ydC5oZWlnaHQpO1xuICAgICAgICAgICAgbW92ZXJTeXN0ZW0uaW52b2tlKCk7XG4gICAgICAgICAgICByZW5kZXJTeXN0ZW0uaW52b2tlKCk7XG5cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3RpY2snKTtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShnYW1lbG9vcCk7XG4gICAgICAgIH1cblxuICAgICAgICBnYW1lbG9vcCgpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdvdXRicms6IHVuYWJsZSB0byBpbml0aWFsaXplJyk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBvdXRicms7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG5cbiAgICAgICAgY29uc29sZS5sb2coJ21vdmVyU3lzdGVtIGluaXRpYWxpemVkJyk7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcblxuICAgICAgICBjb25zb2xlLmxvZygnbW92ZXJTeXN0ZW06IHJlZ2lzdGVyZWQgY29tcG9uZW50OicsIGNvbXBvbmVudCk7XG4gICAgfSxcblxuICAgIGludm9rZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIFtdLmZvckVhY2guY2FsbCh0aGlzLmNvbXBvbmVudHMsIGZ1bmN0aW9uKGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY29tcG9uZW50Lmludm9rZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0OiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIGlmICghb3B0cyB8fCAhb3B0cy5jb250ZXh0IHx8ICFvcHRzLnZpZXdwb3J0ICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdyZW5kZXIgc3lzdGVtIGZhaWxlZCB0byBpbml0aWFsaXplLCBhIGNvbnRleHQgJiB2aWV3cG9ydCBhcmUgcmVxdWlyZWQnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBvcHRzLmNvbnRleHQ7XG4gICAgICAgIHRoaXMudmlld3BvcnQgPSBvcHRzLnZpZXdwb3J0OyBcblxuICAgICAgICBjb25zb2xlLmxvZygncmVuZGVyU3lzdGVtIGluaXRpYWxpemVkLCB1c2luZyBjb250ZXh0ICYgdmlld3BvcnQ6JywgdGhpcy5jb250ZXh0LCB0aGlzLnZpZXdwb3J0KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcblxuICAgICAgICBjb25zb2xlLmxvZygncmVuZGVyU3lzdGVtOiByZWdpc3RlcmVkIGNvbXBvbmVudDonLCBjb21wb25lbnQpO1xuICAgIH0sXG5cbiAgICBpbnZva2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMuY29udGV4dFxuICAgICAgICAgICwgdmlld3BvcnQgPSB0aGlzLnZpZXdwb3J0XG4gICAgICAgIDtcblxuICAgICAgICBbXS5mb3JFYWNoLmNhbGwodGhpcy5jb21wb25lbnRzLCBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5pbnZva2UoY29udGV4dCwgdmlld3BvcnQpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJ2YXIgUmVuZGVyYWJsZSA9IHJlcXVpcmUoJy4uLy4uL291dGJyay9zcmMvY29tcG9uZW50cy9SZW5kZXJhYmxlJylcbiAgLCBNb3ZlYWJsZSA9IHJlcXVpcmUoJy4uLy4uL291dGJyay9zcmMvY29tcG9uZW50cy9Nb3ZlYWJsZScpXG4gICwgeCA9IDAuMDAgICAgLy8gcGVyY2VudGFnZXNcbiAgLCB5ID0gMC4wMFxuICAsIFNQRUVEID0gMC4wMDRcbiAgLCBSQURJVVMgPSAwLjAyXG47XG5cbmZ1bmN0aW9uIEJhbGwoKSB7XG4gICAgdGhpcy5pc0FjdGl2ZSA9IHRydWU7XG5cbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy5yYWRpdXMgPSBSQURJVVM7XG5cbiAgICB0aGlzLnhTcGVlZCA9IFNQRUVEO1xuICAgIHRoaXMueVNwZWVkID0gU1BFRUQ7XG5cbiAgICB0aGlzLnJlbmRlck9wdHMgPSB7XG4gICAgICAgIHR5cGU6ICdjaXJjbGUnXG5cbiAgICAgICwgZmlsbFN0eWxlOiB7XG4gICAgICAgICAgICB0eXBlOiAnY29sb3VyJ1xuICAgICAgICAgICwgY29sb3VyOiAncmVkJ1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV3IFJlbmRlcmFibGUodGhpcyk7XG4gICAgbmV3IE1vdmVhYmxlKHRoaXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhbGw7XG4iLCJ2YXIgUmVuZGVyYWJsZSA9IHJlcXVpcmUoJy4uLy4uL291dGJyay9zcmMvY29tcG9uZW50cy9SZW5kZXJhYmxlJylcbiAgLCBNb3ZlYWJsZSA9IHJlcXVpcmUoJy4uLy4uL291dGJyay9zcmMvY29tcG9uZW50cy9Nb3ZlYWJsZScpXG4gICwgeCA9IDEuMDAgICAgLy8gcGVyY2VudGFnZXNcbiAgLCB5ID0gMC4wMFxuICAsIFNQRUVEID0gMC4wMDJcbiAgLCBXSURUSCA9IDAuMTI1XG4gICwgSEVJR0hUID0gMC4xMjVcbjtcblxuZnVuY3Rpb24gQm94KCkge1xuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMud2lkdGggPSBXSURUSDtcbiAgICB0aGlzLmhlaWdodCA9IEhFSUdIVDtcblxuICAgIHRoaXMueFNwZWVkID0gLTEgKiBTUEVFRDtcbiAgICB0aGlzLnlTcGVlZCA9IFNQRUVEO1xuXG4gICAgdGhpcy5yZW5kZXJPcHRzID0ge1xuICAgICAgICB0eXBlOiAncmVjdGFuZ2xlJ1xuXG4gICAgICAsIGZpbGxTdHlsZToge1xuICAgICAgICAgICAgdHlwZTogJ2NvbG91cidcbiAgICAgICAgICAsIGNvbG91cjogJ2JsdWUnXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXcgUmVuZGVyYWJsZSh0aGlzKTtcbiAgICBuZXcgTW92ZWFibGUodGhpcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQm94O1xuIiwidmFyIEJhbGwgPSByZXF1aXJlKCcuL2VudGl0aWVzL0JhbGwnKVxuICAsIEJveCA9IHJlcXVpcmUoJy4vZW50aXRpZXMvQm94JylcbiAgLCBwb29sID0ge31cbjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHBvb2xba2V5XTtcbiAgICB9XG5cbiAgLCBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBwb29sLmJhbGwgPSBuZXcgQmFsbCgpO1xuICAgICAgICBwb29sLmJveCA9IG5ldyBCb3goKTtcbiAgICB9XG59XG4iLCJ2YXIgb3V0YnJrID0gcmVxdWlyZSgnLi4vb3V0YnJrL3NyYy9vdXRicmsnKVxuICAsIG9iamVjdFBvb2wgPSByZXF1aXJlKCcuL29iamVjdFBvb2wnKVxuO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdsb2FkJyk7XG4gICAgd2luZG93LmdhbWUgPSBuZXcgb3V0YnJrKHsgb2JqZWN0UG9vbDogb2JqZWN0UG9vbCB9KTtcbn0pO1xuIl19

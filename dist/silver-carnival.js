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
var outbrk = require('../outbrk/src/outbrk');

window.addEventListener('load', function() {
    console.log('load');
    window.game = new outbrk();
});

},{"../outbrk/src/outbrk":5}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJvdXRicmsvc3JjL2NvbXBvbmVudHMvTW92ZWFibGUuanMiLCJvdXRicmsvc3JjL2NvbXBvbmVudHMvUmVuZGVyYWJsZS5qcyIsIm91dGJyay9zcmMvZW50aXRpZXMvQmFsbC5qcyIsIm91dGJyay9zcmMvb2JqZWN0UG9vbC5qcyIsIm91dGJyay9zcmMvb3V0YnJrLmpzIiwib3V0YnJrL3NyYy9zeXN0ZW1zL21vdmVyU3lzdGVtLmpzIiwib3V0YnJrL3NyYy9zeXN0ZW1zL3JlbmRlclN5c3RlbS5qcyIsInNyYy9zaWx2ZXItY2Fybml2YWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgbW92ZXJTeXN0ZW0gPSByZXF1aXJlKCcuLi9zeXN0ZW1zL21vdmVyU3lzdGVtJyk7XG5cbmZ1bmN0aW9uIE1vdmVhYmxlKGVudGl0eSkge1xuICAgIHRoaXMuZW50aXR5ID0gZW50aXR5O1xuICAgIG1vdmVyU3lzdGVtLnJlZ2lzdGVyKHRoaXMpO1xufVxuXG5Nb3ZlYWJsZS5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVudGl0eSA9IHRoaXMuZW50aXR5O1xuXG4gICAgaWYgKCFlbnRpdHkuaXNBY3RpdmUpIHJldHVybjtcblxuICAgIHRoaXMuZW50aXR5LnggKz0gZW50aXR5LnhTcGVlZDtcbiAgICB0aGlzLmVudGl0eS55ICs9IGVudGl0eS55U3BlZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW92ZWFibGU7XG4iLCJ2YXIgcmVuZGVyU3lzdGVtID0gcmVxdWlyZSgnLi4vc3lzdGVtcy9yZW5kZXJTeXN0ZW0nKTtcblxuZnVuY3Rpb24gUmVuZGVyYWJsZShlbnRpdHkpIHtcbiAgICB0aGlzLmVudGl0eSA9IGVudGl0eTtcbiAgICByZW5kZXJTeXN0ZW0ucmVnaXN0ZXIodGhpcyk7XG59XG5cblJlbmRlcmFibGUuX3R5cGVzID0ge1xuICAgIHJlY3RhbmdsZTogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICB2YXIgcHJvamVjdGVkWCA9IG9wdHMuZW50aXR5LnggKiBvcHRzLnZpZXdwb3J0LndpZHRoXG4gICAgICAgICAgLCBwcm9qZWN0ZWRZID0gb3B0cy5lbnRpdHkueSAqIG9wdHMudmlld3BvcnQuaGVpZ2h0XG4gICAgICAgICAgLCBwcm9qZWN0ZWRXaWR0aCA9IG9wdHMuZW50aXR5LndpZHRoICogb3B0cy52aWV3cG9ydC53aWR0aFxuICAgICAgICAgICwgcHJvamVjdGVkSGVpZ2h0ID0gb3B0cy5lbnRpdHkuaGVpZ2h0ICogb3B0cy52aWV3cG9ydC5oZWlnaHRcbiAgICAgICAgO1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5maWxsUmVjdChwcm9qZWN0ZWRYLCBwcm9qZWN0ZWRZLCBwcm9qZWN0ZWRXaWR0aCwgcHJvamVjdGVkSGVpZ2h0KTtcbiAgICB9XG5cbiAgLCBjaXJjbGU6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgdmFyIHByb2plY3RlZFggPSBvcHRzLmVudGl0eS54ICogb3B0cy52aWV3cG9ydC53aWR0aFxuICAgICAgICAgICwgcHJvamVjdGVkWSA9IG9wdHMuZW50aXR5LnkgKiBvcHRzLnZpZXdwb3J0LmhlaWdodFxuICAgICAgICAgICwgcHJvamVjdGVkUmFkaXVzID0gb3B0cy5lbnRpdHkucmFkaXVzICogb3B0cy52aWV3cG9ydC53aWR0aFxuICAgICAgICA7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICBvcHRzLmNvbnRleHQuYXJjKHByb2plY3RlZFgsIHByb2plY3RlZFksIHByb2plY3RlZFJhZGl1cywgMCwgTWF0aC5QSSAqIDIpO1xuICAgICAgICBvcHRzLmNvbnRleHQuZmlsbCgpO1xuICAgIH1cblxuICAsIGdlb21ldHJ5OiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBnZW9tZXRyeSA9IG9wdHMuZW50aXR5O1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5iZWdpblBhdGgoKTtcblxuICAgICAgICBbXS5mb3JFYWNoLmNhbGwoZ2VvbWV0cnksIGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICAgICAgICBvcHRzLmNvbnRleHQubGluZVRvKHBvaW50LnggKiBvcHRzLnZpZXdwb3J0LndpZHRoLCBwb2ludC55ICogb3B0cy52aWV3cG9ydC5oZWlnaHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBvcHRzLmNvbnRleHQuZmlsbCgpO1xuICAgIH1cbn07XG5cblJlbmRlcmFibGUuX2ZpbGxTdHlsZXMgPSB7XG4gICAgY29sb3VyOiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5maWxsU3R5bGUgPSBvcHRzLmZpbGxTdHlsZS5jb2xvdXI7XG4gICAgfVxuXG4gICwgZ3JhZGllbnQ6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgdmFyIHByb2plY3RlZFggPSBvcHRzLmVudGl0eS54ICogb3B0cy52aWV3cG9ydC53aWR0aFxuICAgICAgICAgICwgcHJvamVjdGVkWSA9IG9wdHMuZW50aXR5LnkgKiBvcHRzLnZpZXdwb3J0LmhlaWdodFxuICAgICAgICAgICwgcHJvamVjdGVkSGVpZ2h0ID0gb3B0cy5lbnRpdHkuaGVpZ2h0ICogb3B0cy52aWV3cG9ydC5oZWlnaHRcbiAgICAgICAgICAsIGdyYWRpZW50ID0gb3B0cy5jb250ZXh0LmNyZWF0ZUxpbmVhckdyYWRpZW50KHByb2plY3RlZFgsIHByb2plY3RlZFksIHByb2plY3RlZFgsIHByb2plY3RlZFkgKyBwcm9qZWN0ZWRIZWlnaHQpXG4gICAgICAgIDtcblxuICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgb3B0cy5maWxsU3R5bGUuZmlyc3RTdGVwKTtcbiAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsIG9wdHMuZmlsbFN0eWxlLnNlY29uZFN0ZXApO1xuXG4gICAgICAgIG9wdHMuY29udGV4dC5maWxsU3R5bGUgPSBncmFkaWVudDtcbiAgICB9XG5cbiAgLCBwYXR0ZXJuOiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBwYXR0ZXJuID0gb3B0cy5jb250ZXh0LmNyZWF0ZVBhdHRlcm4ob3B0cy5maWxsU3R5bGUuc291cmNlLCAncmVwZWF0Jyk7XG5cbiAgICAgICAgb3B0cy5jb250ZXh0LmZpbGxTdHlsZSA9IHBhdHRlcm47XG4gICAgfVxufTtcblxuUmVuZGVyYWJsZS5fY2xlYXJDb250ZXh0ID0gZnVuY3Rpb24ob3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgdmFyIHByb2plY3RlZFggPSBlbnRpdHkueCAqIHZpZXdwb3J0LndpZHRoXG4gICAgICAsIHByb2plY3RlZFkgPSBlbnRpdHkueSAqIHZpZXdwb3J0LmhlaWdodFxuICAgICAgLCBwcm9qZWN0ZWRXaWR0aCA9IGVudGl0eS53aWR0aCAqIHZpZXdwb3J0LndpZHRoXG4gICAgICAsIHByb2plY3RlZEhlaWdodCA9IGVudGl0eS5oZWlnaHQgKiB2aWV3cG9ydC5oZWlnaHRcbiAgICA7XG5cbiAgICBvcHRzLmNvbnRleHQuY2xlYXJSZWN0KHByb2plY3RlZFgsIHByb2plY3RlZFksIHByb2plY3RlZFdpZHRoLCBwcm9qZWN0ZWRIZWlnaHQpO1xufVxuXG5SZW5kZXJhYmxlLnByb3RvdHlwZS5pbnZva2UgPSBmdW5jdGlvbihjb250ZXh0LCB2aWV3cG9ydCkge1xuICAgIHZhciBlbnRpdHkgPSB0aGlzLmVudGl0eVxuICAgICAgLCByZW5kZXJPcHRzID0gZW50aXR5LnJlbmRlck9wdHNcbiAgICA7XG5cbiAgICBpZiAoIWVudGl0eS5pc0FjdGl2ZSkgcmV0dXJuO1xuXG4gICAgUmVuZGVyYWJsZS5fZmlsbFN0eWxlc1tyZW5kZXJPcHRzLmZpbGxTdHlsZS50eXBlXSh7XG4gICAgICAgIGVudGl0eTogZW50aXR5XG4gICAgICAsIGZpbGxTdHlsZTogcmVuZGVyT3B0cy5maWxsU3R5bGVcbiAgICAgICwgY29udGV4dDogY29udGV4dFxuICAgICAgLCB2aWV3cG9ydDogdmlld3BvcnRcbiAgICB9KTtcblxuICAgIFJlbmRlcmFibGUuX3R5cGVzW3JlbmRlck9wdHMudHlwZV0oe1xuICAgICAgICBlbnRpdHk6IGVudGl0eVxuICAgICAgLCBjb250ZXh0OiBjb250ZXh0XG4gICAgICAsIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmFibGU7XG4iLCJ2YXIgUmVuZGVyYWJsZSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvUmVuZGVyYWJsZScpXG4gICwgTW92ZWFibGUgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL01vdmVhYmxlJylcbiAgLCB4ID0gMC4wMCAgICAvLyBwZXJjZW50YWdlc1xuICAsIHkgPSAwLjAwXG4gICwgU1BFRUQgPSAwLjAwNFxuICAsIFJBRElVUyA9IDAuMDJcbjtcblxuZnVuY3Rpb24gQmFsbCgpIHtcbiAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnJhZGl1cyA9IFJBRElVUztcblxuICAgIHRoaXMueFNwZWVkID0gU1BFRUQ7XG4gICAgdGhpcy55U3BlZWQgPSBTUEVFRDtcblxuICAgIHRoaXMucmVuZGVyT3B0cyA9IHtcbiAgICAgICAgdHlwZTogJ2NpcmNsZSdcblxuICAgICAgLCBmaWxsU3R5bGU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdjb2xvdXInXG4gICAgICAgICAgLCBjb2xvdXI6ICdibGFjaydcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ldyBSZW5kZXJhYmxlKHRoaXMpO1xuICAgIG5ldyBNb3ZlYWJsZSh0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCYWxsO1xuIiwidmFyIEJhbGwgPSByZXF1aXJlKCcuL2VudGl0aWVzL0JhbGwnKVxuICAsIHBvb2wgPSB7fVxuO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gcG9vbFtrZXldO1xuICAgIH1cblxuICAsIGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHBvb2wuYmFsbCA9IG5ldyBCYWxsKCk7XG4gICAgfVxufVxuIiwidmFyIG91dGJyayA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgIHZhciBvYmplY3RQb29sID0gb3B0cy5vYmplY3RQb29sIHx8IHJlcXVpcmUoJy4vb2JqZWN0UG9vbCcpXG4gICAgICAsIHJlbmRlclN5c3RlbSA9IHJlcXVpcmUoJy4vc3lzdGVtcy9yZW5kZXJTeXN0ZW0nKVxuICAgICAgLCBtb3ZlclN5c3RlbSA9IHJlcXVpcmUoJy4vc3lzdGVtcy9tb3ZlclN5c3RlbScpXG4gICAgICAsICQgPSBmdW5jdGlvbihzZWwpIHsgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsKTsgfVxuICAgICAgLCAkJCA9IGZ1bmN0aW9uKHNlbCkgeyByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWwpOyB9XG4gICAgICAsICRjYW52YXMgPSAkKCdjYW52YXMnKVxuICAgICAgLCBjdHgyZCA9ICRjYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgICAgLCB2aWV3cG9ydCA9IHsgd2lkdGg6ICRjYW52YXMud2lkdGgsIGhlaWdodDogJGNhbnZhcy5oZWlnaHQgfVxuICAgIDtcblxuICAgIGlmIChyZW5kZXJTeXN0ZW0uaW5pdCh7IGNvbnRleHQ6IGN0eDJkLCB2aWV3cG9ydDogdmlld3BvcnQgfSkpIHtcbiAgICAgICAgbW92ZXJTeXN0ZW0uaW5pdCgpO1xuXG4gICAgICAgIG9iamVjdFBvb2wuY3JlYXRlKCk7XG4gICAgICAgIHdpbmRvdy5vYmplY3RQb29sID0gb2JqZWN0UG9vbDtcblxuICAgICAgICBmdW5jdGlvbiBnYW1lbG9vcCgpIHtcbiAgICAgICAgICAgIGN0eDJkLmNsZWFyUmVjdCgwLCAwLCB2aWV3cG9ydC53aWR0aCwgdmlld3BvcnQuaGVpZ2h0KTtcbiAgICAgICAgICAgIG1vdmVyU3lzdGVtLmludm9rZSgpO1xuICAgICAgICAgICAgcmVuZGVyU3lzdGVtLmludm9rZSgpO1xuXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd0aWNrJyk7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZ2FtZWxvb3ApO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2FtZWxvb3AoKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2Fybignb3V0YnJrOiB1bmFibGUgdG8gaW5pdGlhbGl6ZScpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gb3V0YnJrO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCdtb3ZlclN5c3RlbSBpbml0aWFsaXplZCcpO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ21vdmVyU3lzdGVtOiByZWdpc3RlcmVkIGNvbXBvbmVudDonLCBjb21wb25lbnQpO1xuICAgIH0sXG5cbiAgICBpbnZva2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBbXS5mb3JFYWNoLmNhbGwodGhpcy5jb21wb25lbnRzLCBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5pbnZva2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5pdDogZnVuY3Rpb24ob3B0cykge1xuICAgICAgICBpZiAoIW9wdHMgfHwgIW9wdHMuY29udGV4dCB8fCAhb3B0cy52aWV3cG9ydCApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigncmVuZGVyIHN5c3RlbSBmYWlsZWQgdG8gaW5pdGlhbGl6ZSwgYSBjb250ZXh0ICYgdmlld3BvcnQgYXJlIHJlcXVpcmVkJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gb3B0cy5jb250ZXh0O1xuICAgICAgICB0aGlzLnZpZXdwb3J0ID0gb3B0cy52aWV3cG9ydDsgXG5cbiAgICAgICAgY29uc29sZS5sb2coJ3JlbmRlclN5c3RlbSBpbml0aWFsaXplZCwgdXNpbmcgY29udGV4dCAmIHZpZXdwb3J0OicsIHRoaXMuY29udGV4dCwgdGhpcy52aWV3cG9ydCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ3JlbmRlclN5c3RlbTogcmVnaXN0ZXJlZCBjb21wb25lbnQ6JywgY29tcG9uZW50KTtcbiAgICB9LFxuXG4gICAgaW52b2tlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHRcbiAgICAgICAgICAsIHZpZXdwb3J0ID0gdGhpcy52aWV3cG9ydFxuICAgICAgICA7XG5cbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKHRoaXMuY29tcG9uZW50cywgZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjb21wb25lbnQuaW52b2tlKGNvbnRleHQsIHZpZXdwb3J0KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwidmFyIG91dGJyayA9IHJlcXVpcmUoJy4uL291dGJyay9zcmMvb3V0YnJrJyk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2xvYWQnKTtcbiAgICB3aW5kb3cuZ2FtZSA9IG5ldyBvdXRicmsoKTtcbn0pO1xuIl19

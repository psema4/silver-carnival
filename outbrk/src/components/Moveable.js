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

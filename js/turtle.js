
var Turtle2D = function() {
	this.pos = {x:0,y:0};
	this.history = [];
	this._mark = false;
}

Turtle2D.prototype.reverse = function() {
	this.history.reverse();
	this.pos = this.history[this.history.length-1];
}

Turtle2D.prototype.setPos = function(x,y) {
	this.pos = {'x':x, 'y':y};
}

Turtle2D.prototype.abs = function(x,y,mark) {
	this.setPos(x,y);
	if(this._mark || mark) {
		this.pos.mark = true;
	}
	if(this.history.length > 0) {
		var p = this.history[this.history.length-1];
		if(p.x != x || p.y != y) {
			this.history.push(this.pos);
		}
	} else {		
		this.history.push(this.pos);
	}
}

Turtle2D.prototype.rel = function(dx, dy) {
	this.abs(this.pos.x + dx, this.pos.y + dy);
}


Turtle2D.prototype.translate = function(dx, dy) {
	var dx = dx || 0.0;
	var dy = dy || 0.0;
	for(var i=0; i<this.history.length; i++) {
		this.history[i].x += dx;
		this.history[i].y += dy;
	}
}

Turtle2D.prototype.pivot = function(cx,cy, angle) {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	for(var i=0; i<this.history.length; i++) {
		var p = this.history[i];
		p.x -= cx;
		p.y -= cy;
		var nx = (p.x*c - p.y*s);
		var ny = (p.x*s + p.y*c);
		p.x = nx + cx;
		p.y = ny + cy;
	}
}

Turtle2D.prototype.xmirror = function(x) {
	var x = x || 0;
	for(var i=0; i<this.history.length; i++) {
		var p = this.history[i];
		p.x = -(p.x - x) + x;
	}	
}

Turtle2D.prototype.ymirror = function(y) {
	var y = y || 0;
	for(var i=0; i<this.history.length; i++) {
		var p = this.history[i];
		p.y = -(p.y - y) + y;
	}	
}

Turtle2D.prototype.pretty = function(precision) {
	retval = [];
	precision = precision || 3;

	for(var i=0; i<this.history.length; i++) {
		p = this.history[i];
		retval.push('<p>' + p.x.toFixed(precision) + ',' + p.y.toFixed(precision) + '</p>');
	}
	return retval.join('');
}

Turtle2D.prototype.ltrim = function(count) {
	this.history.splice(0, count);
}

Turtle2D.prototype.rtrim = function(count) {
	this.history.splice(-count, count);
	this.pos = this.history[this.history.length-1];
}

Turtle2D.prototype.trim = function(count) {
	this.ltrim(count);
	this.rtrim(count);
}

Turtle2D.prototype.mark = function() {
	this._mark = true;
}

Turtle2D.prototype.unmark = function() {
	this._mark = false;
}

Turtle2D.prototype.start = function() {
	return this.history[0];
}

Turtle2D.prototype.end = function() {
	return this.history[this.history.length-1];
}

Turtle2D.prototype.bounds = function() {
	var retval = {xmin : this.pos.x, xmax : this.pos.x, ymin : this.pos.y, ymax : this.pos.y}
	for(var i=0; i<this.history.length; i++) {
		p = this.history[i];
		retval.xmax = Math.max(p.x, retval.xmax);
		retval.xmin = Math.min(p.x, retval.xmin);
		retval.ymax = Math.max(p.y, retval.ymax);
		retval.ymin = Math.min(p.y, retval.ymin);
	}
	return retval;
}

Turtle2D.prototype.translateToOrigin = function() {
	var b = this.bounds();
	this.translate(-b.xmin, -b.ymin)
}

Turtle2D.prototype.extend = function(t) {
	for(var i=0; i<t.history.length; i++) {
		this.abs(t.history[i].x, t.history[i].y, t.history[i].mark);
	}
}
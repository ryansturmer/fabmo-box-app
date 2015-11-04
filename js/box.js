GENDER_MALE = 0;
GENDER_FEMALE = 1;

DIRECTION_HORIZ = 0;
DIRECTION_VERT = 1;

EPS = 0.0001;

var Turtle2D = function() {
	this.pos = {x:0,y:0};
	this.history = [];
}

Turtle2D.prototype.reverse = function() {
	this.history.reverse();
	this.pos = this.history[this.history.length-1];
}

Turtle2D.prototype.setPos = function(x,y) {
	this.pos = {'x':x, 'y':y};
}

Turtle2D.prototype.abs = function(x,y) {
	if((this.pos.x != x) || (this.pos.y != y)) {
		this.setPos(x,y);
		this.history.push(this.pos);
	}
}

Turtle2D.prototype.rel = function(dx, dy) {
	this.abs(this.pos.x + dx, this.pos.y + dy);
}

Turtle2D.prototype.translate = function(dx, dy) {
	var dx = dx || 0.0;
	var dy = dy || 0.0;
	for(var i in this.history) {
		this.history[i].x += dx;
		this.history[i].y += dy;
	}
}

Turtle2D.prototype.pivot = function(cx,cy, angle) {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	for(var i in this.history) {
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
	for(var i in this.history) {
		var p = this.history[i];
		p.x = -(p.x - x) + x;
	}	
}

Turtle2D.prototype.ymirror = function(y) {
	var y = y || 0;
	for(var i in this.history) {
		var p = this.history[i];
		p.y = -(p.y - y) + y;
	}	
}

Turtle2D.prototype.pretty = function(precision) {
	retval = [];
	precision = precision || 3;

	for(i in this.history) {
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

Turtle2D.prototype.bounds = function() {
	retval = {xmin : this.pos.x, xmax : this.pos.x, ymin : this.pos.y, ymax : this.pos.y}
	for(i in this.history) {
		p = this.history[i];
		retval.xmax = Math.max(p.x, retval.xmax);
		retval.xmin = Math.min(p.x, retval.xmin);
		retval.ymax = Math.max(p.y, retval.ymax);
		retval.ymin = Math.min(p.y, retval.ymin);
	}
	return retval;
}

var makeBoxEdge = function(width, tabs, gender, thickness, bitDiameter) {
	var segments = tabs*2;
	var gender = gender ? -1.0 : 1.0;
	var segLength = width/segments;
	var bitRadius = bitDiameter/2.0;

	if(segLength < bitDiameter) {
		throw new Error("Cannot do this many tabs.  Pocket width (" + segLength.toFixed(3) + ") is less than the bit diameter (" + bitDiameter.toFixed(3) + ").")
	}

	var t = new Turtle2D();
	t.setPos(-bitRadius/2.0, gender > 0 ? thickness + bitRadius : bitRadius);

	var pol = -gender;
	for(var i=0; i<segments+1; i++) {
		t.abs(segLength*i - pol*bitRadius, t.pos.y);
		t.rel(0, pol*thickness);
		if((i%1) === 0) { pol *= -1; }
	}
	t.ltrim(1);
	t.rtrim(1);
	return t
}

var dist = function(a, b) {
	return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}

var makeBoxSide = function(length, width, tabs, gender, thickness, bitDiameter) {
	edge1 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter);
	edge1.pivot(0,0,Math.PI/2.0);
	
	edge2 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter);
	edge2.pivot(0,0,Math.PI/2.0);
	edge2.xmirror(0);
	edge2.translate(length-2*thickness, 0);
	edge2.reverse();

	box = new Turtle2D();

	for(i in edge1.history) {
		p = edge1.history[i];
		box.abs(p.x,p.y);
	}

	for(i in edge2.history) {
		p = edge2.history[i];
		box.abs(p.x,p.y);
	}

	start = edge1.history[0];
	box.abs(start.x, start.y)

	return box;
}

var GCodeGenerator = function(options) {
	this.setOptions(options);
}

GCodeGenerator.prototype.setOptions = function(options) {
	this.feedRate = options.feedRate || this.feedRate || 60.0;
	this.plungeRate = options.plungeRate || this.plungeRate || 15.0;
	this.safeZ = options.safeZ || this.safeZ || 0.5;
	this.bitDiameter = options.bitDiameter || this.bitDiameter || 0.25;
}

var generateGCodeList = function(turtle, totalDepth, depthPerPass, feedRate, plungeRate, safeZ) {
	retval = [];
	var plungeRate = plungeRate.toFixed(2);
	var feedRate = feedRate.toFixed(2);

	var start = turtle.history[0];
	var end = turtle.history[turtle.history.length-1];

	// 
	var loop = false;
	if(dist(start, end) < EPS) {
		var loop = true;
	}

	// Pullup
	retval.push('G0 Z' + safeZ.toFixed(3));
	
	// Move to position
	retval.push('G0 X' + turtle.history[0].x.toFixed(5) + ' Y' + turtle.history[0].y.toFixed(5));

	var depth = Math.max(totalDepth, -depthPerPass);
	var pass = 1;
	while(1) {
		// Plunge
		retval.push('(Plunge)');
		retval.push('G1 Z' + depth.toFixed(5) + 'F' + plungeRate);

		// Cut contour
		retval.push('(Cut contour pass ' + pass + ')');
		for(i in turtle.history) {
			p = turtle.history[i];
			retval.push('G1 X' + p.x.toFixed(5) + ' Y' + p.y.toFixed(5) + ' F' + feedRate);
		}

		if(depth <= totalDepth) {
			break;
		}

		pass += 1;
		depth = Math.max(totalDepth, depth-depthPerPass);

		// Pull-up and rapid to start if this contour is not a loop
		if(!loop) {
			retval.push('(Pull up and rapid to start)');
			retval.push('G0 Z' + safeZ.toFixed(3));	
			retval.push('G0 X' + turtle.history[0].x.toFixed(5) + ' Y' + turtle.history[0].toFixed(5));			
		}
	}

	// Pullup
	retval.push('G0 Z' + safeZ.toFixed(3));
	return retval;
}


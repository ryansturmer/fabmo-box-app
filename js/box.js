GENDER_MALE = 0;
GENDER_FEMALE = 1;

DIRECTION_HORIZ = 0;
DIRECTION_VERT = 1;

EPS = 0.0001;

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

Turtle2D.prototype.mark = function() {
	this._mark = true;
}

Turtle2D.prototype.unmark = function() {
	this._mark = false;
}

Turtle2D.prototype.bounds = function() {
	var retval = {xmin : this.pos.x, xmax : this.pos.x, ymin : this.pos.y, ymax : this.pos.y}
	for(i in this.history) {
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

var makeSlot = function(width, length, bitDiameter, dogbone) {
	t = new Turtle2D();
	var actualWidth = width - bitDiameter;
	var actualLength = length;
	var bitRadius = bitDiameter/2.0;
	var dogBone = Math.sqrt(bitRadius*bitRadius/2.0)/2.0;

	var bitRadius = bitDiameter/2.0;
	t.abs(-actualWidth/2.0, -bitRadius);
	
	// Up
	t.rel(0,actualLength);
	
	// Dogbone
	if(dogbone) {
		t.rel(-dogBone, dogBone);
		t.rel(dogBone, -dogBone);
	}

	// Over
	t.rel(actualWidth,0);

 	// Dogbone
	if(dogbone) {
		t.rel(dogBone, dogBone);
		t.rel(-dogBone, -dogBone);		
	}

	// Down
	t.rel(0,-actualLength);

	return t;
}

var makeBoxEdge = function(width, tabs, gender, thickness, bitDiameter, dogbone) {
	
	var segments = (tabs*2)-1
	var segLength = width/segments;
	var bitRadius = bitDiameter/2.0;
	var dogBone = Math.sqrt(bitRadius*bitRadius/2.0)/2.0;

	if(gender == GENDER_MALE) {
		var slots = tabs-1;
		var loc = segLength*1.5;
	} else {
		var slots = tabs;
		tabs = slots-1;
		var loc = segLength*0.5;
	}

	if(segLength < bitDiameter) {
		throw new Error("Cannot do this many tabs.  Pocket width (" + segLength.toFixed(3) + ") is less than the bit diameter (" + bitDiameter.toFixed(3) + ").")
	}

	retval = new Turtle2D();

	// Cut the slots
	for(var i=0; i<slots; i++) {
		slot = makeSlot(segLength, thickness, bitDiameter, dogbone);
		slot.translate(loc, 0);
		retval.extend(slot);
		loc += 2*segLength;
	}

	if(gender === GENDER_MALE) {
		retval.rel(segLength+bitDiameter, 0);
		retval.reverse();
		retval.rel(-segLength-bitDiameter, 0);
		retval.reverse();
	} else {
		retval.trim(3);
		retval.rel(bitDiameter, 0);
		retval.reverse();
		retval.rel(-bitDiameter, 0);
		retval.reverse()
	}
	retval.translateToOrigin();
	return retval;
}

var dist = function(a, b) {
	return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}

var midpoint = function(a, b) {
	return {x : a.x + ((b.x-a.x)/2.0), y : a.y + ((b.y - a.y)/2.0)}
}

var makeBoxSide = function(length, width, tabs, gender, thickness, bitDiameter, tabWidth) {
	var dx = length-2*thickness;

	edge1 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, true);
	console.log(edge1.history.length);
	edge1.pivot(0,0,Math.PI/2.0);
	console.log(edge1.history.length);

	edge1.xmirror(0);
	console.log(edge1.history.length);
	
	edge2 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, true);
	console.log(edge2.history.length)
	edge2.pivot(0,0,Math.PI/2.0);
	edge2.translate(length+bitDiameter, 0);
	edge2.reverse();
	console.log(edge2.history.length)

	box = new Turtle2D();
	box.abs(edge1.history[0].x, edge1.history[0].y)

	console.log(edge1.history.length)
	box.extend(edge1);
	console.log(box.history.length)

	box.rel(dx/2.0 - tabWidth/2.0 - bitDiameter/2.0, 0);
	box.mark();
	box.rel(tabWidth, 0);
	box.unmark();


	box.extend(edge2);

	box.rel(-(dx/2.0 - tabWidth/2.0 - bitDiameter/2.0), 0);
	box.mark();
	box.rel(-tabWidth, 0);
	box.unmark();

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

var generateGCodeList = function(turtle, totalDepth, depthPerPass, feedRate, plungeRate, safeZ, tabThickness) {
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

	// Spindle on
	retval.push('M4');
	retval.push('G4 P3.0');

	var depth = Math.max(totalDepth, -depthPerPass);
	var pass = 1;
	var tabDepth = totalDepth + tabThickness;

	while(1) {
		// Plunge
		retval.push('(Plunge)');
		retval.push('G1 Z' + depth.toFixed(5) + 'F' + plungeRate);

		// Cut contour
		retval.push('(Cut contour pass ' + pass + ')');
		var cutting_tab = false;
		for(i in turtle.history) {
			p = turtle.history[i];
			if(p.mark && !cutting_tab) {
				cutting_tab = true;
				if(depth < tabDepth) {
					retval.push('G1 Z' + tabDepth.toFixed(5) + ' F' + plungeRate);
				}
			}
			if(cutting_tab && !p.mark) {
				cutting_tab = false;
				if(depth < tabDepth) {
					retval.push('G1 Z' + depth + ' F' + plungeRate);
				}				
			}
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
			retval.push('G0 X' + turtle.history[0].x.toFixed(5) + ' Y' + turtle.history[0].y.toFixed(5));			
		}
	}

	// Pullup
	retval.push('G0 Z' + safeZ.toFixed(3));
	retval.push('(Spindle off)');
	retval.push('M8');
	retval.push('');
	retval.push('(Go Home)');
	retval.push('G0 X0 Y0 Z0');
	retval.push('');
	retval.push('(End Program)');
	retval.push('M30');
	return retval;
}


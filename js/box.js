GENDER_MALE = 0;
GENDER_FEMALE = 1;

DIRECTION_HORIZ = 0;
DIRECTION_VERT = 1;

EPS = 0.0001;

Array.prototype.extend = function (other_array) {
    other_array.forEach(function(v) {this.push(v)}, this);    
}

var equals = function(a,b) {
	return Math.abs(a-b) < EPS;
}

var makePocket = function(startX, startY, xLength, yLength, bitDiameter) {
	var height = yLength;
	var width = xLength;
	var bitRadius = bitDiameter/2.0;

	if(bitDiameter > height || bitDiameter > width) {
		throw new Error("Slot too narrow/short to cut with a " + bitDiameter.toFixed(3) + " bit.")
	}

	ybot = startY + bitRadius;
	ytop = startY + yLength-bitRadius;
	xleft = startX + bitRadius;
	xright = startX + xLength-bitRadius;

	ymid = startY + yLength/2.0;
	xmid = startX + xLength/2.0;

	t = new Turtle2D();

	t.setPos(xleft,ybot);
	t.rel(0,0)

	var last_time = false;
	while(true) {
		if(Math.abs(xleft-xright) <= bitDiameter) {last_time = true;}
		if(Math.abs(ytop-ybot) <= bitDiameter) {last_time = true;}
		
		t.abs(xright,ybot);
		ybot = Math.min(ybot + bitDiameter, startY + yLength-bitRadius);
		if(ybot > ytop) {
			ybot = ytop;
		}
		t.abs(xright,ytop);
		xright = Math.max(xright - bitDiameter, startX + bitRadius);		
		t.abs(xleft,ytop);
		ytop = Math.max(ytop - bitDiameter, startY + bitRadius);
		if(ytop < ybot) {
			ytop =  ybot;
		}
		t.abs(xleft,ybot);
		xleft = Math.min(xleft + bitDiameter, startX + xLength-bitRadius);

		if(last_time) { break;}
	} 
	t.abs(t.history[0].x, t.pos.y)
	t.abs(t.history[0].x, t.history[0].y)

	return t;
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
		throw new Error("Cannot do this many fingers.  Pocket width (" + segLength.toFixed(3) + ") is less than the bit diameter (" + bitDiameter.toFixed(3) + ").")
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
	return retval;
}

var dist = function(a, b) {
	return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}

var midpoint = function(a, b) {
	return {x : a.x + ((b.x-a.x)/2.0), y : a.y + ((b.y - a.y)/2.0)}
}

var makeBoxSide = function(length, width, tabs, gender, thickness, bitDiameter, tabWidth) {
	if((thickness) >= (length/2-bitDiameter)) {
		throw new Error("Material thickness is too large (or box size is too small) to make this box");
	}
	if(thickness <= 0) {
		throw new Error("Material thickness must be > 0!")
	}

	var dx = length-2*thickness;

	edge1 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, true);
	edge1.pivot(0,0,Math.PI/2.0);

	edge1.xmirror(0);
	
	edge2 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, true);
	edge2.pivot(0,0,Math.PI/2.0);
	edge2.translate(length+bitDiameter, 0);
	edge2.reverse();

	box = new Turtle2D();
	box.abs(edge1.history[0].x, edge1.history[0].y)

	box.extend(edge1);

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

	//box.translate(-bitDiameter/2, -bitDiameter/2)
	return box;
}

var makeGCodeSetup = function(safeZ) {
	retval = [];
	retval.push('(US Customary Units)')
	retval.push('G20');
	retval.push('(Absolute positioning)')
	retval.push('G90');
	retval.push('G0 Z' + safeZ.toFixed(3));
	retval.push('(Spindle on and wait for spin-up)')
	retval.push('M4');
	retval.push('G4 P3');
	return retval
}

var makeGCodeTeardown = function(safeZ) {
	retval = [];
	retval.push('(Pull out of material)')
	retval.push('G0 Z' + safeZ.toFixed(3));
	retval.push('(Spindle off and go home)')
	retval.push('M8');
	retval.push('G0 X0 Y0');
	retval.push('(End Program)');
	retval.push('M30');
	return retval;
}

var makeGCodeFromTurtle = function(turtle, totalDepth, depthPerPass, feedRate, plungeRate, safeZ, tabThickness) {
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
	var tabDepth = totalDepth + tabThickness;

	while(1) {
		// Plunge
		retval.push('(Plunge)');
		retva.push('G0Z0'); // Rapid to surface of material, since plunges are generally slow
		retval.push('G1 Z' + depth.toFixed(5) + 'F' + plungeRate);

		// Cut contour
		retval.push('(Cut contour pass ' + pass + ')');
		var cutting_tab = false;
		for(var i=0; i<turtle.history.length; i++) {
			p = turtle.history[i];

			// Pull up if we hit a tab
			if(p.mark && !cutting_tab) {
				cutting_tab = true;
				if(depth < tabDepth) {
					retval.push('G0 Z' + tabDepth.toFixed(5)); // Rapid because we're pulling out of the material
				}
			}

			// Plunge back to depth if we're done with a tab
			if(cutting_tab && !p.mark) {
				cutting_tab = false;
				if(depth < tabDepth) {
					retval.push('G0 Z' + depth + ' F' + plungeRate); // Plunge rate because we're plunging
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

	return retval;
}


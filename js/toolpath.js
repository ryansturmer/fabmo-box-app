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

var makeRectangle = function(width, height, bitDiameter, tabWidth) {
	t = new Turtle2D();

	var bitRadius = bitDiameter/2.0;
	t.setPos(-bitRadius, -bitRadius);
	t.rel(0,0);

	var w = ((width + bitDiameter)/2.0) - tabWidth/2 - bitDiameter/2;
	var h = ((height + bitDiameter)/2.0) - tabWidth/2 - bitDiameter/2;

	t.rel(w, 0);
	t.mark();
	t.rel(tabWidth + bitDiameter, 0)
	t.unmark();
	t.rel(w,0);

	t.rel(0, h);
	t.mark();
	t.rel(0, tabWidth + bitDiameter)
	t.unmark();
	t.rel(0,h);

	t.rel(-w, 0);
	t.mark();
	t.rel(-(tabWidth + bitDiameter), 0)
	t.unmark();
	t.rel(-w,0);

	t.rel(0, -h);
	t.mark();
	t.rel(0, -(tabWidth + bitDiameter))
	t.unmark();
	t.rel(0,-h);

	return t;
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

var makeSlot = function(width, length, bitDiameter, fitAllowance, dogbone) {
	t = new Turtle2D();
	var actualWidth = width - bitDiameter;
	var actualLength = length;
	var bitRadius = bitDiameter/2.0;
	var dogBone = Math.sqrt(bitRadius*bitRadius/2.0)/2.0;

	var bitRadius = bitDiameter/2.0;
	t.abs(-actualWidth/2.0 - fitAllowance/2.0, -bitRadius);
	
	// Up
	t.rel(0,actualLength);
	
	// Dogbone
	if(dogbone) {
		t.rel(-dogBone, dogBone);
		t.rel(dogBone, -dogBone);
	}

	// Over
	t.rel(actualWidth + fitAllowance,0);

 	// Dogbone
	if(dogbone) {
		t.rel(dogBone, dogBone);
		t.rel(-dogBone, -dogBone);		
	}

	// Down
	t.rel(0,-actualLength);

	return t;
}

var makeBoxEdge = function(width, tabs, gender, thickness, bitDiameter, fitAllowance, dogbone) {
	
	var segments = (tabs*2)-1
	var segLength = width/segments;
	var bitRadius = bitDiameter/2.0;
	var dogBone = Math.sqrt(bitRadius*bitRadius/2.0)/2.0;

	if(gender == GENDER_MALE) {
		var slots = tabs-1;
		var loc = segLength*1.5;
		fitAllowance = 0;
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
		slot = makeSlot(segLength + fitAllowance, thickness, bitDiameter, fitAllowance, dogbone);
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
		retval.rel((bitDiameter-fitAllowance), 0);
		retval.reverse();
		retval.rel(-(bitDiameter-fitAllowance), 0);
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

var makeBoxToplessSide = function(length, width, tabs, gender, thickness, bitDiameter, tabWidth, fitAllowance, isFront) {
	if((thickness) >= (length/2-bitDiameter)) {
		throw new Error("Material thickness is too large (or box size is too small) to make this box");
	}
	if(thickness <= 0) {
		throw new Error("Material thickness must be > 0!")
	}
	if(fitAllowance >= bitDiameter) {
		throw new Error("Fit allowance cannot be greater than the bit diameter.  (Sorry!)")
	}

	var dx = length-2*thickness;

	edge1 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, fitAllowance, true);
	
	// Lower the edge like a boss
	if(isFront) {
		pt = edge1.history[edge1.history.length-1];
		edge1.rtrim(1);
		edge1.abs(pt.x-(options.bottom_height + options.bit_diameter + options.fit_allowance /*+ options.bottom_slot_thickness*/), pt.y);		
	}
	
	edge1.pivot(0,0,Math.PI/2.0);

	edge1.xmirror(0);
	
	edge2 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, fitAllowance, true);

	// Lower the edge like a boss
	if(isFront) {
		pt = edge2.history[edge2.history.length-1];
		edge2.rtrim(1);
		edge2.abs(pt.x-(options.bottom_height + options.bit_diameter + options.fit_allowance /*+ options.bottom_slot_thickness*/), pt.y);		
	}

	edge2.pivot(0,0,Math.PI/2.0);
	edge2.translate(length, 0);	
	edge2.reverse();

	box = new Turtle2D();
	box.abs(edge1.history[0].x, edge1.history[0].y)

	box.extend(edge1);

	box.extend(edge2);
/*
	box.rel(-(dx/2.0 - tabWidth/2.0 - bitDiameter/2.0), 0);
	box.mark();
	box.rel(-tabWidth-bitDiameter, 0);
	box.unmark();
*/
	start = edge1.history[0];
	box.abs(start.x, start.y)

	//box.translate(-bitDiameter/2, -bitDiameter/2)
	return box;
}

var makeBoxWaffleSide = function(length, width, tabs, gender, thickness, bitDiameter, tabWidth, fitAllowance) {
	if((thickness) >= (length/2-bitDiameter)) {
		throw new Error("Material thickness is too large (or box size is too small) to make this box");
	}
	if(thickness <= 0) {
		throw new Error("Material thickness must be > 0!")
	}
	if(fitAllowance >= bitDiameter) {
		throw new Error("Fit allowance cannot be greater than the bit diameter.  (Sorry!)")
	}

	var dx = length-2*thickness;
	var bitRadius = bitDiameter/2.0;
	
	edge1 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, fitAllowance, true);
	edge1.pivot(0,0,Math.PI/2.0);

	edge1.xmirror(0);
	
	edge2 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, fitAllowance, true);
	edge2.pivot(0,0,Math.PI/2.0);
	edge2.translate(length, 0);
	edge2.reverse();


	edge3 = makeBoxEdge(dx, tabs, GENDER_MALE, thickness, bitDiameter, fitAllowance, true);
	//edge3.translate(bitRadius)
	edge3.reverse();

	// Left edge
	box = new Turtle2D();
	box.abs(edge1.history[0].x, edge1.history[0].y)
	box.extend(edge1);

	// Do for no top
	box.rel(dx/2.0 - tabWidth/2.0 - bitDiameter/2.0, 0);
	box.mark();
	box.rel(tabWidth, 0);
	box.unmark();
	
/*
	// Do for waffle top
	edge4 = makeBoxEdge(dx, tabs, GENDER_MALE, thickness, bitDiameter, fitAllowance, true);
	edge4.ymirror(0);
	edge4.translate(thickness, width);	
	box.extend(edge4);
*/
	// Right edge
	box.extend(edge2);

	edge3.translate(thickness, 0)

	box.extend(edge3);

/*	box.rel(-(dx/2.0 - tabWidth/2.0 - bitDiameter/2.0), 0);
	box.mark();
	box.rel(-tabWidth, 0);
	box.unmark();
*/

	start = box.start();
	box.abs(start.x, start.y)

	//box.translate(-bitDiameter/2, -bitDiameter/2)
	return box;
}


var makeBoxWaffleBottom = function(length, width, tabs, thickness, bitDiameter, tabWidth, fitAllowance) {
	
	var gender = GENDER_FEMALE;
	var length = length - 2*thickness;
	var width = width - 2*thickness;
	var bitRadius = bitDiameter/2.0;

	// Left edge
	edge1 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, fitAllowance, true);
	edge1.pivot(0,0,Math.PI/2.0);
	edge1.xmirror(0);
	
	// Top edge
	edge2 = makeBoxEdge(length, tabs, gender, thickness, bitDiameter, fitAllowance, true);
	edge2.ymirror(0);
	edge2.translate(thickness, width+thickness);

	// Right edge
	edge3 = makeBoxEdge(width, tabs, gender, thickness, bitDiameter, fitAllowance, true);
	edge3.pivot(0,0,Math.PI/2.0);
	edge3.translate(length+2*thickness,0);
	edge3.reverse();

	// Bottom Edge
	edge4 = makeBoxEdge(length, tabs, gender, thickness, bitDiameter, fitAllowance, true);
	edge4.translate(thickness, -thickness)
	edge4.reverse();

	box = new Turtle2D();

	// Make bottom outline
	var start = edge1.start();
	box.abs(start.x, start.y);
	
	box.extend(edge1);
	box.extend(edge2);
	box.extend(edge3);
	box.extend(edge4);

	box.abs(start.x, start.y)
	box.translateToOrigin();
	box.translate(-bitRadius, -bitRadius)

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
	
	retval.push('G0Z0'); // Rapid to surface of material, since plunges are generally slow

	while(1) {
		// Plunge
		retval.push('(Plunge)');
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
					retval.push('G1 Z' + depth + ' F' + plungeRate); // Plunge rate because we're plunging
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


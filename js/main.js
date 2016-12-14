
var side;
var bottom_slot;
var top_slot;
var options;
var geometry = [];
var design_is_ok = false;

var fabmo = new FabMoDashboard();

function saveForm() {
	form_data = {}
	$('#boxdims-form,#toolsettings-form').find('input,select').each(function(){
		form_data[this.id] = this.value;
	});
	localStorage.formData = JSON.stringify(form_data);
}

function loadForm() {
	var form_data = {};
	try {
		form_data = JSON.parse(localStorage.formData)		
	} catch(e) {
		console.warn(e);
	}

	$('#boxdims-form,#toolsettings-form').find('input,select').each(function(){
		if(this.id in form_data) {
			$(this).val(form_data[this.id]);
		} else {
			console.warn(this);
		}
	});

}

function getOptions() {
		// Extract options from the form
		var options = {}

		// Collect values from box dimensions form
		$('#boxdims-form').find('input').each(function(){
			var id = this.id.replace(/input-/gi, '');
			options[id] = Number(this.value);
		});

		// Collect values from machining settings form
		$('#toolsettings-form').find('input').each(function(){
			var id = this.id.replace(/input-/gi, '');
			options[id] = Number(this.value);
		});

		// Convert everything to inches (these are in thousandths)
		options.fit_allowance = options.fit_allowance / 1000.0;
		options.cut_through = options.cut_through / 1000.0;

		// Number of fingers must be an integer (Don't admonish the user, just round)
		options.fingers = Math.round(options.fingers);

		// Gather the type and gender of the pieces
		options.bottom_type = $('#input-bottom_type').val();
		options.top_type = $('#input-top_type').val();

		switch($('#input-part').val()) {
			case "side":
				options.gender = GENDER_FEMALE;
				options.part = "side";
				options.partName = 'side'
				break;

			case "front":
				options.gender = GENDER_MALE;
				options.part = "side";
				options.isFront = true;
				options.partName = 'front'
				break;

			case "back":
				options.gender = GENDER_MALE;
				options.part = "side";
				options.partName = 'back'
				break;

			case "bottom":
				options.part = "bottom";
				options.partName = 'bottom'
				break;

			case "top":
				options.part = "top";
				options.partName = 'top'
				break;

			default:
				msg = "Unknown part: " + $('#input-part').val();
				console.error(msg);
				break;
		}


		// Hide the bottom option and settings if we're cutting a bottomless box
		bottom_option = $("#input-part option[value='bottom']");
		switch(options.bottom_type) {
			case 'none':
				$("#input-part option[value='bottom']").remove();
				$('#bottom-controls').hide(250)						
				break;

			case 'slot':
				if(!bottom_option.length) {
					$("#input-part").append('<option value="bottom">Bottom</option>');
				}
				$('#bottom-controls').show(250);
				break;

			case 'finger':
				if(!bottom_option.length) {
					$("#input-part").append('<option value="bottom">Bottom</option>');
				}
				$('#bottom-controls').hide(250);
				break;

		}

		bottom_option = $("#input-part option[value='top']");
		switch(options.top_type) {
			case 'none':
				$("#input-part option[value='top']").remove();
				$('#bottom-controls').hide(250)						
				break;
			default:
				if(!bottom_option.length) {
					$("#input-part").append('<option value="top">Top</option>');
				}
				break;
		}

		// Parsed and cleaned up options get returned
		return options
}

function makeBoxSide(options) {
	var length = options.gender === GENDER_MALE ? options.box_width : options.box_length;

	if(options.bottom_type == 'finger') {						
		side = makeBoxWaffleSide(	length, 
							options.box_depth, 
							options.fingers, 
							options.gender, 
							options.material_thickness, 
							options.bit_diameter, 
							options.tab_width,
							options.fit_allowance);

	} else {
		side = makeBoxToplessSide(	length, 
							options.box_depth, 
							options.fingers, 
							options.gender, 
							options.material_thickness, 
							options.bit_diameter, 
							options.tab_width,
							options.fit_allowance,
							options.isFront);						
	}
	var geometry = [side];
	if(options.bottom_type === 'slot') {
		if(options.bottom_slot_thickness > options.material_thickness) {
			throw new Error("Slot thickness for bottom is thicker than the material")
		}

		if(options.bottom_height < options.bottom_thickness/2.0) {
			throw new Error("Slot height too low")
		}

		if(options.bottom_height > options.box_depth-options.bottom_thickness) {
			throw new Error("Slot height too high")								
		}

		bottom_slot = makePocket(	options.material_thickness-options.bottom_slot_thickness-options.bit_diameter/2.0 - options.fit_allowance/2.0, 
							options.bottom_height-options.bottom_thickness/2.0-options.fit_allowance/2.0, 
							length-(2*options.material_thickness)+2*options.bottom_slot_thickness+options.bit_diameter + options.fit_allowance, 
							options.bottom_thickness + options.fit_allowance, 
							options.bit_diameter);		
		geometry.unshift(bottom_slot);
	} else {
		bottom_slot = null;
	}

	if(options.top_type === 'slot'/* && !options.isFront*/) {
		if(options.bottom_slot_thickness > options.material_thickness) {
			throw new Error("Slot thickness for bottom is thicker than the material")
		}

		if(options.bottom_height < options.bottom_thickness/2.0) {
			throw new Error("Slot height too low")
		}

		if(options.bottom_height > options.box_depth-options.bottom_thickness) {
			throw new Error("Slot height too high")								
		}

		top_slot = makePocket(	options.material_thickness-options.bottom_slot_thickness-options.bit_diameter/2.0-options.fit_allowance, 
							options.box_depth-options.bottom_height-options.bottom_thickness/2.0 - options.fit_allowance/2.0, 
							length-(2*options.material_thickness)+2*options.bottom_slot_thickness+options.bit_diameter + 2.0*options.fit_allowance, 
							options.bottom_thickness + options.fit_allowance*2, 
							options.bit_diameter);		
		geometry.unshift(top_slot);
	} else {
		top_slot = null;
	}

	return geometry;
}

function makeBoxBottom(options) {
	if(options.do_finger_bottom) {
		bottom = makeBoxWaffleBottom( 	options.box_length, 
										options.box_width, 
										options.fingers, 
										options.material_thickness, 
										options.bit_diameter, 
										0, // Tab width
										options.fit_allowance);
	} else {
		bottom = makeRectangle(	options.box_length + 2*options.bottom_slot_thickness - 2*options.material_thickness, 
								options.box_width + 2*options.bottom_slot_thickness - 2*options.material_thickness, 
								options.bit_diameter,
								options.tab_width);
	}
	var geometry = [bottom];
	return geometry
}

function update() {

	// Pull most up-to-date options from the form
	options = getOptions();

	try {
		var bitRadius = options.bit_diameter/2.0;
		var sideGeom = makeBoxSide(options);
		var bottomGeom = makeBoxBottom(options);
		switch(options.part) {
			case 'side':
				geometry = sideGeom;
				break;
			case 'top':
			case 'bottom':
				geometry = bottomGeom;
				break;
		}
		ok();
	} catch(e) {
		console.error(e)
		error(e);
	}

	// Re-render (or show an error, if error() was called)
	redraw();
}

preview = new CanvasPreview('viewport');

function redraw() {
	container = document.getElementById('viewport-container');
	preview.canvas.width = container.offsetWidth;
	preview.canvas.height = container.offsetHeight;	
	preview.draw(geometry, 0.125);
}

window.addEventListener('resize', function(evt) {
	redraw();
});

function error(msg) {
	$('#viewport-container').removeClass('viewport-ok');
	$('#viewport-container').addClass('viewport-danger');
	$('#viewport').hide();	
	$('#viewport-message-text').text(msg);
	$('#viewport-message').show();
	$('#btn-cut').prop('disabled', true);
	design_is_ok = false;
}

function ok() {
	$('#viewport-container').removeClass('viewport-danger');
	$('#viewport-container').addClass('viewport-ok');	
	$('#viewport-message').hide();
	$('#viewport').show();
	$('#btn-cut').prop('disabled', false);
	design_is_ok = true;
}

function makeSideGCode() {
	// Setup
	var gSetup = makeGCodeSetup(options.safe_z);
	
	// Slot for bottom (if requested)
	if(bottom_slot) {
		var gBottomSlotTitle = ['', '(SLOT FOR BOTTOM OF BOX)', ''];
		var gBottomSlot = makeGCodeFromTurtle(bottom_slot,
										-options.bottom_slot_thickness, 
										0.75*options.bit_diameter, 
										60*options.feed_rate, 
										60*options.plunge_rate, 
										options.safe_z, 
										options.tab_thickness)
	} else {
		var gBottomSlotTitle = []
		gBottomSlot = [];
	}

	// Slot for bottom (if requested)
	if(top_slot) {
		var gTopSlotTitle = ['', '(SLOT FOR TOP OF BOX)', ''];
		var gTopSlot = makeGCodeFromTurtle(top_slot,
										-options.bottom_slot_thickness, 
										0.75*options.bit_diameter, 
										60*options.feed_rate, 
										60*options.plunge_rate, 
										options.safe_z, 
										options.tab_thickness)
	} else {
		var gTopSlotTitle = []
		gTopSlot = [];
	}

	// Side
	var gSideTitle = ['', '(SIDE OF BOX CUTOUT)', ''];
	var gSide = makeGCodeFromTurtle(	side,
										-options.material_thickness - options.cut_through, 
										0.75*options.bit_diameter, 
										60*options.feed_rate, 
										60*options.plunge_rate, 
										options.safe_z, 
										options.tab_thickness);

	// Teardown
	var gTeardown = makeGCodeTeardown(options.safe_z);
	
	gSetup.extend(gBottomSlotTitle);
	gSetup.extend(gBottomSlot);
	gSetup.extend(gTopSlotTitle);
	gSetup.extend(gTopSlot);

	gSetup.extend(gSideTitle);
	gSetup.extend(gSide);
	gSetup.extend(gTeardown);

	return gSetup.join('\n');
}

function makeBottomGCode() {
	// Setup
	var gSetup = makeGCodeSetup(options.safe_z);
	
	// Bottom
	var gBottomTitle = ['', '(BOTTOM OF BOX)', ''];

	// Finger jointed bottom uses the material thickness
	// Slot bottom has its own thickness
	var thickness = options.bottom_thickness;
	if(options.do_finger_bottom) {
		thickness = options.material_thickness;
	}

	var gBottom = makeGCodeFromTurtle(	bottom,
										-thickness - options.cut_through, 
										0.75*options.bit_diameter, 
										60*options.feed_rate, 
										60*options.plunge_rate, 
										options.safe_z, 
										options.tab_thickness);

	// Teardown
	var gTeardown = makeGCodeTeardown(options.safe_z);
	
	gSetup.extend(gBottomTitle);
	gSetup.extend(gBottom);
	gSetup.extend(gTeardown);

	return gSetup.join('\n');
}

function onCut() {
	update();

	// Just crap out if the design doesn't pass
	if(!design_is_ok) {
		fabmo.notify("error", "Can't cut this design.  Check your parameters!");
	}
	var genderName = options.gender === GENDER_MALE ? 'male' : 'female';

	switch(options.part) {
		case 'side':
			fabmo.submitJob({
				file: makeSideGCode(), 
				filename : 'box_' + options.partName + '.nc',
					name : 'Panel (' + options.partName + ')',
				description: 'A box-jointed ' + options.partName + ' panel.'
			});
			break;

			case 'bottom':
			fabmo.submitJob({
				file: makeBottomGCode(), 
				filename : 'box_bottom.nc',
				   	name : 'Box Jointed Bottom',
				description: 'A box jointed bottom-panel'
			});
			break;
	}	
}

function onFormChange() {
	saveForm();
	update();	
}

$(document).ready(function() {
  	$('#btn-cut').click(onCut);
  	loadForm();
  	$('.update').change(onFormChange);
  	update();
});
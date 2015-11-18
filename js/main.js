
var side;
var slot;
var options;
var geometry = [];
var design_is_ok = false;

function getOptions() {
		// Extract options from the form
		var options = {}
		$('#boxdims-form').find('input').each(function(){
			var id = this.id.replace(/input-/gi, '');
			options[id] = Number(this.value);
		});

		$('#toolsettings-form').find('input').each(function(){
			var id = this.id.replace(/input-/gi, '');
			options[id] = Number(this.value);
		});

		options.fingers = Math.round(options.fingers);
		options.bottom_type = $('#input-bottom_type').val();
		switch($('#input-part').val()) {
			case "male":
				options.gender = GENDER_MALE;
				options.part = "side";
				break;

			case "female":
				options.gender = GENDER_FEMALE;
				options.part = "side";
				break;

			case "bottom":
				options.part = "bottom";
				break;

			default:
				console.error("Unknown part: " + $('#input-part').val())
				break;
		}
		options.do_slot = options.bottom_type === "slot"
		options.do_finger_bottom = options.bottom_type === "finger"

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

		return options
}

$('.update').change(function(evt) {
	update();
});

function update() {
		options = getOptions();

		try {
			var bitRadius = options.bit_diameter/2.0;

			switch(options.part) {
				case 'side':
					var length = options.gender === GENDER_MALE ? options.box_length : options.box_width;

					if(options.do_finger_bottom) {						
						side = makeBoxWaffleSide(	length, 
											options.box_depth, 
											options.fingers, 
											options.gender, 
											options.material_thickness, 
											options.bit_diameter, 
											options.tab_width,
											options.fit_allowance);

					} else {
						side = makeBoxSide(	length, 
											options.box_depth, 
											options.fingers, 
											options.gender, 
											options.material_thickness, 
											options.bit_diameter, 
											options.tab_width,
											options.fit_allowance);						
					}
					console.log(side.dimensions())
					geometry = [side];
					if(options.do_slot) {
						if(options.bottom_slot_thickness > options.material_thickness) {
							throw new Error("Slot thickness for bottom is thicker than the material")
						}

						if(options.bottom_height < options.bottom_thickness/2.0) {
							throw new Error("Slot height too low")
						}

						if(options.bottom_height > options.box_depth-options.bottom_thickness) {
							throw new Error("Slot height too high")								
						}

						slot = makePocket(	options.material_thickness-options.bottom_slot_thickness-bitRadius, 
											options.bottom_height-options.bottom_thickness/2.0, 
											length-(2*options.material_thickness)+2*options.bottom_slot_thickness+options.bit_diameter, 
											options.bottom_thickness, 
											options.bit_diameter);		
						geometry.unshift(slot);
					} else {
						slot = null;
					}
					break;

				case 'bottom':

					if(options.do_finger_bottom) {
						bottom = makeBoxWaffleBottom( 	options.box_length, 
														options.box_width, 
														options.fingers, 
														options.material_thickness, 
														options.bit_diameter, 
														0, 0);
						console.log(bottom.dimensions());
//function(length, width, tabs, thickness, bitDiameter, tabWidth, fitAllowance)
					} else {
						bottom = makeRectangle(	options.box_length + 2*options.bottom_slot_thickness - 2*options.material_thickness, 
												options.box_width + 2*options.bottom_slot_thickness - 2*options.material_thickness, 
												options.bit_diameter,
												options.tab_width);
					}
					geometry = [bottom];
				break;
			}
			ok();
		} catch(e) {
			error(e);
		}
		redraw();
}

preview = new CanvasPreview('viewport');

function redraw() {
	container = document.getElementById('viewport-container');
	preview.canvas.width = container.offsetWidth;
	preview.canvas.height = container.offsetHeight;	
	preview.draw(geometry);
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
	if(slot) {
		var gSlotTitle = ['', '(SLOT FOR BOTTOM OF BOX)', ''];
		var gSlot = makeGCodeFromTurtle(slot,
										-options.bottom_slot_thickness, 
										0.75*options.bit_diameter, 
										60*options.feed_rate, 
										60*options.plunge_rate, 
										options.safe_z, 
										options.tab_thickness)
	} else {
		var gSlotTitle = []
		gSlot = [];
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
	
	gSetup.extend(gSlotTitle);
	gSetup.extend(gSlot);
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
	var gBottom = makeGCodeFromTurtle(	bottom,
										-options.material_thickness - options.cut_through, 
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

$('#btn-cut').click( function() {
	update();
	if(!design_is_ok) {
		return;
	}
	var genderName = options.gender === GENDER_MALE ? 'male' : 'female';

	switch(options.part) {
		case 'side':
			code = makeSideGCode();
			fabmoDashboard.submitJob(code, {
				filename : 'box_' +  genderName + '.nc',
					name : 'Box Jointed Panel (' + genderName + ')'
			});
			break;

			case 'bottom':
			code = makeBottomGCode();
			fabmoDashboard.submitJob(code, {
				filename : 'box_bottom.nc',
					name : 'Bottom of Box '
			});
			break;
	}	
});
update();
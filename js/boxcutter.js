
var side;
var slot;
var options;

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

		options.gender = $('#input-gender').val() === "Male" ? GENDER_MALE : GENDER_FEMALE;
		options.do_slot = $('#input-bottom_type').val() === "Slot"
		if(options.do_slot) {
			$('#bottom-controls').show(250)
		} else {
			$('#bottom-controls').hide(250)						
		}

		return options
}

$('.update').change(function(evt) {
	update();
});

function update() {
		options = getOptions();
		try {
			var bitRadius = options.bit_diameter/2.0
			side = makeBoxSide(	options.box_length, 
								options.box_depth, 
								options.fingers, 
								options.gender, 
								options.material_thickness, 
								options.bit_diameter, 
								options.tab_width);

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

				slot = makePocket(	options.material_thickness+bitRadius-options.bottom_slot_thickness, 
									options.bottom_height-options.bottom_thickness/2.0, 
									options.box_length-(2*options.material_thickness)+2*options.bottom_slot_thickness, 
									options.bottom_thickness, 
									options.bit_diameter);							
			} else {
				slot = null;
			}
			ok();
		} catch(e) {
			error(e);
			side = null;
			slot = null;
			console.error(e);
		}
		redraw();
}

preview = new CanvasPreview('viewport');

function redraw() {
	container = document.getElementById('viewport-container');
	preview.canvas.width = container.offsetWidth;
	preview.canvas.height = container.offsetHeight;	
	if(side) {
			if(slot) {
				preview.draw([side, slot]);
			} else {
				preview.draw([side]);							
			}
	}
}

window.addEventListener('resize', function(evt) {
	redraw();
});

function error(msg) {
	$('#alert').show();
	$('#alert').addClass('alert-danger');
	$('#alert').text(msg);
}

function ok() {
	$('#alert').hide();        
}

$('#btn-cut').click( function() {
	update();
	if(side) {			
		// Setup
		var gSetup = makeGCodeSetup(options.safe_z);
		
		// Slot for bottom (if requested)
		if(slot) {
			var gSlotTitle = ['', '(SLOT FOR BOTTOM OF BOX)', ''];
			var gSlot = makeGCodeFromTurtle(slot,-options.bottom_slot_thickness, 0.75*options.bit_diameter, 60*options.feed_rate, 60*options.plunge_rate, options.safe_z, options.tab_width)
		} else {
			var gSlotTitle = []
			gSlot = [];
		}

		// Side
		var gSlotTitle = ['', '(SIDE OF BOX CUTOUT)', ''];
		var gSide = makeGCodeFromTurtle(side,-options.material_thickness - 0.010, 0.75*options.bit_diameter, 60*options.feed_rate, 60*options.plunge_rate, options.safe_z, options.tab_width);

		// Teardown
		var gTeardown = makeGCodeTeardown(options.safe_z);
		
		gSetup.extend(gSlot);
		gSetup.extend(gSide);
		gSetup.extend(gTeardown);

		var genderName = options.gender === GENDER_MALE ? 'male' : 'female';
		
		fabmoDashboard.submitJob(gSetup.join('\n'), {
									filename : 'box_' +  (options.gender === GENDER_MALE ? 'male' : 'female') + '.nc',
															name : 'Box Jointed Panel ' + options.box_length.toFixed(2) + '"x' + options.box_depth.toFixed(2) + '" (' + genderName + ')'
														});
		
	}
});
update();
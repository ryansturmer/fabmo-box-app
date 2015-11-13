
var side;
var slot;
var options;
var geometry = [];

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
		options.do_slot = $('#input-bottom_type').val() === "Slot"

		bottom_option = $("#input-part option[value='bottom']");
		if(options.do_slot) {
			if(!bottom_option.length) {
				$("#input-part").append('<option value="bottom">Bottom</option>');
			}
			$('#bottom-controls').show(250)
		} else {
			$("#input-part option[value='bottom']").remove();
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
			var bitRadius = options.bit_diameter/2.0;

			switch(options.part) {
				case 'side':
					side = makeBoxSide(	options.box_length, 
										options.box_depth, 
										options.fingers, 
										options.gender, 
										options.material_thickness, 
										options.bit_diameter, 
										options.tab_width,
										options.fit_allowance);

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

						slot = makePocket(	options.material_thickness+bitRadius-options.bottom_slot_thickness, 
											options.bottom_height-options.bottom_thickness/2.0, 
											options.box_length-(2*options.material_thickness)+2*options.bottom_slot_thickness, 
											options.bottom_thickness, 
											options.bit_diameter);		
						//console.log(slot)					
						geometry.unshift(slot);
					} else {
						slot = null;
					}
					break;

				case 'bottom':
					bottom = makeRectangle(	options.box_length + 2*options.bottom_slot_thickness - 2*options.material_thickness, 
											options.box_depth + 2*options.bottom_slot_thickness - 2*options.material_thickness, 
											options.bit_diameter,
											options.tab_width);
					geometry = [bottom];
				break;
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
	preview.draw(geometry);
}

window.addEventListener('resize', function(evt) {
	redraw();
});

function error(msg) {
	$('#viewport-container').removeClass('viewport-ok');
	$('#viewport-container').addClass('viewport-danger');
	$('#viewport').hide();	
	$('#viewport-message').text(msg);
	$('#viewport-message').show();	
}

function ok() {
	$('#viewport-container').removeClass('viewport-danger');
	$('#viewport-container').addClass('viewport-ok');	
	$('#viewport-message').hide();
	$('#viewport').show();
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
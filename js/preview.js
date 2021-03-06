var CanvasPreview = function(id) {
	this.id = id;
	this.canvas = document.getElementById(id);
	this.context = this.canvas.getContext('2d');
}

CanvasPreview.prototype.draw = function(turtles, bitDiameter) {
	var bounds = turtles[0].bounds();
	bitDiameter = bitDiameter || 0;
	turtles.forEach(function(turtle) {
		b = turtle.bounds()
		bounds.xmax = Math.max(bounds.xmax, b.xmax);
		bounds.xmin = Math.min(bounds.xmin, b.xmin);
		bounds.ymax = Math.max(bounds.ymax, b.ymax);
		bounds.ymin = Math.min(bounds.ymin, b.ymin);
	});

	var realWidth = bounds.xmax - bounds.xmin;
	var realHeight = bounds.ymax - bounds.ymin;
	var canvasWidth = this.canvas.width;
	var canvasHeight = this.canvas.height;

	var xScale = canvasWidth/realWidth;
	var yScale = canvasHeight/realHeight;

	var scale = 0.9*Math.min(xScale, yScale);

	var offsetX = -bounds.xmin;
	var offsetY = -bounds.ymin;

	var marginX = canvasWidth*0.05;
	var marginY = canvasHeight*0.05;

	function scaleX(x) {
		return (x+offsetX)*scale + marginX;
	}

	function scaleY(y) {
		return canvasHeight-((y+offsetY)*scale + marginY);
	}      

	var context = this.context;

		context.beginPath();
		context.strokeStyle = 'lightgray';
		context.moveTo(scaleX(0), 0);
		context.lineTo(scaleX(0), canvasHeight);
		context.stroke();

		context.beginPath();
		context.strokeStyle = 'lightgray';
		context.moveTo(0, scaleY(0));
		context.lineTo(canvasWidth, scaleY(0));
		context.stroke();

	if(bitDiameter) {
		turtles.forEach(function(turtle) {
			context.beginPath();
		    context.moveTo(scaleX(turtle.history[0].x), scaleY(turtle.history[0].y));
		    turtle.history.forEach(function(p) {
			    context.lineTo(scaleX(p.x), scaleY(p.y));
		    });
			context.fillStyle = 'lightblue';
			context.strokeStyle = 'lightblue';
			context.lineCap = 'round';
			context.lineJoin = 'round';
			context.lineWidth = scale*bitDiameter;

			context.stroke();

		});

	}

	turtles.forEach(function(turtle) {


		context.beginPath();
	    context.moveTo(scaleX(turtle.history[0].x), scaleY(turtle.history[0].y));
	    turtle.history.forEach(function(p) {
	    	context.lineTo(scaleX(p.x), scaleY(p.y));
	    });
	    context.strokeStyle = 'black';
		context.lineWidth = 1;
		context.lineJoin = 'round';

		context.stroke();

	});
}
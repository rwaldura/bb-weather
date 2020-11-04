/*
 * Functions related to styling and formatting. 
 */

/***************************************************************************
 * Map an angle in degrees to a compass heading.
 */
const HEADINGS = [ 
	"North", "NNE", "Northeast", 
	"ENE", "East", "ESE",
	"Southeast", "SSE", "South", "SSW", "Southwest", 
	"WSW", "West", "WNW",
	"Northwest", "NNW" ];

// "span" of one heading, in degrees
const HEADING_SPAN = 360 / HEADINGS.length; 

function formatDirection(dir /* angle in degrees */)
{
	const i = Math.floor(dir / HEADING_SPAN + 0.5);
	return `${HEADINGS[i]} (${Math.round(dir)}&deg;)`;
}

/***************************************************************************
 * To map any angle to a RGB color, we define linear functions between the
 * 4 colors of the compass: red (N), yellow (E), green (S), blue (W).
 */
const K = 255 / 90;
const F_COLOR_PARAMS = {
	r: [ [ 0, 255], [-K, 510], [ 0,    0], [+K, -765] ],
	g: [ [+K,   0], [ 0, 255], [-K,  765], [ 0,    0] ],
	b: [ [ 0,   0], [ 0,   0], [+K, -510], [-K, 1020] ] };

function angle2color(x, dim /* 'r' or 'g' or 'b' */)
{
	if (x < 0 || x >= 360) throw new Error("Invalid angle: " + x);
	
	const quadrant = Math.floor(x / 90);
	
	// y = ax + b
	return Math.round(
		x * F_COLOR_PARAMS[dim][quadrant][0]
		  + F_COLOR_PARAMS[dim][quadrant][1]);
}

/***************************************************************************
 * Map 360 degrees into RBG colorspace, with:
 * North   0˚ => red
 * East   90˚ => yellow
 * South 180˚ => green
 * West  270˚ => blue 
 * North 360˚ => red
 */
function dir2color(dir /* degrees */)
{
	var rgb_color = '#';
	for (var dim of ['r', 'g', 'b'])
	{
		const n = angle2color(dir, dim);
		var hex_color = n.toString(16);
		if (hex_color.length < 2) // pad with zero
			hex_color = "0" + hex_color;
		rgb_color += hex_color;
	}
	return rgb_color;
}

/***************************************************************************
 * Style the datapoint to indicate wind direction.
 * See https://developers.google.com/chart/interactive/docs/points#customizing-individual-points
 */
function dir2style(dir, revs, period /* minutes */)
{
	// don't show wind direction if less than 0.5 MPH
	const visible = (revs > 12 * period);

	const color = dir2color(dir);
	return `point { 
		visible: ${visible};
		size: 12;
		shape-type: star;
		shape-sides: 2;
		shape-rotation: ${dir}; 
		fill-color: ${color} }`;
}

/***************************************************************************
 * See https://developers.google.com/chart/interactive/docs/reference#dateformat
 */
function formatTimestamp(ts /* Unix timestamp */, period /* minutes */)
{
	const date = new Date(ts * 1000);

	var format;
	if (period < 60) // show minutes
		format = "h:mm aa";
	else // show day of week and hour
		format = "EEE MMM d, h aa";

	const f = new google.visualization.DateFormat({ pattern: format });
	return f.formatValue(date);
}

/****************************************************************************/
function formatSpeed(P, T /* minutes */)
{
	var V = wind_speed(P, T * 60); // in canonical unit
	V = G.speed.convert(V); // to current unit
	return G.speed.format(V);
}

/***************************************************************************
 * Custom tooltip
 * See https://developers.google.com/chart/interactive/docs/customizing_tooltip_content#customizing-html-content
 */
function tooltip(ts, dir, revs, period /* minutes */)
{
	const tstamp = formatTimestamp(ts, period);
	const fdir = formatDirection(dir);
	const speed = formatSpeed(revs, period);
	return `<div class="tooltip">
		<span class="timestamp">${tstamp}</span><br>
		${fdir}<br> 
		${speed}
		</div>`;
}

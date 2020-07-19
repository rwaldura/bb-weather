/***************************************************************************
 * Map an angle in degrees to a compass heading.
 */
function formatDirection(dir /* angle in degrees */)
{
	const HEADINGS = [ 
		"North", "NNE", "Northeast", 
		"ENE", "East", "ESE",
		"Southeast", "SSE", "South", "SSW", "Southwest", 
		"WSW", "West", "WNW",
		"Northwest", "NNW" ];

	const span = 360 / HEADINGS.length; // "span" of one heading, in degrees
	const i = Math.floor(dir / span + 0.5);
	return `${HEADINGS[i]} (${Math.round(dir)}&deg;)`;
}

/***************************************************************************
 * From a number of revolutions per time period,
 * calculate wind speed in miles per hour according to:
 * V = 9P / 4T
 * per wind sensor manufacturer
 */
function wind_speed(P, T /* seconds */)
{
	const V = (9 * P) / (4 * T);
	return V;
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

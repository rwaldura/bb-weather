/*
 * Map an angle in degrees to a compass heading.
 */
function format_direction(d /* angle in degrees */)
{
	const HEADINGS = [ 
		"North", "NNE", "Northeast", 
		"ENE", "East", "ESE",
		"Southeast", "SSE", "South", "SSW", "Southwest", 
		"WSW", "West", "WNW",
		"Northwest", "NNW" ];

	const s = 360 / HEADINGS.length; // "span" of one heading, in degrees
	const i = Math.floor(d/s + 0.5);
	return `${HEADINGS[i]} (${Math.round(d)}&deg;)`;
}

/*
 * From a number of revolutions per time period,
 * calculate wind speed in miles per hour according to:
 * V = 9P / 4T
 * per wind sensor manufacturer
 */
function wind_speed(P, T /* seconds */)
{
	// convert miles per hour...
	const MPH_KMH = 1.609344;	// ... to kilometers per hour
	const MPH_MS = 2.2352;		// ... to meters per second
	const MPH_KNOTS = 0.868976;	// ... to knots

	const V = (9 * P) / (4 * T);

	return {
		mph: V,
		kmh: V * MPH_KMH,
		ms: V / MPH_MS,
		knots: V * MPH_KNOTS };
}

function format_speed(P, T /* minutes */)
{
	const ws = wind_speed(P, T * 60);
	
	return { 
		mph: Math.round(ws.mph),
		kmh: Math.round(ws.kmh),
		ms: ws.ms.toFixed(1),
		knots: Math.round(ws.knots) };
}

/*
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
	const quadrant = Math.floor(x / 90);
	
	// y = ax + b
	return Math.round(
		x * F_COLOR_PARAMS[dim][quadrant][0]
		  + F_COLOR_PARAMS[dim][quadrant][1]);
}

/*
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

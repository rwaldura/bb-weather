/*
 * Core functions that manipulate raw weather data. 
 */

/***************************************************************************
 * From a number of revolutions per time period,
 * calculate wind speed in miles per hour according to:
 * V = 9P / 4T
 * per wind sensor manufacturer
 */
function wind_speed(P, T /* seconds */)
{
	return (9 * P) / (4 * T);
}

/****************************************************************************/
function windSpeed(P, T /* minutes */)
{
	const V = wind_speed(P, T * 60);
	return G.speed.convert(V);
}

/***************************************************************************
 */
// data is defined as:
//
// column index 0
// id: "tstamp",
// type: "number"
// 
// column index 1
// id: "period",
// type: "number"
// 
// column index 2
// id: "direction",
// type: "number"
// 
// column index 3
// id: "revs",
// type: "number"		
const TSTAMP_COL = 0;
const PERIOD_COL = 1;
const DIR_COL = 2;
const REVS_COL = 3;

function prepWindData(dt, lookback /* minutes */, period /* minutes */)
{
	var view = new google.visualization.DataView(dt);

	if (period == 1 || period == 60) // no need to group
	{
		view.setRows( view.getFilteredRows( [
			{ column: PERIOD_COL, value: period },
			{ column: TSTAMP_COL, minValue: view.getColumnRange(TSTAMP_COL).max - lookback * 60 } ]));
	}
	else // further grouping is necessary
	{
		const basePeriod = (period < 60) ? 1 : 60;
		
		view.setRows( view.getFilteredRows( [
			{ column: PERIOD_COL, value: basePeriod },
			{ column: TSTAMP_COL, minValue: view.getColumnRange(TSTAMP_COL).max - lookback * 60 } ]));

		view = groupWindData(view, period * 60);		
	}

	view.setColumns([
		{ id: 'date_time', // timestamp, as a Date object
			type: 'datetime',
			calc: function(dt, row) { return new Date(1000 * dt.getValue(row, TSTAMP_COL)) } },
		{ id: 'speed_mph',
			label: 'Wind Speed',
			type: 'number',
			calc: function(dt, row) { return windSpeed(dt.getValue(row, REVS_COL), period) } },
		{ id: 'point_style',
			role: 'style',
			type: 'string',
			calc: function(dt, row) { return dir2style(dt.getValue(row, DIR_COL), /* direction */ 
													dt.getValue(row, REVS_COL), /* revs */ 
													period) } },
		{ id: 'point_tooltip',
			role: 'tooltip',
			properties: { html: true },
			type: 'string',
			calc: function(dt, row) { return tooltip(dt.getValue(row, TSTAMP_COL), /* timestamp */
													dt.getValue(row, DIR_COL), /* direction */
													dt.getValue(row, REVS_COL), /* revs */
													period) } } ]);

	return view;
}

function groupWindData(dt, period /* seconds */)
{	
	const grouped = google.visualization.data.group(
		dt,
		// group by timestamp over the period given
		[ { column: 0,
			modifier: function(t) { return period * Math.floor(t / period) }, 
			type: 'number' } ],
		// aggregate columns: MIN(period), AVG(dir), SUM(revs)
		// MIN(period) isn't actually used, it's there merely to preserve column indices
		[ { column: 1,
			aggregation: google.visualization.data.min, 
			type: 'number' },
		{ column: 2,
			aggregation: google.visualization.data.avg, 
			type: 'number' },
		{ column: 3, 
			aggregation: google.visualization.data.sum, 
			type: 'number' } ]);

	// debugTable(grouped);
			
	return new google.visualization.DataView(grouped);	
}

/***************************************************************************
 * Get min, max, avg in the last timeperiod
 */
function getInstantMetrics(dt, lookback /* minutes */)
{
	lookback *= 60; // to seconds
	const view = new google.visualization.DataView(dt);

	view.setRows( view.getFilteredRows( [
		{ column: 1, value: 1 }, // where period=1
		{ column: 0, minValue: view.getColumnRange(0).max - lookback } ])); // and tstamp >= max(tstamp) - lookback
		
	const grouped = google.visualization.data.group(
		view,
		// aggregate over the entire view
        [{ column: 0,
			modifier: function(t) { return 0 /* value is irrelevant */ },
            type: 'number' }],
		// aggregate columns: MIN(revs), AVG(revs), MAX(revs)
		[ { column: 3,
			aggregation: google.visualization.data.min, 
			type: 'number' },
		{ column: 3,
			aggregation: google.visualization.data.avg, 
			type: 'number' },
		{ column: 3, 
			aggregation: google.visualization.data.max, 
			type: 'number' } ]);
			
	return { 
		min: grouped.getValue(0, 1), 
		avg: grouped.getValue(0, 2), 
		max: grouped.getValue(0, 3) };
}

/***************************************************************************/
function newDataTableRequest()
{
	const xhr = new XMLHttpRequest();
	xhr.responseType = "json";
	
	xhr.onerror = function(e) { showError("Loading chart data: " + e) };
	
	xhr.onload = function() {
		if (xhr.status == 200 // HTTP OK
			&& xhr.response) // JSON parsed successfully
		{
			updateAll(xhr.response);
		}
		else
		{
			showError("Loading chart data: status=" + xhr.status + " resp=" + xhr.response);
		}
	};

	return xhr;
}

/***************************************************************************/
// this is a URL, relative to the page that calls it: index.html (same origin)
const GET_DATATABLE_URL = "getDataTable.cgi";

function loadChartData()
{
	// we pass no parameters: this CGI program knows to return
	// exactly the data we want
	G.request.open("GET", GET_DATATABLE_URL, true /* async */);
	G.request.send();
	// the XHR onload handler is called next
}

/*************************************************************************
 * Group wind data to create the wind rose.
 * Example:
angle,speed,percent
10,2 - 5,0.244
10,5 - 7,0.411
10,7 - 10,0.423
10,10 - 15,0.573
10,15 - 20,0.118
10,20+,0.028
20,2 - 5,0.227
20,5 - 7,0.326
20,7 - 10,0.341
20,10 - 15,0.466
20,15 - 20,0.099
 */
function prepWindRoseData(dt)
{
	const grouped = groupWindRoseData(dt);
	// console.log(grouped);
	// debugTable(grouped);
	
	const result = dataTable2JSChartArray(grouped);	
	// console.log("js chart array = " + result);
	
	return result;
}

/*************************************************************************
 * Transform a Google Charts dataTable into an JavaScript array that can
 * be groked by JSCharts.  
 */
function dataTable2JSChartArray(dt)
{
	const result = [];
	
	const cols = [...Array(dt.getNumberOfColumns()).keys()]; // column indices
	result.types = cols.map(j => dt.getColumnType(j));
	result.columns = cols.map(j => dt.getColumnId(j));
	
	for (let i = 0; i < dt.getNumberOfRows(); i++)
	{
		const row = {};
		cols.map(j => row[result.columns[j]] = dt.getValue(i, j));
		result.push(row);
	}
	
	return result;
}

/*************************************************************************
 */
function groupWindRoseData(dt)
{
	const ANGLE_QUANTUM = 20;
	
	function quantizeDirection(dir)
	{
		// slot the angle "dir" into 20-degree buckets:
		return ANGLE_QUANTUM * Math.floor(dir / ANGLE_QUANTUM);
	}

	function quantizeSpeed(revs)
	{
		// @todo make it work for units other the native unit: mph
		v = wind_speed(revs, 60 * 60);
		if (v <=  5) return  "0 – 5" ;
		if (v <= 10) return  "5 – 10";
		if (v <= 15) return "10 – 15";
		if (v <= 20) return "15 – 20";	
		/* else */ return "20+";	
	}

	function windTimePercent(hours)
	{
		// we receive the list of hours that the wind was blowing with a given
		// force (speed), and a given direction
		const seconds = hours.length * 60 * 60;
		totalAggrTime += seconds;
		return 100 * seconds / totalTime; // proportion of this wind
	}

	const view = new google.visualization.DataView(dt);

	view.setRows( view.getFilteredRows([
		{ column: 1, value: 60 } ])); // where period=60
	
	const timeRange = view.getColumnRange(0);
	const totalTime = timeRange.max - timeRange.min; // length of this time window in seconds
	var totalAggrTime = 0;
	
	const grouped = google.visualization.data.group(
		view,
        [ { column: 2,
			id: 'angle',
			modifier: quantizeDirection,
            type: 'number' },
		{ column: 3,
			id: 'speed',
			modifier: quantizeSpeed,
            type: 'string' } ],
		// aggregate column: 
		[ { column: 0,
			id: 'percent',
			aggregation: windTimePercent, 
			type: 'number' } ] );

	console.log("wind rose data aggregation: " + totalAggrTime / totalTime);

	return grouped;
}

/****************************************************************************/
function addSolarEvents(dt /* datatable */)
{
	dt.addColumn('number', 'Sunrise/Sunset', 'sunrise_sunset');
	dt.addRows(calcSolarEvents(dt));
}

function calcSolarEvents(dt /* datatable */)
{
	function nextDay(d /* Date */, days = 1)
	{
		const ONE_DAY_MS = 24 * 60 * 60 * 1000;
		return new Date(d.getTime() + days * ONE_DAY_MS);
	}
	
	const low = 0;
	const high = 2 * dt.getColumnRange(1).max; 
	// arbitrary value: double the max wind speed; we will clamp the Y-axis later
	
	const start = nextDay(dt.getColumnRange(TSTAMP_COL).min);
	const end   = nextDay(dt.getColumnRange(TSTAMP_COL).max);
	console.log("solar events range = " + start + " - " + end);
	
	const events = [];
	for (let t = start; t < end; /* t += 1 day */ t = nextDay(t))
	{
		const sunrise = SunriseSunsetJS.getSunrise(G.location.latitude, G.location.longitude, t);
		const  sunset = SunriseSunsetJS.getSunset (G.location.latitude, G.location.longitude, t);
	
		console.log("t=" + t + " sunset=" + sunset + " sunrise=" + sunrise);
		
		if (dt.getNumberOfColumns() != 5) throw new Error("Datatable must have 5 columns");
		
		events.push([ new Date(sunset.getTime() - 1), null, null, null, low ]);
		events.push([ sunset, null, null, null, high ]);

		events.push([ new Date(sunrise.getTime() - 1), null, null, null, high ]);
		events.push([ sunrise, null, null, null, low ]);			
	}

	return events;
}

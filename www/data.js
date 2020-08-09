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
	const V = (9 * P) / (4 * T);
	return V;
}

/****************************************************************************/
function windSpeed(dt, row, col, T /* minutes */)
{
	const P = dt.getValue(row, col);
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
function prepWindData(dt, lookback /* minutes */, period /* minutes */)
{
	const view = new google.visualization.DataView(dt);

	view.setRows( view.getFilteredRows( [
		{ column: 1, value: period },
		{ column: 0, minValue: view.getColumnRange(0).max - lookback * 60 } ]));

	view.setColumns([
		{ id: 'date_time', // timestamp, as a Date object
			type: 'datetime', 
			calc: function(dt, row) { const t = dt.getValue(row, 0); return new Date(t * 1000) } }, 
		{ id: 'speed_mph', 
			label: 'Wind Speed',
			type: 'number', 
			calc: function(dt, row) { return windSpeed(dt, row, 3 /* revs */, period) } }, 
		{ id: 'point_style', 
			role: 'style',
			type: 'string', 
			calc: function(dt, row) { return dir2style(dt, row, 2 /* dir */, period) } },
		{ id: 'point_tooltip', 
			role: 'tooltip', 
			properties: { html: true },
			type: 'string', 
			calc: function(dt, row) { return tooltip(dt, row, 0, 2, 3, period) } } ]);

	return view;
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
function loadChartData()
{
	// we pass no parameters: the CGI knows to return exactly the data we want
	G.request.open("GET", "getDataTable.json", true);
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
	function quantizeDirection(dir)
	{
		// slot the angle "dir" into 10-degree buckets:
		// returns 10, 20, 30, 40, etc...
		return 10 * Math.floor(dir / 10);
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

	function aggregateWindTime(hours)
	{
		// we receive the list of hours that the wind was blowing with a given
		// force (speed), and a given direction
		console.log("hours = " + hours.length);
		return hours.length / totalHours; // proportion of this wind
	}

	const view = new google.visualization.DataView(dt);

	view.setRows( view.getFilteredRows([
		{ column: 1, value: 60 } ])); // where period=60
	
	const range = view.getColumnRange(0);
	const totalHours = (range.max - range.min) / (60 * 60); // length of this time window in hours
	console.log("total hours = " + totalHours)
	
	const grouped = google.visualization.data.group(
		view,
        [ { column: 2,
			modifier: quantizeDirection,
            type: 'number' },
		{ column: 3,
			modifier: quantizeSpeed,
            type: 'string' }],
		// aggregate column: 
		[ { column: 0,
			aggregation: aggregateWindTime, 
			type: 'number' }]);

	// more tbd
	debugTable(grouped);
}


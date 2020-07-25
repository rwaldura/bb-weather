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
function windSpeed(dt, row, col, T)
{
	const P = dt.getValue(row, col);
	const V = wind_speed(P, T);
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
function groupWindData(dt, lookback /* minutes */, period /* minutes */)
{
	lookback *= 60;	// to seconds
	period *= 60;	// to seconds
	
	var view = new google.visualization.DataView(dt);

	// WHERE period=1 AND tstamp > 1 day ago
	view.setRows( view.getFilteredRows( [
		{ column: 1, value: 1 },
		{ column: 0, minValue: view.getColumnRange(0).max - lookback } ]));

	if (period > 1 * 60) // further grouping is necessary
	{
		// quantize into time windows of "period" seconds
		// see https://developers.google.com/chart/interactive/docs/reference#group 
		const grouped = google.visualization.data.group(
			view,
			// group by timestamp over the period given
			[{ column: 0,
				modifier: function(t) { return period * Math.floor(t / period) }, 
				type: 'number' }],
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
			
		view = new google.visualization.DataView(grouped);
	}

	view.setColumns([
		{ id: 'date_time', // timestamp, as a Date object
			type: 'datetime', 
			calc: function(dt, row) { const t = dt.getValue(row, 0); return new Date(t * 1000) } }, 
		{ id: 'speed_mph', 
			label: "Wind Speed",
			type: 'number', 
			calc: function(dt, row) { return windSpeed(dt, row, 3 /* revs */, period) } }, 
		{ id: 'point_style', 
			role: 'style',
			type: 'string', 
			calc: function(dt, row) { return dir2style(dt, row, 2 /* dir */, period / 60) } },
		{ id: 'point_tooltip', 
			role: 'tooltip', 
			properties: { html: true },
			type: 'string', 
			calc: function(dt, row) { return tooltip(dt, row, 0, 2, 3, period / 60) } } ]);

	return view;
}

/***************************************************************************
 * Get min, max, avg in the last timeperiod
 */
function getInstantMetrics(dt, lookback /* minutes */)
{
	period = 1 * 60; // group by minute
	
	const grouped = google.visualization.data.group(
		dt,
		// group by minute 
		[{ column: 0,
			modifier: function(t) { return period * Math.floor(t / period) }, 
			type: 'number' }],
		// aggregate columns: MIN(period), AVG(dir), SUM(revs)
		[ { column: 3,
			aggregation: google.visualization.data.min, 
			type: 'number' },
		{ column: 3,
			aggregation: google.visualization.data.avg, 
			type: 'number' },
		{ column: 3, 
			aggregation: google.visualization.data.max, 
			type: 'number' } ]);
		
	return { min: 1000, max: 3000, avg: 2000 };
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
	G.request.open("GET", "getDataTable.json", true);
	G.request.send();
	// the XHR onload handler is called next
}

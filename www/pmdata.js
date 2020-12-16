/*
 * Core functions that manipulate raw Particle Matter data. 
 */

/****************************************************************************/
function prepParticleData(dt, lookback /* minutes */, period /* minutes */)
{
	var view = new google.visualization.DataView(dt);

	// if (period == 2 || period == 60) // no need to group
	// {
	// 	view.setRows( view.getFilteredRows( [
	// 		{ column: PERIOD_COL, value: period },
	// 		{ column: TSTAMP_COL, minValue: view.getColumnRange(TSTAMP_COL).max - lookback * 60 } ]));
	// }
	// else // further grouping is necessary
	// {
		const basePeriod = 2; // (period < 60) ? 2 : 60;
		
		view.setRows( view.getFilteredRows( [
			{ column: PERIOD_COL, value: basePeriod },
			{ column: TSTAMP_COL, minValue: view.getColumnRange(TSTAMP_COL).max - lookback * 60 } ]));

		view = groupParticleData(view, period * 60);	
			
	// }

	view.setColumns([
		{ id: 'date_time', // timestamp, as a Date object
			type: 'datetime',
			calc: function(dt, row) { return new Date(1000 * dt.getValue(row, 0)) } },
		1, 2, 3 ]);

	return view;
}

/****************************************************************************/
function groupParticleData(dt, period /* seconds */)
{	
	const grouped = google.visualization.data.group(
		dt,
		// group by timestamp over the period given
		[ { column: 0,
			modifier: function(t) { return period * Math.floor(t / period) }, 
			type: 'number' } ],
		// aggregate columns: AVG(pm*_mc), AVG(tps)
		[ { column: 4, // pm25_mc
			aggregation: google.visualization.data.avg, 
			type: 'number' },
		{ column: 6, // pm10_mc
			aggregation: google.visualization.data.avg, 
			type: 'number' },
		{ column: 12, // tps
			aggregation: google.visualization.data.avg, 
			type: 'number' } ]);

	// debugTable(grouped);
			
	return new google.visualization.DataView(grouped);	
}

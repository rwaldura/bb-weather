/*
 * Units of measurement.
 */

// convert miles per hour...
const MPH_KMH = 1.609344;	// ... to kilometers per hour
const MPH_MS = 2.2352;		// ... to meters per second
const MPH_KNOTS = 0.868976;	// ... to knots

const UNITS_OF_MEASUREMENT = {
	"mph":   { unit: "mph",   label: "Miles per hour", format: function(v) { return Math.round(v) + " MPH"   }, convert: function(v) { return v             } },
	"kmh":   { unit: "kmh",   label: "Km/hour",        format: function(v) { return Math.round(v) + " km/h"  }, convert: function(v) { return v * MPH_KMH   } },
	"ms":    { unit: "ms",    label: "Meter/sec",      format: function(v) { return  v.toFixed(1) + " m/s"   }, convert: function(v) { return v / MPH_MS    } },
	"knots": { unit: "knots", label: "Knots",          format: function(v) { return Math.round(v) + " knots" }, convert: function(v) { return v * MPH_KNOTS } },
	// unused
	"C": { label: "Celsius",    format: function(t) { return t + "&deg;C" }, convert: function(t) { return t } },
	"F": { label: "Fahrenheit", format: function(t) { return t + "&deg;F" }, convert: function(t) { return 32 + (t * 9/5) } },
};


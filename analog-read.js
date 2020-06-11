const b = require('bonescript');
const AIN0 = 'P9_39';

setInterval(readAIN0, 1000);

function readAIN0(x)
{
	var value = b.analogRead(AIN0);
    console.log((value * 100).toFixed(1) + '%, ' + (1.8 * value).toFixed(1) + 'V');
	
}

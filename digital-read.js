const b = require('bonescript');
const GPIO7 = 'P9_42';

b.pinMode(
	GPIO7, 
	b.INPUT, 
	7, // magic mux mode
	'pulldown', // reed switch is open by default: use magnet to close it
	'fast', 
	function f(err, x) {
		if (err) {
			console.log('pin mode error: ' + err)
		} else {
			b.attachInterrupt(
				GPIO7, 
				true, // always call printStatus() upon interrupt event
				b.CHANGE, 
				printStatus)
		}
	});
	
function printStatus(err, x)
{
	if (err) {
		console.log("handler error: " + err)
	} else if (x.attached) {
		console.log("handler attached");
	} else if (x.value == 1) {
		console.log("switch is now open!");
	} else {
		console.log("switch is now closed");		
	}
}


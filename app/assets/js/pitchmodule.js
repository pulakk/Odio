// calculate pitch using YIN Autocorrelation Method
function get_yin_pitch(input_buffer, sampling_rate){
	// init
	let cm_diff_array;
	let tau_index;
	let pitch;

	// cumulative normalized _ squared difference _ array
	cm_diff_array = cm_normalize(get_sq_diff(input_buffer));

	// lag index of first drop in difference 
	tau_index = get_index_abs_t(cm_diff_array);

	// calculating frequency
	if(tau_index == 0)
		pitch = 0;
	else
		pitch = parseInt(sampling_rate/tau_index);

	return pitch;
}

// returns squared differences for each tau lag
function get_sq_diff(input_buffer){
	// squared differences
	let sq_diff = new Array(input_buffer.length);

	// initalise differences to zero
	for(let tau = 0; tau<sq_diff.length; tau++){
		sq_diff[tau] = 0;
	}

	// calculate differences for each tau
	for(let tau =1; tau<sq_diff.length; tau++){
		for(var j=0;j+tau<input_buffer.length;j++){
			// add over all pair of lag values
			sq_diff[tau] += SQR(input_buffer[j] - input_buffer[j+tau]);
		}
		// average difference
		sq_diff[tau] /= j;
	}

	// return array
	return sq_diff;
}

// get cumulative mean normalized differences
function cm_normalize(input_buffer){
	// init
	let currentSum =0;

	// normalize each value in array
	for(let tau=1; tau<input_buffer.length; tau++){
		currentSum += input_buffer[tau];
		input_buffer[tau] *= tau/currentSum;
	}

	// return updated values
	return input_buffer;
}

// get index of first drop w/ threshold
function get_index_abs_t(input_buffer){
	// init
	let threshold = 0.1;

	// maximum value in the input buffer
	let max = Math.max.apply(Math, input_buffer); 

	// find first drop greater than threshold
	for(let tau=1;tau<input_buffer.length;tau++){
		if(input_buffer[tau] < threshold * max && input_buffer[tau]<input_buffer[tau-1]){
			// continue further till minimum is found
			while(tau+1 < input_buffer.length && input_buffer[tau] > input_buffer[tau+1]){
				tau++;
			}
			// return index 
			return tau;
		}
	}

	// if no drop found return invalid index / 0 (period cannot be 0)
	return 0;
}

// square function
function SQR(value){
	return value*value;
}
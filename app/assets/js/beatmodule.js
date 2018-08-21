/* keras js model for beat type prediction */
function classifyBeat(input, process_output, curr_time){
	/* init */
	let model_path =  '/assets/models/model.bin';

	/* create new model predictor */
	predictor_model = new KerasJS.Model({
		filepath:model_path,
		filesystem:true,
		gpu:false
	})

	/* flatten array to float32 typed */
	let flattened_input = [].concat.apply([],input);

	/* when predictor ready */
	predictor_model.ready().then(() => {
		/* create data */
		const inputData = {
			input:new Float32Array(flattened_input)
		}
		/* predict using promise */
		return predictor_model.predict(inputData);

	}).then(outputData => {
		/* on output recieved, find ARG-MAX beat TYPE */
		let max = 0;
		let max_idx = 0;
		for(let i=0;i<outputData['output'].length;i++){
			if(outputData['output'][i]>max){
				max = outputData['output'][i];
				max_idx = i;
			}
		}
		
		/* do something with the output based on the input function */
		process_output(max_idx, curr_time);
	}).catch(err => {
		console.log(err);
	})
}
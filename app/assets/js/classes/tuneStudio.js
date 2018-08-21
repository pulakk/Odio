function tuneStudio(studio, canvas, record_button, play_button, reset_button, collection_container, collection, arena){
	/* default variables */
	this.WINDOW_SIZE = 2048;
	this.MIN_PITCH = 50;
	this.MAX_PITCH = 1000;

	this.CANVAS_WIDTH = 1000;
	this.CANVAS_HEIGHT = 600;
	this.MAX_HISTORY_LENGTH = this.CANVAS_WIDTH;

	this.JUMP_THRESHOLD = 16;
	this.BGCOLOR = '#eee';
	this.HIGHLIGHTCOLOR = '#555';
	this.TIME_DIVS = 20;
	this.MAX_ENERGY = 3000;

	/* reference divs */
	var thiz = this;
	this.studio = studio;
	this.record_button = record_button;
	this.play_button = play_button;
	this.reset_button = reset_button;
	this.collection_container = collection_container;
	this.collection = collection;
	this.arena = arena;

	/* context elements */
	this.canvas_ctx = canvas.getContext('2d');
	this.audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
	this.audio_analyser = this.audio_ctx.createAnalyser();
	this.tune_audio_ctx = new ( window.AudioContext || window.webkitAudioContext )();

	get_mic_access(this.audio_ctx, this.audio_analyser);

	/* other variables */
	this.pitch_history = new Array();

	// set buffer variables and window sizes
	this.audio_analyser.fftsize = thiz.WINDOW_SIZE;
	this.time_buffer = new Uint8Array(thiz.WINDOW_SIZE);
	this.freq_buffer = new Uint8Array(thiz.audio_analyser.frequencyBinCount);

	/* state variables */
	this.isPlaying = false;
	this.isRecording = false;
	this.playerInterval = null;
	this.selected_record = null;

	this.PLAY_STEP_IDX = 0;
	this.MAX_PLAY_STEP_IDX = 0;

	/* 

		F U N C T I O N S

	*/


	this.updateStudioList = function(){
		/* clear list */
		thiz.collection_container.empty();

		/* add header */
		thiz.collection_container.append("All Tunes");

		/* add tunes collection */
		for(let i=0;i<collection.records.length;i++){
			let tmp_list_item = $('<div class="studio-list-item tune-studio-item">'+collection.records[i].name+'</div>');
			this.collection_container.append(tmp_list_item);

			tmp_list_item.click(function(){
				/* remove highlight on 
					any other studio
					list item */
				thiz.removeListHighlights();

				/* select current tune */
				thiz.selectTune(collection.records[i]);
			})
		}
	}

	this.removeListHighlights = function(){
		$('.tune-studio-item').css({
			"background":"#fafafa"
		})
	}

	this.selectTune = function(tmp_record){
		thiz.selected_record = tmp_record;
		thiz.pitch_history = tmp_record.sequence.slice();
		thiz.canvasUpdate(thiz.canvas_ctx, thiz.pitch_history);
		this.MAX_PLAY_STEP_IDX = this.pitch_history.length;

		/* highlight selected record */
		$('div.tune-studio-item:contains("'+tmp_record.name+'")').css({
			"background":"#eee"
		})
	}

	/* removes too large 
		fluctuations in pitch */
	this.cleanNoise = function(){
		for(let i=1;i<thiz.pitch_history.length-1;i++){
			if(thiz.modDiff(i-1, i+1) <  thiz.JUMP_THRESHOLD){
				if(thiz.modDiff(i, i-1) > thiz.JUMP_THRESHOLD){
					thiz.pitch_history[i][0] = thiz.pitch_history[i-1][0];
				}
			}
		}
	}

	/* calculate positive difference */
	this.modDiff = function(i, j){
		let res = thiz.pitch_history[i][0] - thiz.pitch_history[j][0];
		if(res>0) return res;
		else return -res;
	}

	// update canvas context
	this.canvasUpdate = function(stepHighlight = -1){
		// background update
		thiz.canvas_ctx.fillStyle = thiz.BGCOLOR;
		thiz.canvas_ctx.fillRect(0,0,thiz.CANVAS_WIDTH, thiz.CANVAS_HEIGHT);

		// plot 
		let drawing = false;
		let stepHighlightSize = 6;
		thiz.canvas_ctx.lineWidth = 1;

		// plot data
		for(let i=0;i<thiz.pitch_history.length;i++){
			if( thiz.pitch_history[i][0] > thiz.MIN_PITCH && thiz.pitch_history[i][0] < thiz.MAX_PITCH){
				/* get variables */
				let pitch = ((thiz.pitch_history[i][0]-thiz.MIN_PITCH)/thiz.MAX_PITCH)*thiz.CANVAS_HEIGHT;

				/* set stroke color and plot*/
				thiz.canvas_ctx.strokeStyle = thiz.HIGHLIGHTCOLOR;

				if(i==stepHighlight)
					thiz.canvas_ctx.strokeRect(i, pitch-stepHighlightSize, 1, stepHighlightSize*2)
				else 
					thiz.canvas_ctx.strokeRect(i, pitch, 1, 1);
			}
		}

		thiz.canvas_ctx.stroke();
	}

	/*  Get sum of amplitudes of
	    all frequencies in audio_buffer  */
	this.getAmpSum = function(audio_buffer){
	    var sum = 0;
	    for(i=0;i<audio_buffer.length;i++){
	        sum += audio_buffer[i];
	    }
	    return Math.min(sum/thiz.MAX_ENERGY, 1);
	}

	/* one step of recording */
	this.recordStep = function(){
		/* get mic data */
		thiz.audio_analyser.getByteTimeDomainData(thiz.time_buffer);
		thiz.audio_analyser.getByteFrequencyData(thiz.freq_buffer);

		/* get pitch and energy */
		let pitch = get_yin_pitch(thiz.time_buffer, thiz.audio_ctx.sampleRate);
		let energy = thiz.getAmpSum(thiz.freq_buffer);

		/* save pitch to history */
		thiz.pitch_history.push([pitch, energy]);
		if(thiz.pitch_history.length > thiz.MAX_HISTORY_LENGTH)
			thiz.pitch_history.splice(0,1);

		/* update canvas */
		thiz.canvasUpdate(thiz.canvas_ctx, thiz.pitch_history);
	}

	/* stop retrieving pitch data */
	this.stopRecording = function(){
		/* clear record loop */
		clearInterval(thiz.recorderInterval);

		 /* clean noise and update canvas */
		thiz.cleanNoise();
		thiz.canvasUpdate(thiz.canvas_ctx, thiz.pitch_history);

		/* add tune to studio list */
		let new_record = new Record('tune-'+Date.now(), thiz.pitch_history, "tune");
		this.collection.add(new_record);
		thiz.arena.refreshCollection();

		thiz.updateStudioList();
		thiz.selectTune(new_record);
	}

	/* continue retrieving pitch data */
	this.startRecording = function(){
		/* set record loop */
		thiz.recorderInterval = window.setInterval(thiz.recordStep, thiz.TIME_DIVS);
	}

	/* one step of play loop */
	this.playStep = function(){
		/* udpate canvas show */
		thiz.canvasUpdate(thiz.PLAY_STEP_IDX);

		/* play tune */
		if(thiz.PLAY_STEP_IDX == 0){
			play_tune_seq(thiz.tune_audio_ctx, thiz.selected_record.sequence, thiz.TIME_DIVS);
		}

		/* increment play step index */
		thiz.PLAY_STEP_IDX = (thiz.PLAY_STEP_IDX+1)%thiz.MAX_PLAY_STEP_IDX;
	}

	this.stopPlaying = function(){
		thiz.play_button.html('<span class="glyphicon glyphicon-play"></span>');

		/* clear play loop */
		window.clearInterval(thiz.playerInterval);
	}

	this.startPlaying = function(){
		thiz.play_button.html('<span class="glyphicon glyphicon-stop"></span>');
		/* set play loop */
		thiz.PLAY_STEP_IDX = 0;
		thiz.playerInterval = window.setInterval(thiz.playStep, this.TIME_DIVS);
	}

	/* 

		E V E N T S

	 */

	 /* record tune */
	 this.record_button.click(function(){
	 	if(thiz.isRecording){
	 		/* stop playing*/
	 		thiz.stopRecording();
	 		thiz.isRecording = false;
	 		thiz.record_button.html('<span class="glyphicon glyphicon-record"></span>');
	 	}else{	
	 		/* start playing */
	 		thiz.startRecording();
	 		thiz.isRecording = true;
	 		thiz.record_button.html('<span class="glyphicon glyphicon-stop"></span>');
	 	}
	 })

	 /* play tune sequence */
	 this.play_button.click(function(){
	 	if(thiz.isPlaying){
	 		/* stop playing*/
	 		thiz.stopPlaying();
	 		thiz.isPlaying = false;
	 	}else{	
	 		/* start playing */
	 		thiz.startPlaying();
	 		thiz.isPlaying = true;
	 	}
	 })

	 /* reset tune data */
	 this.reset_button.click(function(){
	 	thiz.pitch_history.length = 0;
	 	thiz.canvasUpdate(thiz.canvas_ctx, thiz.pitch_history);
	 });

	 /* update studio list */
	 thiz.updateStudioList();
}
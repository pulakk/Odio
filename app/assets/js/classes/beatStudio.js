function beatStudio(studio, canvas, beat_plot, record_button, play_button, collection_container, collection, arena){
	var thiz = this;

	/* default variables */
	this.TIME_DIVS = 20;
	this.AMP_THRESHOLD = 60; /* Threshold amplitude */
	this.POS_SLOPE_THRESHOLD = 40; /* Threshold positive slope */
	this.NEG_SLOPE_THRESHOLD = -40; /* Threshold negative slope */
	this.N_FILTERS = 8;
	this.WINDOW_SIZE = 1024;
	this.CANVAS_WIDTH = 1000;
	this.CANVAS_HEIGHT = 300;
	this.BGCOLOR = '#eee';
	this.HIGHLIGHTCOLOR = '#faa';

	/* reference elements */
	this.studio = studio;
	this.canvas = canvas;
	this.canvas_ctx = document.getElementById(this.canvas.attr('id')).getContext('2d');
	this.record_button = record_button;
	this.play_button = play_button;
	this.beat_plot = beat_plot;
	this.collection_container = collection_container;
	this.collection = collection;
	this.arena = arena;
	this.player_bar = $('<div class="player_bar"></div>');

    /* audio visual elements */
    this.audio_ctx = new ( window.AudioContext || window.webkitAudioContext )();
    this.audio_analyser = this.audio_ctx.createAnalyser();
    this.audio_analyser.fftsize = this.WINDOW_SIZE;
    this.freq_buffer = new Uint8Array( this.audio_analyser.fftsize/2 );

    /* get access to microphone */
    get_mic_access(this.audio_ctx, this.audio_analyser);

	/* hide plot first */
	this.beat_plot.hide();

	/* state variables */
	this.prev_amp_sum = 0;
	this.beat_found = false;
	this.start_time = 0;
	this.curr_time = 0;
	this.tmp_beat = [];
	this.prev_fft = new Array(this.N_FILTERS);
	this.curr_record = [];
	this.selected_record = null;

	this.isRecording = false;
	this.isPlaying = false;
	this.recordInterval = null;

	this.playInterval = null;
	this.PLAY_STEP_IDX = 0;
	this.BEAT_RECORD_IDX = 0;
	this.MAX_PLAY_STEP_IDX = 0;

	/* 

		F U N C T I O N S

	*/

	/* set grid row coordinates */
	thiz.setGridRow = function(item, row, height = 1){
		item.css({"grid-row":row+'/'+(row+height)});
	}

	/* set grid column coordinates */
	thiz.setGridColumn = function(item, col, width = 1){
		item.css({"grid-column":col+'/'+(col+width)});
	}


	/* plot frequency 
		distribution */
	this.plot = function(board, values){
		/* reset */
		board.fillStyle =thiz.BGCOLOR;
		board.fillRect(0,0,thiz.CANVAS_WIDTH,thiz.CANVAS_HEIGHT);

		let fractionPlot = 3;

		/* draw graph */
	    var barWidth = thiz.CANVAS_WIDTH/values.length;
	    let barHeight = 0;
	    let x = 0;
	    for(let i=0;i<values.length;i+= fractionPlot){
	        barHeight = values[i] + 2;

	        board.fillStyle = 'rgb('+barHeight*2+','+barHeight*2+','+barHeight*2+')';
	        board.fillRect(x,(thiz.CANVAS_HEIGHT - barHeight)/2,1, barHeight)
	        x += barWidth*fractionPlot;
	    }
	}

	/* one step of recording, 
		performed every 
		TIME_DIVS seconds */
	this.recordStep = function(){
		/* get frequency data */
		thiz.audio_analyser.getByteFrequencyData( thiz.freq_buffer );

		/* calculate maximum amplitude */
		let max_amp = Math.max.apply( Math, thiz.freq_buffer );

		thiz.plot(thiz.canvas_ctx, thiz.freq_buffer);

		/* if greater than threshold */
		if(max_amp > thiz.AMP_THRESHOLD){
			/* calculate slope */
			let amp_slope = thiz.getAmpSum(thiz.freq_buffer) - thiz.prev_amp_sum;

			/* if slope big enough 
				and beat not started yet */
			if( amp_slope > thiz.POS_SLOPE_THRESHOLD && ! thiz.beat_found){
				/* find current time */
				thiz.curr_time = thiz.getCurrTime() - thiz.start_time;
				/* beat is found */
				thiz.beat_found = true;
			}

			/* if slope negative enough and 
				beat already started */
			if( amp_slope < thiz.NEG_SLOPE_THRESHOLD && thiz.beat_found){
				/* beat discontinued */
				thiz.beat_found = false;

				/* if valid beat observed */
				if(thiz.tmp_beat.length > 0){
					/* classify and record */
					classifyBeat(thiz.tmp_beat, thiz.storeBeat, thiz.curr_time);
					/* reset tmp_beat */
					thiz.tmp_beat.length = 0;
				}
			}

			/* if beat started */
			if( thiz.beat_found ){
				/* keep pushing data 
					to tmp_beat */
				if( thiz.tmp_beat.length < 8)
					thiz.tmp_beat.push( thiz.clamped_fft( thiz.filterBanked(thiz.freq_buffer ) ));
			}

			/* store amplitude sum
				for slope calculation */
			thiz.prev_amp_sum += amp_slope;
		}
	}

	/* stores the current beat */
	this.storeBeat = function( type, curr_time ){
		thiz.curr_record.push([curr_time, type]);
	}

	/* clamps fft components
		that have negative slope */
	this.clamped_fft = function (data){
	    let modf_fft = [];
	    for(let i=0;i<data.length;i++){
	    	/* if component slope less than -5 */
	        if(data[i] - thiz.prev_fft[i]< -5){
	        	/* clamp */
	            modf_fft[i] = 0;
	        }else{
	            modf_fft[i] = data[i];
	        }
	    }
	    thiz.prev_fft = data;
	    return modf_fft;
	}

	/* choose N_FILTERS filter 
		banks for dimensionality 
		reduction */
	this.filterBanked = function(data){
		// init
	    let resp_data = [];
	    let tmp_sum;
	    let filter_width = parseInt( data.length / thiz.N_FILTERS );

	    for( let i = 0; i < thiz.N_FILTERS; i++ ){
	        tmp_sum = 0;
	    	/* sum energies over each filter */
	        for( let j = i * filter_width; j < ( i+1 ) * filter_width; j++ ){
	            tmp_sum += data[j];
	        }
	        resp_data.push( parseInt( tmp_sum/( 1+filter_width ) ) );
	    }
	    return resp_data;
	}

	/*  Get sum of amplitudes of
	    all frequencies in audio_buffer  */
	this.getAmpSum = function(audio_buffer){
	    var sum = 0;
	    for(i=0;i<audio_buffer.length;i++){
	    	/* sum over all */
	        sum += audio_buffer[i];
	    }
	    return sum;
	}

	this.getCurrTime = function(){
		return parseInt(Date.now()/thiz.TIME_DIVS);
	}

	/* stop recording beat */
	this.stopRecording = function(){
		/* change button icon */
		thiz.record_button.html('<span class="glyphicon glyphicon-record"></span>');

		/* clear interval */
		window.clearInterval(thiz.recordInterval);

		console.log(thiz.curr_record)
		if(thiz.curr_record.length >0 )
		{
			/* add end of record */
			thiz.curr_record.push([thiz.curr_record[thiz.curr_record.length-1][0]+1,-1]);

			/* add beat to collection */
			let new_record = new Record('sample-'+thiz.getCurrTime(),thiz.curr_record, "beat");

			/* sort record and add
				to list of records */
			thiz.curr_record.sort(thiz.cmp);
			thiz.collection.add(new_record);		

			/* update displayed list */
			thiz.updateDisplayedList();

			/* select new record */
			thiz.selectRecord(new_record);}
	}

	this.cmp = function(a, b){
		if(a[0]>b[0])
			return 1;
		else 
			return -1;
	}

	this.selectRecord = function(given_record){
		/* set current record 
			to given */
		thiz.selected_record = given_record;
		thiz.plotBeat();
		thiz.setPlayMode();

		/* set max step */
		thiz.MAX_PLAY_STEP_IDX = thiz.selected_record.length;

		/* highlight selected record */
		$('div.beat-studio-item:contains("'+given_record.name+'")').css({
			"background":"#eee"
		})
	}

	/* set all studio list items to default color */
	this.setStudioListsDefault = function(){
		$('.beat-studio-item').css({
			"background":"#fafafa"
		})
	}

	/* start recording beat */
	this.startRecording = function(){
		/* change button icon */
		thiz.record_button.html('<span class="glyphicon glyphicon-stop"></span>');

		/* store start time */
		thiz.start_time = thiz.getCurrTime();
		
		/* start interval */
		thiz.recordInterval = window.setInterval(thiz.recordStep, thiz.TIME_DIVS);

		/* hide beat play mode and show recording mode */
		thiz.setRecordMode();
	}

	/* update studio 
		records list */
	this.updateDisplayedList = function(){
		/* clear and add header */
		thiz.collection_container.empty();
		thiz.collection_container.append('All Beats');

		/* add all studio list items to container */ 
		for(let i=0;i<thiz.collection.records.length;i++){
			let curr_list_item = $('<div class="studio-list-item beat-studio-item">'+thiz.collection.records[i].name+'</div>');
			thiz.collection_container.append(curr_list_item);

			/* on clicking list item
				show player area */
			curr_list_item.click(function(){
				/* highlight current clicked div
					and set others to default */
				thiz.setStudioListsDefault();

				/* select this record */
				thiz.selectRecord(thiz.collection.findRecord($(this).html()));

			})
		}

		/* refresh arena (add option) context menu list */
		thiz.arena.refreshCollection();
	}

	this.setRecordMode = function(){
		/* hide canvas */
		thiz.canvas.show();

		/* show beat plots */
		thiz.beat_plot.hide();
	}

	this.setPlayMode = function(){
		/* hide canvas */
		thiz.canvas.hide();

		/* show beat plots */
		thiz.beat_plot.show();
	}

	this.plotBeat = function(){
		/* clear play screen */
		thiz.beat_plot.empty();

		/* add player bar to plot */
		thiz.beat_plot.append(this.player_bar);

		/* set number of
			 grid columns */
		thiz.beat_plot.css({
			"grid-template-columns":"repeat("+thiz.selected_record.length+", 1fr)"
		});

		/* set beat points */
		for(let i=0;i<thiz.selected_record.sequence.length-1;i++){
			let curr_beat = $('<div class="beat_plot_item"></div>');
			thiz.beat_plot.append(curr_beat);

			let row = thiz.selected_record.sequence[i][1]+1;
			let column = thiz.selected_record.sequence[i][0]+1;
			thiz.setGridRow(curr_beat, row);
			thiz.setGridColumn(curr_beat, column);
		}

		/* set player height */
		thiz.setGridRow(thiz.player_bar, 1, Math.max.apply(Math, thiz.selected_record.sequence.map(x=>x[1])) + 1);
		thiz.setGridColumn(thiz.player_bar, 1);
	}

	/* one step of play
		mode */
	this.playStep = function(){
		/* move player bar to current step */
		thiz.setGridColumn(thiz.player_bar, thiz.PLAY_STEP_IDX);

		/* play beat */
		if(thiz.PLAY_STEP_IDX == thiz.selected_record.sequence[thiz.BEAT_RECORD_IDX][0]){
			play_beat(thiz.selected_record.sequence[thiz.BEAT_RECORD_IDX][1]);
			thiz.BEAT_RECORD_IDX = (thiz.BEAT_RECORD_IDX+1)%thiz.selected_record.sequence.length;
		}else if(thiz.selected_record.sequence[thiz.BEAT_RECORD_IDX][1] == -1)
			thiz.BEAT_RECORD_IDX = (thiz.BEAT_RECORD_IDX+1)%thiz.selected_record.sequence.length;

		/* increment play step index */
		thiz.PLAY_STEP_IDX = (thiz.PLAY_STEP_IDX + 1)%thiz.MAX_PLAY_STEP_IDX;
	}

	this.resetIndices = function(){
		this.PLAY_STEP_IDX = 0;
		this.BEAT_RECORD_IDX = 0;
	}

	/* stop playing beat */
	this.stopPlaying = function(){
		thiz.play_button.html('<span class="glyphicon glyphicon-play"></span>');
		/* clear play loop */
		window.clearInterval(thiz.playerInterval);
	}

	/* start playing beat */
	this.startPlaying = function(){
		thiz.play_button.html('<span class="glyphicon glyphicon-pause"></span>');
		/* set play loop */
		thiz.playerInterval = window.setInterval(thiz.playStep, thiz.TIME_DIVS);
	}

	/*

		E V E N T S

	*/

	/* on clicking 
		record button */
	this.record_button.click(function(){
		if(thiz.isRecording){
			/* stop recording */
			thiz.stopRecording();
			thiz.isRecording = false;
		}else{
			/* start recording */
			thiz.startRecording();
			thiz.isRecording = true;
		}
	})

	/* on clicking 
		play button */
	this.play_button.click(function(){
		if(thiz.isPlaying){
			/* stop playing */
			thiz.stopPlaying();
			thiz.isPlaying = false;
		}else{
			/* if some record selected */
			if(thiz.selected_record != null){
				/* start playing */
				thiz.resetIndices();
				thiz.startPlaying();
				thiz.isPlaying = true;
			}
		}
	})

	this.updateDisplayedList();
}
function Player(container, button){
	var thiz = this;

	/* 

		E L E M E N T S

	 */

	 /* contents */
	this.container = container;
	this.button = button;
	this.mergedBeatsIdx = 0;
	this.mergedTunesIdx = 0;
	this.tune_audio_ctx = new ( window.AudioContext || window.webkitAudioContext )();

	 /* default vars */
	this.TIME_DIVS = 20;
	this.MAX_STEP = ARENA_COLS;

	/* holding vars */
	this.play = false;
	this.step = 0;
	this.playerInterval = null;

	/* 

		F U N C T I O N S

	 */

	 this.playStep = () => {
	 	thiz.movePlayer();

	 	if(MergedBeats.length>0)
		 	while(thiz.step == MergedBeats[thiz.mergedBeatsIdx][0]){
		 		play_beat(MergedBeats[thiz.mergedBeatsIdx][1]);
		 		thiz.mergedBeatsIdx = (thiz.mergedBeatsIdx+1)%MergedBeats.length;
		 	}

		if(MergedTunes.length > 0)
		 	if(thiz.step == MergedTunes[thiz.mergedTunesIdx][0]){
		 		play_tune_seq(thiz.tune_audio_ctx, MergedTunes[thiz.mergedTunesIdx][1].sequence, thiz.TIME_DIVS);
		 		thiz.mergedTunesIdx = (thiz.mergedTunesIdx+1)%MergedTunes.length;
		 	}

	 	thiz.step = (thiz.step+1)%thiz.MAX_STEP;
	 }

	/* reset indices to zero*/
	 this.reset = function(){
		thiz.step = 0;
		thiz.mergedBeatsIdx = 0;
		thiz.mergedTunesIdx = 0;
	 }

	 /* move player 
	 	position indicator */
	 this.movePlayer = () => {
	 	let newPos = thiz.step/thiz.MAX_STEP * BeatArena.getWidth();
	 	thiz.container.css("left",newPos);
	 }

	 this.stop = function(){
		window.clearInterval(thiz.playerInterval);
		thiz.reset();

		/* change icon to play button */
		thiz.button.html('<span class="glyphicon glyphicon-play"></span>');
	 }

	 this.start = function(){
		thiz.playerInterval = window.setInterval(thiz.playStep, thiz.TIME_DIVS);
		BeatArena.resetWidth();
		TuneArena.resetWidth();

		/* change icon to pause button */
		thiz.button.html('<span class="glyphicon glyphicon-pause"></span>');
	 }

	/* 
		
		E V E N T S

	 */

	this.button.click( () => {
		/* if playing */
		if(thiz.play){
			/* stop playing */
			thiz.stop();
			thiz.play = false;
		}else{
			/* start playing */
			thiz.start();
			thiz.play = true;
		}
	});
}



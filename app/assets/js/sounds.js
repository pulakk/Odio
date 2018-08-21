var sounds = [	new Audio('/assets/sounds/Bass-Drum-2.wav'),
				new Audio('/assets/sounds/lg_snare.WAV'), 
				new Audio('/assets/sounds/Electronic-Kick-1.wav'), 
				new Audio('/assets/sounds/Dry-Kick.wav'), 
				new Audio('/assets/sounds/Bamboo.WAV'), 
				new Audio('/assets/sounds/Clap-1.wav')];

/* beat player */
function play_beat(type){
	if(type!=-1){
		sounds[type].pause();
		sounds[type].currentTime = 0;
		sounds[type].play();
	}
}

/* pitch player */
function play_tune_seq(audio_ctx, sequence, UNIT_TIME){
	/* initialisations */
	var output_osc = audio_ctx.createOscillator();
	var output_gain = audio_ctx.createGain();
	var frill_duration = 10;
	var frill_shift = 0;
	var target_freq = 0;
	var VOLUME = 1;
	UNIT_TIME/=1000;

	/*  connections */
	output_osc.connect(output_gain);
	output_gain.connect(audio_ctx.destination);

	/* output oscillator setup */
	output_osc.type = 'triangle';
	output_gain.gain.setValueAtTime(0, audio_ctx.currentTime);


	for(let i=0;i<sequence.length;i++){
		if( i % frill_duration < frill_duration/2){
			target_freq = sequence[i][0]*2 - frill_shift; 
		}else{
			target_freq = sequence[i][0]*2 + frill_shift; 
		}

		if(sequence[i][0] == -1){
			output_gain.gain.setTargetAtTime(0, audio_ctx.currentTime + i*UNIT_TIME, UNIT_TIME);
		}else{
			if(target_freq!=0)
				output_gain.gain.setTargetAtTime(sequence[i][1]*VOLUME*50/target_freq, audio_ctx.currentTime + i*UNIT_TIME, UNIT_TIME);
			else
				output_gain.gain.setTargetAtTime(0, audio_ctx.currentTime + i*UNIT_TIME, UNIT_TIME);
			output_osc.frequency.setTargetAtTime(target_freq, audio_ctx.currentTime + i*UNIT_TIME, UNIT_TIME);
		}
	}

	output_gain.gain.setTargetAtTime(0, audio_ctx.currentTime + sequence.length*UNIT_TIME, UNIT_TIME);

	output_osc.start();
	output_osc.stop(audio_ctx.currentTime + sequence.length*UNIT_TIME + 100*UNIT_TIME);
}

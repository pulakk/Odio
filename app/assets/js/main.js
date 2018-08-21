/* full list of unique 
	beats and tunes */
var AllBeats;
var AllTunes;

/* contains 
	list of all beats and
	tunes used in arena */
var BeatNodes = new ArenaNodeSet();
var TuneNodes = new ArenaNodeSet();

/* fully merged beats
	and tunes */
var MergedBeats = [];
var MergedTunes = [];
var player;

window.onload = function(){

	/* load sample beats and tunes */
	AllBeats = loadBeats();
	AllTunes = loadTunes();

	/* lists */
	TunesListDiv = $('#tune_list');
	BeatsListDiv = $('#beat_list');

	/* nodes */
	BeatNode = $('.beat_node');
	TuneNode = $('.tune_node');

	/* arenas */
	BeatArena = new Arena($('#beat_arena'), BeatsListDiv, AllBeats, BeatNodes, MergedBeats);
	TuneArena = new Arena($('#tune_arena'), TunesListDiv, AllTunes, TuneNodes, MergedTunes);

	/* player button */
	player = new Player($("#play_container"), $("#play_button"));

	/* studio buttons */
	createBeatButton = $('#create_beat');
	createTuneButton = $('#create_tune');

	/* studio elements */
	BeatStudioToggleButton = $('#beat_studio');
	TuneStudioToggleButton = $('#tune_studio');
	StudioBg = $('.studio-bg');

	/* hide studio elements 
		on load */
	BeatStudioToggleButton.hide();
	TuneStudioToggleButton.hide();

	/* show beat studio */
	createBeatButton.click(function(){
		BeatStudioToggleButton.show();
		player.stop();
	});

	/* show tune studio */
	createTuneButton.click(function(){
		TuneStudioToggleButton.show();
		player.stop();
	});

	/* on clicking background
		hide studios */
	StudioBg.click(function(){
		/* hide studios */
		BeatStudioToggleButton.hide();
		TuneStudioToggleButton.hide();
	});

	/* set up studios */
	BeatStudio = new beatStudio(BeatStudioToggleButton, $('#beat_canvas'), $('#beat_plot'), 
		$('#beat_record_button'), $('#beat_play_button'), $('#beat-studio-list-container'), AllBeats,
		BeatArena);
	TuneStudio = new tuneStudio(TuneStudioToggleButton, document.getElementById('tune_canvas'), 
		$('#tune_record_button'), $('#tune_play_button'), $('#tune_reset_button'), $('#tune-studio-list-container'), AllTunes,
		TuneArena);
}

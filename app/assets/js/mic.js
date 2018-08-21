/*  Get access to microphone
    and print status  */
function get_mic_access(audio_ctx, audio_analyser){
    navigator.mediaDevices.getUserMedia({ audio:true, video:false }) 
    .then(function( stream ){ 
        let source = audio_ctx.createMediaStreamSource( stream );
        source.connect ( audio_analyser ) ;
    })
    .catch( function( error ){ 
        console.log( 'Error Getting Microphone Access!\n'+error );
    });
}

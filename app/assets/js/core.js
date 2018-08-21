
/* adding div to an element */
function addDiv(elem, text, className, idx){
	/* if classname given then 
		add classname property to new div*/
	if( className != null )
		className = ' class = "'+className+'"';
	else
		className = '';

	/* if id given then add 
		id property to div */
	if( idx != null )
		idx = ' id = "'+idx+'"';
	else 
		idx = '';

	if( text == null)
		text = '';

	/* append and return new div */
	let new_div = $('<div '+className+idx+'>'+text+'</div>');
	elem.append(new_div);
	return new_div;
}
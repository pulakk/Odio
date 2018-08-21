/* a beat record 
	loaded or recorded
	 later */
function Record(name, sequence, type,pace=1){
	if(type=="beat")
		/* get last element time */
		this.length = sequence.slice(-1)[0][0];
	else if(type == "tune")
		this.length = sequence.length;

	this.sequence = sequence;
	this.pace = pace;
	this.name = name;

	this.setPace = function(new_pace){
		this.pace = new_pace;
	}
}


/* set of records */ 
function RecordSet(){
	var thiz = this;

	thiz.records = [];

	this.findRecord = function(name){
		for(let i=0;i<thiz.records.length;i++){
			if(thiz.records[i].name == name){
				return thiz.records[i];
			}
		}
	}

	this.add = function(newRecord){
		thiz.records.push(newRecord);
	}

	this.getLength = function(){
		return thiz.records.length;
	}
}
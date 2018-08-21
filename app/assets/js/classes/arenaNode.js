/* a beat node
	 in arena */
function ArenaNode(arena, name, xFrom, xTo, yFrom, allNodes, mergedSeq){
	var thiz = this;

	/* details */
	thiz.className = 'arena_node beat_node';
	thiz.name = name;
	thiz.xFrom = xFrom;
	thiz.xTo = xTo;
	thiz.yFrom = yFrom;
	thiz.yTo = yFrom+1; /* by default takes up only one row height */
	thiz.arena = arena;
	thiz.allNodes = allNodes;
	thiz.mergedSeq = mergedSeq;

	/* variables for 
		drag and move */
	thiz.moving = false;
	thiz.mouseXClickOffset = 0;

	/* create div and 
		append to arena */
	thiz.ref = $('<div class="' + thiz.className + '">'+thiz.name+'</div>');
	thiz.arena.ref.append(thiz.ref);

	/* move div element to 
		location */
	thiz.moveTo = function(x, y, height, width){
		/* save prev position */
		let xFrom = thiz.xFrom;
		let yFrom = thiz.yFrom;
		let xTo = thiz.xTo;
		let yTo = thiz.yTo;

		/* update x position, 
			y position, width and 
			height variables */
		thiz.xFrom = x;
		thiz.xTo = x+width;
		thiz.yFrom = y;
		thiz.yTo = y+height;

		/* check if moved position is invalid */
		if(thiz.checkOutOfBounds() || thiz.checkOverlap()){
			/* restore previous
				values */
			thiz.xFrom = xFrom;
			thiz.xTo = xTo;
			thiz.yFrom = yFrom;
			thiz.yTo = yTo;

			/* return function */
			return false;	
		}


		/* apply position, 
			width and height */
		thiz.ref.css({
			'grid-row':this.yFrom+'/'+this.yTo,
			'grid-column':this.xFrom+'/'+this.xTo
		})

		/* reset player */
		player.reset();

		/* successful move */
		return true;
	}

	/* update merged sequence */
	thiz.updateMergedSeq = () => {
		thiz.mergedSeq.length = 0;
		for(let i=0;i<thiz.allNodes.length;i++){
			/* get record info
				of node */
			let record;

			if(thiz.arena == BeatArena){
				record = AllBeats.findRecord(thiz.allNodes[i].name);
				/* add beat instances of each node and their time of play  */
				for(let j=0;j<record.sequence.length;j++){
					thiz.mergedSeq.push([thiz.allNodes[i].xFrom + record.sequence[j][0]-1, record.sequence[j][1]]);
				}
			}
			else{
				record = AllTunes.findRecord(thiz.allNodes[i].name);
				/* add all tune sequences and their start times */
				thiz.mergedSeq.push([thiz.allNodes[i].xFrom, record]);
			}

		}
		thiz.mergedSeq.sort(thiz.compare);
		// console.log(this.mergedSeq.map((x)=>{return x[0]}))
	}

	this.compare = (a, b) => {
		if (a[0]>b[0])
			return 1;
		else 
			return -1;
	}

	/* get width in grid coordinates */
	thiz.getGridWidth = function(){
		return thiz.xTo - thiz.xFrom;
	}

	/* get height in grid coordinates */
	thiz.getGridHeight = function(){
		return thiz.yTo - thiz.yFrom;
	}

	/* remove element */
	this.remove = function(){
		thiz.ref.remove();
	}

	/* if out of bounds
		return true */
	this.checkOutOfBounds = function(){
		if(thiz.xFrom <= 0 || thiz.xTo > thiz.arena.columns+1)
			return true;
		if(thiz.yFrom <= 0 || thiz.yTo > thiz.arena.rows+1)
			return true;
	}

	/* check whether node 
		overlaps other nodes */
	thiz.checkOverlap = function(){
		/* if overlap */
		for(let i=0;i<allNodes.length;i++){	
			/* if different node */
			if(allNodes[i] != thiz){
				/* if y overlaps */
				if(thiz.yTo > allNodes[i].yFrom && thiz.yFrom < allNodes[i].yTo){
					/* if x overlaps */
					if(thiz.xTo > allNodes[i].xFrom && thiz.xFrom < allNodes[i].xTo){
						/* return node overlaps ( true ) */
						return true;
					}
				}
			}
		}
		return false;
	}

	/* move node 
		at start */
	this.moveTo(thiz.xFrom, thiz.yFrom, thiz.yTo-thiz.yFrom, thiz.xTo-thiz.xFrom);

	/* drag node
		 */
	this.ref.on("mousedown", function(evt){
		thiz.moving = true; 
		/* get mouse x clicked offset on node */
		thiz.mouseXClickOffset = thiz.arena.getGridX(evt) - thiz.xFrom;
	});

	this.arena.ref.on("mouseleave mouseup", function(){
		if(thiz.moving == true){
			thiz.moving = false; 
			thiz.updateMergedSeq();
		}
	});

	/* on moved */
	this.arena.ref.on("mousemove", function(evt){
		if(thiz.moving == true){
			let mouseX = thiz.arena.getGridX(evt);
			let mouseY = thiz.arena.getGridY(evt);
			thiz.moveTo(mouseX - thiz.mouseXClickOffset, mouseY, thiz.getGridHeight(), thiz.getGridWidth());
		}

	})

}


/* set of all 
	arena nodes */
class ArenaNodeSet{
	constructor(){
		/* array of arena 
			nodes */
		this.nodes = [];
	}

	/* add new node
		to nodes array */
	add(newNode){
		this.nodes.push(newNode);
	}

	/* remove given node
		from set of nodes */
	remove(givenNode){
		for(let i=0;i<this.nodes.length;i++){
			if(this.nodes[i] == givenNode){
				this.nodes.splice(i, 1);
			}
		}
	}

	/* get length 
		of the nodes array */
	get length(){
		return this.nodes.length;
	}
}
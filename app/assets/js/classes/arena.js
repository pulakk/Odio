/* arena columns and 
	rows */
var ARENA_COLS = 1000;
var ARENA_ROWS = 6;

/* arena class */
function Arena(ref, listDiv, collection, allNodeSet, mergedSeq){

	/*


			V A R I A B L E S
	

	*/


	var thiz = this;

	/* set reference to 
		the div element */
	thiz.ref = ref;

	/* reference to related elements */
	thiz.listDiv = listDiv;
	thiz.collection = collection;
	thiz.allNodeSet = allNodeSet;
	thiz.mergedSeq = mergedSeq;
	this.container = $('#'+this.ref.attr('id')+'_container');

	/* variables */
	thiz.columns = ARENA_COLS;
	thiz.rows = ARENA_ROWS;
	thiz.zoom_amt = 50;

	/* saved mouse 
		x positions
		to show options */
	thiz.lastGridX = 0;
	thiz.lastGridY = 0;

	/*


			F U N C T I O N S
		

	*/

	this.refreshCollection = function(){
		/* updating list divs */
		thiz.listDiv.empty();

		/* add all beats to list div */
		for(let i=0;i<thiz.collection.records.length;i++){
			addDiv(thiz.listDiv, thiz.collection.records[i].name,'list_item');
		}
	}

	/* show context menu 
		add options */
	this.showOptions = function(evt){
		thiz.lastGridX = thiz.getGridX(evt);
		thiz.lastGridY = thiz.getGridY(evt);
		// console.log(thiz.lastMouseX)

		let xPos = evt.pageX;
		let yPos = evt.pageY;

		/* move list div to current position */
		thiz.listDiv.css({
			"top":yPos,
			"left":xPos
		})

		/* show beats list */
		thiz.listDiv.show();

		return false;
	}

	/* add node to arena
		on click of list div */
	this.addNode = function(){
		/* inner elements of the arena node */
		let delNodeElmt = $('<div class="removeIcon"><span class="glyphicon glyphicon-remove"></span></div>');

		/* create new node 
			and append to arena */
		let newNode = new ArenaNode(thiz, $(this).html(), 
							thiz.lastGridX, /* x from */
							thiz.collection.findRecord($(this).html()).length + thiz.lastGridX,  /* x to */
							thiz.lastGridY,	/* y from */
							thiz.allNodeSet.nodes, /* ref to all nodes */
							thiz.mergedSeq
							);

		/* check if new node is 
			in valid position,
			remove if invalid position */
		if(newNode.checkOverlap() || newNode.checkOutOfBounds())
			newNode.remove();
		else{/* else if valid */
			/* add to array */
			thiz.allNodeSet.add(newNode);
			/* update merged sequence
				to be played */
			newNode.updateMergedSeq();
			/* add delete option */
			newNode.ref.append(delNodeElmt);

			/* on clicking
				delete button */
			delNodeElmt.click(function(){
				/* remove node from 
					array of nodes */
				thiz.allNodeSet.remove(newNode);

				/* update merged nodes */
				newNode.updateMergedSeq();

				/* remove arena node */
				$(this).parent().remove();

				/* reset player */
				player.reset();
			})

			/* reset player after 
				adding node */
			player.reset();
		}

		/* hide list div */
		thiz.listDiv.hide();

	}

	/* get height 
		of the div */
	this.getHeight = function(){
		return parseInt(thiz.ref.css("height"));
	}

	/* get width 
		of the div */
	this.getWidth = function(){
		return parseInt(thiz.ref.css("width"));
	}

	/* set width
		of the div */
	this.setWidth = function(w){
		thiz.ref.css("width",w);
	}

	/* set height of the div */
	this.setHeight = function(h){
		thiz.ref.css("height",h)
	}

	/* zoom the div
		- basically increase 
			width of view */
	this.zoom = function(event){
		/* get new width */
		let new_width = thiz.getWidth() + event.deltaY * thiz.zoom_amt;

		/* check valid zoom width */
		if( new_width <= 2 * thiz.container.width()){
			if( new_width >= thiz.container.width())
				thiz.setWidth(new_width);
			else
				thiz.setWidth(thiz.container.width())
		}

		/* prevent default window scroll */
		return false;
	}

	/* get x grid 
		location
		of the mouse  */
	this.getGridX = function(evt){
		return parseInt(thiz.getRelXPos(evt)*thiz.columns/thiz.getWidth())+1;
	}

	/* get y grid
		location 
		of the mouse */
	this.getGridY = function(evt){
		return parseInt(thiz.getRelYPos(evt)*thiz.rows/thiz.getHeight())+1;
	}

	/* get relative 
		inner x 
		inside div */
	this.getRelXPos = function(evt){
		return evt.clientX - thiz.ref.offset().left;
	}

	/* get relative
		inner y
		inside div */
	this.getRelYPos = function(evt){
		return evt.clientY - thiz.ref.offset().top;
	}

	/* set grid columns count */
	this.setGridColumns = function(n){
		thiz.ref.css("grid-template-columns","repeat("+n+",1fr)");
	}

	/* set grid row height */
	this.setRowHeight = function(h){
		thiz.ref.css({"grid-auto-rows":h+'px'});
	}

	this.resetWidth = function(){
		thiz.setWidth(thiz.container.css("width"));
	}



	/* 


			E V E N T S
	


	*/

	/* zoom arena */
	this.ref.on("mousewheel",this.zoom);
	this.ref.on("contextmenu",this.showOptions);
	this.listDiv.on("click",".list_item",this.addNode);

	/* set up arena */
	// this.setGridLines();
	this.setGridColumns(this.columns);
	this.setRowHeight(this.getHeight()/this.rows-1);
	this.ref.on("mousemove",function(){thiz.listDiv.hide()});

	/* adjust arena width 
		on window resize */
	$(window).resize(() => {
		thiz.resetWidth();
	 	player.movePlayer();
	});

	/* refresh beat list options collection */
	this.refreshCollection();
}

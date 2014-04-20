var socket = io.connect();

var client = 0;

window.addEventListener("load",function() {

	//initializing the quintus engine that will show up on the page
	var Q = Quintus().include("Sprites, Input, Scenes, Anim, 2D, UI, Audio")
	Q.setup({maximize: true});

	//start websocket communications
	
	socket.on('message',function(data){

	client = data.clientID;
	console.log("Waiting for second Player");
	
	if(client == 2){
	
		socket.emit('Clients Connected',
		{		
			WindowWidth : window.innerWidth
		});
	}
	
	});
	
	//--------------------------------------------------------------
	//--------------------------------------------------------------
	//initalizing global variables used throughout

	var _newPos = 0;
	var _reedtard = 0;
	var _received = false;
	var _initial_position = 0;
	
	var _interval =  0; //the interval between movements

	var _mouse_x= 0; //global var used to get the mouse position x
	var _mouse_y = 0; //global var used to get the mouse positoin y
	
	var _window_height = window.innerHeight;
	var _window_width = window.innerWidth; 

	var _velocity_x = 0;
	var _velocity_y = 0;

	var _angle_player1 = 45; //inital angle of the player 1 cannon, also global
	var _angle_player2 = 225; //inital angle of the player 2 cannon

	var _scale_player1 = 1; //initial scales of player 1 and 2, used for powerups
	var _scale_player2 = 1; 

	var _score = _window_width/2; //score of the game

	//----------------------------------------------------------------
	//----------------------------------------------------------------
	//some helper functions used throughout

	function randomGoodFood() //determines the good food to load next
	{
		var rand = Math.floor((Math.random() * 3 ) + 1);

		console.log(rand);
		if(rand == 1)
			return "apple.png";
		else if(rand == 2)
			return "orange.png";
		else if(rand == 3)
			return "grape.png";
		else
			return "error";
	}

	function randomBadFood()
	{
		var rand = Math.floor((Math.random() * 3) + 1);

		if(rand == 1)
			return "beer.png";
		else if(rand == 2)
			return "steroids.png";
		else if(rand == 3)
		 	return "fries.png";
		else 
			return "error";
	}

	function randomPowerUP()
	{
		var rand = Math.floor((Math.random() * 2) + 1);

		if(rand == 1)
			return "rapidfire";
		else if(rand == 2)
			return "2xmulti";
		else if(rand == 3)
			return "2xscale";

	}

	function calcCanonAngle(player_id) //calculates the angle for player1/2 canons
	{
		if(player_id == 1) //if player 1
		{
			//do calculations
			_angle_player1 = Math.atan(_mouse_y/_mouse_x);
			_angle_player1 *= (180/Math.PI);
			
			//Send angle to server
			socket.emit('Angle1',
			{
				Angle:_angle_player1
				
			});
			
		}

		if(player_id == 2) //if player 2
		{
			//do calculations
			//also have to adjust for being on the top right corner of the screen
			var adjusted_x = _window_width - _mouse_x
			_angle_player2 = Math.atan(adjusted_x/_mouse_y);
			_angle_player2 *= (180/Math.PI);
			_angle_player2 += 90;
			
			socket.emit('Angle2',
			{
				Angle: _angle_player2
				
			});
			
		}
	}

	function getMousePosition(mp) //gets the current mouse position at the time called
	{
		_mouse_x = mp.pageX;
		_mouse_y = mp.pageY;

		if(client == 1){
		
			calcCanonAngle(1);
		}
			
		else if( client == 2) {
		
			calcCanonAngle(2);
		}

	}

	function shootFood(player_id) //function that handles the shooting based on player selection
	{
		if(player_id == 1) //if player 1
			shootGoodFood;
		else if(player_id == 2) //if player 2
			shootBadFood;
	}

	function shootGoodFood() //function used for player one shooting
	{

		socket.emit('goodFood',
		{
			GoodGuyPositionX : _mouse_x,
			GoodGuyPositionY : _mouse_y
		});
		
		//limiting the strength for the shot 
		if(_mouse_x > (_window_width/1.25))
			_mouse_x = _window_width/1.25;
		if(_mouse_y > (_window_height/1.25))
			_mouse_y = _window_height/1.25;

		_velocity_x = (_mouse_x);
		_velocity_y = (_mouse_y);

		Q.stage(1).insert(new Q.GoodFood()); //inserting the new food at point (0,0)

		var obj = Q.stage(1).locate(0,0); //creating a local variable to manipulate that object

		//moving the newly created sprite object to the start point which
		//is at the mouth of the canon
		var angle_rad = (_angle_player1 * Math.PI)/180;
		obj.p.x = Math.cos(angle_rad) * 125;
		obj.p.y = Math.sin(angle_rad) * 125;

		//setting the initial x and y velocities of the sprite
		obj.p.velocity_x = _velocity_x;
		obj.p.velocity_y = _velocity_y;



	}

	function shootBadFood() //function used for player two shooting
	{

		socket.emit('badFood',
		{
			BadGuyPositionX : _mouse_x,
			BadGuyPositionY : _mouse_y
		});
	
		//limiting the strength of the shot
		if(_mouse_x < (_window_width/4))
		 	_mouse_x = _window_width/4;
		if(_mouse_y > (_window_height/1.25))
			_mouse_y = _window_height/1.25;

		_velocity_x = ((_window_width) - _mouse_x); //some adjustments for being on top right
		_velocity_y = (_mouse_y);

		Q.stage(1).insert(new Q.BadFood()); //inserting a new food at point (0,0)

		var food = Q.stage(1).locate(0,0);

		//moving the new sprite obect to the start point at the mouth of the canon
		var angle_rad = (_angle_player2 * Math.PI)/180; //converting player 2 angle to radian
		food.p.x = (Math.cos(angle_rad) * 125) + _window_width;
		food.p.y = Math.sin(angle_rad) * 125;

		food.p.velocity_x = -_velocity_x; //velocity is set to negative since its moving left
		food.p.velocity_y = _velocity_y;
		

		
	}
	//-------------------------------------------------------------------
	//-------------------------------------------------------------------
	// Quintus sprite decleration/definitions

	Q.Sprite.extend("Fatty", {
	init: function(p) {
		var pos_fatty = _initial_position; //the position fatty starts at
	  	this._super({
	    	asset: "fatty.png",
	    	x: pos_fatty,
	    	y: 300,
	    	velocity_x: 0,
	    	g: 9800
	  });

	    this.add("tween, 2d");

	},

		step: function(dt) {

		  _interval--;

			socket.on('New Interval-Position', function(data){
				
				_interval = data.FattyInterval;
				_newPos = data.FattyPosition; 
		});
		  
		  
		  if(_interval == 0)
		  {
		  
			socket.emit('Request Interval-Position');
		
			socket.on('New Interval-Position', function(data){
			
				_interval = data.FattyInterval;
				_newPos = data.FattyPosition; 
		
			});
			
		      //moving fatty to the new position once the interval is finished, takes 2 seconds and accelerates and decelearates
		      this.animate({ x : _newPos}, 2, Q.Easing.Quadratic.InOut);  
		  }
		}
	});

	Q.Sprite.extend("GoodFood", {
		init: function(p) {
			var food = randomGoodFood();
			this._super({
				asset: food,
				velocity_x: 0,
				velocity_y: 0,
				g: 1000
			});

		this.add("tween");

		this.on("hit.sprite", function(collision) {

		socket.on('updatedScore',function(data){
				
					_score = data.Score
				});	
		
			if(collision.obj.isA("Fatty")) {
				this.destroy();
				_score += 5;
			
				//Send the score to the server
				socket.emit('goodFoodHit',
				{
					Score : _score
				})
				
				socket.on('updatedScore',function(data){
			
					_score = data.Score
				});
			
			}

			// else if(collision.obj.isA("Food")) {
			// 	this.p.velocity_x *=-1;
			// }
		})

		},

		step: function(dt){

			this.p.velocity_y += this.p.g * dt;
			this.p.y += this.p.velocity_y * dt;
			this.p.x += this.p.velocity_x * dt;

			if(this.p.y >= _window_height + 100)
				this.destroy();

		}

	})

	Q.Sprite.extend("BadFood", {
		init: function(p) {
			var food = randomBadFood();
			this._super({
				asset: food,
				velocity_x: 0,
				velocity_y: 0,
				g: 1000
			});

		this.add("tween");

		this.on("hit.sprite", function(collision) {
		
		socket.on('updatedScore',function(data){
				
					_score = data.Score
				});	
				
			if(collision.obj.isA("Fatty")) {
				this.destroy();
				_score -= 5;
				
				//Send the score to the server
				socket.emit('badFoodHit',
				{
					Score : _score
				})
				
				socket.on('updatedScore',function(data){
				
					_score = data.Score
				});	
				
			}

			 else if(collision.obj.isA("PowerUP_2xscale")) {
				_scale_player2 = 10;
				this.destroy();
			 }
		})

		},

		step: function(dt){

			this.p.velocity_y += this.p.g * dt;
			this.p.y += this.p.velocity_y * dt;
			this.p.x += this.p.velocity_x * dt;

			if(this.p.y >= _window_height + 100)
				this.destroy();

		}

	})

	Q.Sprite.extend("Player1", {
		init: function(p) {
			this._super({
				asset: "cannon.png",
				x: 0,
				y: 0,
				angle: 45
			})
		if( client == 1){
			socket.on('drawBadFood',function(data){
			
				//limiting the strength of the shot
				if(data.BadGuyPositionX< (_window_width/4))
					data.BadGuyPositionX = _window_width/4;
				if(data.BadGuyPositionY > (_window_height/1.25))
					data.BadGuyPositionY = _window_height/1.25;

				_velocity_x = ((_window_width) - data.BadGuyPositionX); //some adjustments for being on top right
				_velocity_y = (data.BadGuyPositionY);

				Q.stage(1).insert(new Q.BadFood()); //inserting a new food at point (0,0)

				var food = Q.stage(1).locate(0,0);

				//moving the new sprite obect to the start point at the mouth of the canon
				var angle_rad = (_angle_player2 * Math.PI)/180; //converting player 2 angle to radian
				food.p.x = (Math.cos(angle_rad) * 125) + _window_width;
				food.p.y = Math.sin(angle_rad) * 125;

				food.p.velocity_x = -_velocity_x; //velocity is set to negative since its moving left
				food.p.velocity_y = _velocity_y;
			
			});
		}
		if( client == 1){
			//	document.onmousemove = getMousePosition;
				document.onmousedown = shootGoodFood;
			}
		},

		step: function(dt) {
			if( client == 1){
				document.onmousemove = getMousePosition;
				//document.onmousedown = shootGoodFood;
			}
			socket.on('AngleUpdate2', function(data){
			
				_angle_player2 = data.Angle
			});
			
			this.p.angle = _angle_player1;
		}
	})

	Q.Sprite.extend("Player2", {
		init: function(p) {
			this._super({
				asset: "cannon.png",
				x: _window_width,
				y: 0,
				angle: 225
			})
		
			if ( client == 2){
				socket.on('drawGoodFood',function(data){
			
				if(data.GoodGuyPositionX > (window.innerWidth/1.25))
					data.GoodGuyPositionX = window.innerWidth/1.25;
				if(data.GoodGuyPositionY > (window.innerHeight/1.25))
					data.GoodGuyPositionY = window.innerHeight/1.25;

				_velocity_x = (data.GoodGuyPositionX);
				_velocity_y = (data.GoodGuyPositionY);

				Q.stage(1).insert(new Q.GoodFood());

				var obj = Q.stage(1).locate(0,0);

				//moving the newly created sprite object to the start point which
				//is at the mouth of the canon
				var angle_rad = (_angle_player1 * Math.PI)/180;
				obj.p.x = Math.cos(angle_rad) * 125;
				obj.p.y = Math.sin(angle_rad) * 125;

				//setting the initial x and y velocities of the sprite
				obj.p.velocity_x = _velocity_x;
				obj.p.velocity_y = _velocity_y;
			
		});
		}
		},

		
		
		
		step: function(dt) {
			if( client == 2){
				document.onmousemove = getMousePosition;
				document.onmousedown = shootBadFood;
			}
			
			socket.on('AngleUpdate1', function(data){
			
				_angle_player1 = data.Angle
			});
			
			this.p.angle = _angle_player2;
		}
	})

	Q.Sprite.extend("Floor", {
		init: function(p) {
			this._super({
				asset: "floor.png",
				x: 500,
				y: _window_height
			})
		}
	})

	Q.Sprite.extend("ScoreMarker", {
		init: function(p) {
			this._super({
				asset: "stick.png",
				x: _window_width/2,
				y: _window_height - 50
			})
		},

		step: function(dt){
			this.p.x = _score;

			if(_score >= (_window_width/2 + 500))
				Q.stageScene("endGame",1, { label: "Player 1 Won!" });

			if(_score <= (_window_width/2 - 500))
				Q.stageScene("endGame",1, { label: "Player 2 Won!"});


		}
	})


	Q.Sprite.extend("View", {
		init:function(p) {
			this._super({
				asset: "view.png",
				x: _window_width/2,
				y: _window_height/2
			})
		},

		step: function(dt){
			this.p.x += .5;
		}
	})

	Q.Sprite.extend("ProgBar", {
		init:function(p) {
			this._super({
				asset: "progbar.png",
				x: _window_width/2,
				y: _window_height - 50

			})
		}
	})

	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------
	//Quintus scene definitions

	Q.scene('endGame',function(stage) {
	  var box = stage.insert(new Q.UI.Container({
	    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
	  }));
	  
	  var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
	                                           label: "GGWP" }))         
	  var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
	                                        label: stage.options.label }));
	  button.on("click",function() {
	    Q.clearStages();
		Q.stageScene("cannnon",2);
		Q.stageScene("level1", 1);
		Q.stageScene("level2", 0);
	  });
	  box.fit(20);
	});


	Q.scene("level1",function(stage) {

		//var reedtard = stage.insert(new Q.Fatty());

		var floor = stage.insert(new Q.Floor());
		var prog_bar = stage.insert(new Q.ProgBar());
		var score = stage.insert(new Q.ScoreMarker());

		socket.on('Game Start', function(data){
		
			_received = true;
			_interval = data.InitialInterval;
			_initial_position = data.InitialPosition;
			 
			if(_reedtard == 0){
				
				_reedtard = stage.insert(new Q.Fatty());
			}
			
		});
		
		if( client == 2 && _received == false){
		
			socket.emit('Resend Interval-Position');
		}
		
	});

	Q.scene("level2", function(stage) {
	stage.insert(new Q.Repeater({ asset: "sky.png",
										repeatX: true,
										repeatY: true,
										speedX: 4,
										type: 0
										}));

	var view = stage.insert(new Q.View());
	stage.add("viewport").follow(view);

});

	Q.scene("P1", function(stage) {

		//var player_1 = stage.insert(new Q.Player1());
		//var player_2 = stage.insert(new Q.Player2());
		var player_1 = stage.insert(new Q.Player1());
	})

	Q.scene("P2", function(stage){

		var player_2 = stage.insert(new Q.Player2());
	})

	//-----------------------------------------------------------------
	//-----------------------------------------------------------------
	//Quintus loading all assets and executing the game code

	Q.load("fatty.png, apple.png, beer.png, orange.png, grape.png, steroids.png, fries.png, floor.png, sky.png, stick.png, view.png, progbar.png, cannon.png, 2xscale.png",function() {
		Q.stageScene("P2", 3);
		Q.stageScene("P1",  2);
		Q.stageScene("level1", 1);
		Q.stageScene("level2", 0);

	});
});


// STATIC POWER-UPS APPEAR FEQUENTLY

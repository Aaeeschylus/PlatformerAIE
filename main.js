var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();

// This function will return the time in seconds since the function 
// was last called
// You should only call this function once per frame
function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();

		// Find the delta time (dt) - the change in time since the last drawFrame
		// We need to modify the delta time to something we can use.
		// We want 1 to represent 1 second, so if the delta is in milliseconds
		// we divide it by 1000 (or multiply by 0.001). This will make our 
		// animations appear at the right speed, though we may need to use
		// some large values to get objects movement and rotation correct
	var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;
	
		// validate that the delta is within range
	if(deltaTime > 1)
		deltaTime = 1;
		
	return deltaTime;
}

//-------------------- Don't modify anything above here

var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;

var startScreenBackground = [];
var finishScreenBackground = [];
var endScreenBackground = [];
var gameScreenBackground = [];

var startScreen = document.createElement("img");
startScreen.src = "startscreen.png";

var finishScreen = document.createElement("img");
finishScreen.src = "finishscreen.png";

var gameOverScreen = document.createElement("img");
gameOverScreen.src = "endgame.png";

var gameBackground = document.createElement("img");
gameBackground.src = "gamebackground.png";

var heartImage = document.createElement("img");
heartImage.src = "heartSmall.png";

for(var y=0;y<1;y++)
{
	startScreenBackground[y] = [];
	for(var x=0; x<1; x++)
		startScreenBackground[y][x] = startScreen;
}

for(var y=0;y<1;y++)
{
	gameScreenBackground[y] = [];
	for(var x=0; x<1; x++)
		gameScreenBackground[y][x] = gameBackground;
}

for(var y=0;y<1;y++)
{
	finishScreenBackground[y] = [];
	for(var x=0; x<1; x++)
		finishScreenBackground[y][x] = finishScreen;
}

for(var y=0;y<1;y++)
{
	endScreenBackground[y] = [];
	for(var x=0; x<1; x++)
		endScreenBackground[y][x] = gameOverScreen;
}
// some variables to calculate the Frames Per Second (FPS - this tells use
// how fast our game is running, and allows us to make the game run at a 
// constant speed)
var fps = 0;
var fpsCount = 0;
var fpsTime = 0;

var kills = 0;
var lives = 3;
var deaths = 0;

var player = new Player();
var keyboard = new Keyboard();

var enemies = [];
var bullets = [];

var LAYER_COUNT = 4;
var LAYER_BACKGROUND = 0;
var LAYER_AESTHETICS = 1;
var LAYER_PLATFORMS = 2;
var LAYER_LADDERS = 3;

var LAYER_OBJECT_ENEMIES = 4;
var LAYER_OBJECT_TRIGGERS = 5;

var MAP = {tw: 200, th: 80};
var TILE = 32;
var TILESET_TILE = TILE;
var TILESET_PADDING = 0;
var TILESET_SPACING = 0;
var TILESET_COUNT_X = 8;
var TILESET_COUNT_Y = 8;

// abitrary choice for 1m
var METER = TILE;
 // very exaggerated gravity (6x)
var GRAVITY = METER * 9.8 * 6;
 // max horizontal speed (10 tiles per second)
var MAXDX = METER * 15;
 // max vertical speed (15 tiles per second)
var MAXDY = METER * 15 * 3.5;
 // horizontal acceleration - take 1/2 second to reach maxdx
var ACCEL = MAXDX * 2;
 // horizontal friction - take 1/6 second to stop from maxdx
var FRICTION = MAXDX * 6;
 // (a large) instantaneous jump impulse
var JUMP = METER * 1800;

var ENEMY_MAXDX = METER * 5;
var ENEMY_ACCEL = ENEMY_MAXDX * 2;

var tileset = document.createElement("img");
tileset.src = "customTileSet.png";

function cellAtPixelCoord(layer, x,y)
{
	if(x<0 || x>SCREEN_WIDTH || y<0)
		return 1;
	// let the player drop of the bottom of the screen (this means death)
	if(y>SCREEN_HEIGHT)
		return 0;
	return cellAtTileCoord(layer, p2t(x), p2t(y));
};

function cellAtTileCoord(layer, tx, ty)
{
	if(tx<0 || tx>=MAP.tw || ty<0)
		return 1;
	// let the player drop of the bottom of the screen (this means death)
	if(ty>=MAP.th)
		return 0;
	return cells[layer][ty][tx];
};

function tileToPixel(tile)
{
	return tile * TILE;
};

function pixelToTile(pixel)
{
	return Math.floor(pixel/TILE);
};

function bound(value, min, max)
{
	if(value < min)
		return min;
	if(value > max)
		return max;
	return value;
}

//side scrolling (vertically and horizontally)
var worldOffsetX = 0;
var worldOffsetY = 0;
function drawMap()
{
	var startX = -1;
	var startY = -1
	var maxTilesX = Math.floor(SCREEN_WIDTH / TILE) + 2;
	var maxTilesY = Math.floor(SCREEN_HEIGHT / TILE) + 2;
	var tileX = pixelToTile(player.position.x);
	var tileY = pixelToTile(player.position.y);
	var offsetX = TILE + Math.floor(player.position.x%TILE);
	var offsetY = TILE + Math.floor(player.position.y%TILE);

	startX = tileX - Math.floor(maxTilesX / 2);
	startY = tileY - Math.floor(maxTilesY / 2);
	
	if(startX < -1)
	{
		startX = 0;
		offsetX = 0;
	}
	if(startX > MAP.tw - maxTilesX)
	{
		startX = MAP.tw - maxTilesX + 1;
		offsetX = TILE;
	}
	worldOffsetX = startX * TILE + offsetX;

	if(startY < -1)
	{
		startY = 0;
		offsetY = 0;
	}
	if(startY > MAP.th - maxTilesY)
	{
		startY = MAP.th - maxTilesY + 1;
		offsetY = TILE;
	}
	worldOffsetY = startY * TILE + offsetY;
	
	for( var layerIdx=0; layerIdx < LAYER_COUNT; layerIdx++ )
	{
		for( var y = startY; y < startY + maxTilesY; y++ )
		{
			var idx = y * level1.layers[layerIdx].width + startX;
			for( var x = startX; x < startX + maxTilesX; x++ )
			{
				if( level1.layers[layerIdx].data[idx] != 0 )
				{
					// the tiles in the Tiled map are base 1 (meaning a value of 0 means no tile),
					// so subtract one from the tileset id to get the correct tile
					var tileIndex = level1.layers[layerIdx].data[idx] - 1;
					var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) * (TILESET_TILE + TILESET_SPACING);
					var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) * (TILESET_TILE + TILESET_SPACING);
					context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE,(x-startX)*TILE - offsetX, (y-startY)*TILE - offsetY, TILESET_TILE, TILESET_TILE);
				}
				idx++;
			}
		}
	}
}

function intersects(x1, y1, w1, h1, x2, y2, w2, h2)
{
	if(y2 + h2 < y1 ||
		x2 + w2 < x1 ||
		x2 > x1 + w1 ||
		y2> y1 + h1)
	{
		return false;
	}
	return true;
}

var musicBackgroud;
var sfxFire;
var cells = []; // the array that holds our simplified collision data
function initialize() 
{
	for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) 
	{
	// initialize the collision map
		cells[layerIdx] = [];
		var idx = 0;
		for(var y = 0; y < level1.layers[layerIdx].height; y++) 
		{
			 cells[layerIdx][y] = [];
			 for(var x = 0; x < level1.layers[layerIdx].width; x++) 
			 {
				 if(level1.layers[layerIdx].data[idx] != 0)
				 {
					 // for each tile we find in the layer data, we need to create a collision.
					 // no longer 4 collisions as I have used a different tile set, where each
					 // tile is no longer the equivalent of a 2x2 tile area, instead, is a 1x1.
					cells[layerIdx][y][x] = 1;
				}
				else if(cells[layerIdx][y][x] != 1) 
				{
				// if we haven't set this cell's value, then set it to 0 now
					cells[layerIdx][y][x] = 0;
				}
				idx++;
			}
		}
	}
	
	// initialize trigger layer in collision map
	cells[LAYER_OBJECT_TRIGGERS] = [];
	idx = 0;
	for(var y = 0; y < level1.layers[LAYER_OBJECT_TRIGGERS].height; y++) 
	{
		cells[LAYER_OBJECT_TRIGGERS][y] = [];
		for(var x = 0; x < level1.layers[LAYER_OBJECT_TRIGGERS].width; x++) 
		{
			if(level1.layers[LAYER_OBJECT_TRIGGERS].data[idx] != 0) 
			{
				cells[LAYER_OBJECT_TRIGGERS][y][x] = 1;
				cells[LAYER_OBJECT_TRIGGERS][y-1][x] = 1;
				cells[LAYER_OBJECT_TRIGGERS][y-1][x+1] = 1;
				cells[LAYER_OBJECT_TRIGGERS][y][x+1] = 1;
			}
			else if(cells[LAYER_OBJECT_TRIGGERS][y][x] != 1) 
			{
				// if we haven't set this cell's value, then set it to 0 now
				cells[LAYER_OBJECT_TRIGGERS][y][x] = 0;
			}
		idx++;
		}
	}

	
	//adding enemies
	idx = 0;
	for(var y = 0; y < level1.layers[LAYER_OBJECT_ENEMIES].height; y++) 
	{
		for(var x = 0; x < level1.layers[LAYER_OBJECT_ENEMIES].width; x++) 
		{
			if(level1.layers[LAYER_OBJECT_ENEMIES].data[idx] != 0) 
			{
				var px = tileToPixel(x);
				var py = tileToPixel(y);
				var e = new Enemy(px, py);
				enemies.push(e);
			}
			idx++;
		}
	}
	
	//setting music
	musicBackground = new Howl(
	{
		urls: ["background.ogg"],
		loop: true,
		buffer: true,
		volume: 0.5
	});
	musicBackground.play();
	
	sfxFire = new Howl(
	{
		urls:["fireEffect.ogg"],
		buffer: true,
		volume: 1,
		onend: function() 
		{
			isSfxPlaying = false;
		}
	});
}

var deathTimer = 0.00001
function runSplash(deltaTime)
{
	if(keyboard.isKeyDown(keyboard.KEY_SPACE) == true)
	{
		gameState = STATE_GAME;
		return;
	}
	
	for(var y=0; y<1; y++)
		{
			for(var x=0; x<1; x++)
			{
				context.drawImage(startScreenBackground[y][x], x*1, y*1);
			}
		}
	
	deaths = 0;
	
	context.fillStyle = 'white';
	context.strokeStyle = 'black';
	
	context.font="36px Verdana";
	context.fillText("Chuck Norris: The Platformer", 60, 240);
	context.strokeText("Chuck Norris: The Platformer", 60, 240);
	
	context.fillText("Press 'Space' key to begin!", 80, 280);
	context.strokeText("Press 'Space' key to begin!", 80, 280);

}
function runGame(deltaTime)
{
	for(var y=0; y<1; y++)
		{
			for(var x=0; x<1; x++)
			{
				context.drawImage(gameScreenBackground[y][x], x*1, y*1);
			}
		}
	player.update(deltaTime);
	drawMap();
	player.draw();
	
		
		
	// update the frame counter 
	fpsTime += deltaTime;
	fpsCount++;
	if(fpsTime >= 1)
	{
		fpsTime -= 1;
		fps = fpsCount;
		fpsCount = 0;
	}	

	var hit=false;
	for(var i=0; i<bullets.length; i++)
	{
		bullets[i].update(deltaTime);
		if( bullets[i].position.x - worldOffsetX < 0 ||	bullets[i].position.x - worldOffsetX > SCREEN_WIDTH)
		{
			hit = true;
		}
		for(var j=0; j<enemies.length; j++)
		{
			if(intersects( bullets[i].position.x, bullets[i].position.y, TILE, TILE,
			 enemies[j].position.x, enemies[j].position.y, TILE, TILE) == true)
			{
				// kill both the bullet and the enemy
				enemies.splice(j, 1);
				hit = true;
				// increment the player score
				kills += 1;
				break;
			}
		}
		if(hit == true)
		{
			bullets.splice(i, 1);
			break;
		}
	}
	
	
	for(var i=0; i<enemies.length; i++)
	{
		var hitPlayer = intersects(enemies[i].position.x, enemies[i].position.y, TILE, TILE, player.position.x, player.position.y, TILE, TILE)
		if(hitPlayer == true)
		{
			player.position.set( 7.5*32, 73*32 );
			lives = lives - 1;
			gameState = STATE_DEATH;
		}
	}
	
	
	for(var i=0; i<bullets.length; i++)
	{
		bullets[i].update(deltaTime);
		bullets[i].draw();
	}
	
	for(var i=0; i<lives; i++)
	{
		context.drawImage(heartImage, 20 + ((heartImage.width+2)*i), 10)
	}
	
	for(var i=0; i<enemies.length; i++)
	{
		enemies[i].update(deltaTime);
		enemies[i].draw();
	}
	
	context.fillStyle = 'white';
	context.strokeStyle = 'black';
	context.font = '32px Arial';
	var scoreText = 'Kills: ' + kills;
	context.fillText(scoreText, SCREEN_WIDTH - 170, 35)
	context.strokeText(scoreText, SCREEN_WIDTH - 170, 35)
	
	// draw the FPS
	context.fillStyle = "#f00";
	context.font="14px Arial";
	context.fillText("FPS: " + fps, 5, 20, 100);
}

function runDeathSlide(deltaTime)
{
	deathTimer -= deltaTime;
	if(deathTimer <= 0)
	{
		if(lives == 0)
		{
			gameState = STATE_GAMEOVER;
		}
		else
		{
		gameState = STATE_GAME;
		return;
		}
	}
}

function runGameOver(deltaTime)
{
	for(var y=0; y<1; y++)
		{
			for(var x=0; x<1; x++)
			{
				context.drawImage(endScreenBackground[y][x], x*1, y*1);
			}
		}
		
	//Writing the text on the screen
	context.fillStyle = 'white';
	context.strokeStyle = 'black';
	
	context.font="32px Verdana";
	context.fillText("You got " + kills + " kills!", 200, 300);
	context.strokeText("You got " + kills + " kills!", 200, 300);
	
	context.font="26px Verdana";
	context.fillText("Press F5 to restart!", 200, 330);
	context.strokeText("Press F5 to restart!", 200, 330);
}

function runVictory(deltaTime)
{
	for(var y=0; y<1; y++)
		{
			for(var x=0; x<1; x++)
			{
				context.drawImage(finishScreenBackground[y][x], x*1, y*1);
			}
		}
		
	context.fillStyle = 'white';
	context.strokeStyle = 'black';
	
	context.font="32px Verdana";
	context.fillText("CONGRATULATIONS!!! YOU WON!!!", 30, 270);
	context.strokeText("CONGRATULATIONS!!! YOU WON!!!", 30, 270);
	
	context.font="26px Verdana";
	context.fillText("You got " + kills + " kills!", 220, 300);
	context.strokeText("You got " + kills + " kills!", 220, 300);
	
	context.fillText("Press F5 to restart!", 200, 330);
	context.strokeText("Press F5 to restart!", 200, 330);
}

function run()
{
	context.fillStyle = "#0080FF";		
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	var deltaTime = getDeltaTime();

	switch(gameState)
	{
		case STATE_SPLASH:
			runSplash(deltaTime);
			break;
		case STATE_GAME:
			runGame(deltaTime);
			break;
		case STATE_DEATH:
			runDeathSlide(deltaTime);
			break;
		case STATE_GAMEOVER:
			runGameOver(deltaTime);
			break;
		case STATE_VICTORY:
			runVictory(deltaTime);
			break;
	}

}

initialize();

//-------------------- Don't modify anything below here


// This code will set up the framework so that the 'run' function is called 60 times per second.
// We have a some options to fall back on in case the browser doesn't support our preferred method.
(function() {
  var onEachFrame;
  if (window.requestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.mozRequestAnimationFrame(_cb); }
      _cb();
    };
  } else {
    onEachFrame = function(cb) {
      setInterval(cb, 1000 / 60);
    }
  }
  
  window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);

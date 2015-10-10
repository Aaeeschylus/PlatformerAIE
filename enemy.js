var Enemy = function(x, y) {
	this.sprite = new Sprite("enemysheet.png");
	this.sprite.buildAnimation(3, 4, 100, 100, 0.1, 
	[3, 4, 5]);
	this.sprite.buildAnimation(3, 4, 100, 100, 0.1,
	[6, 7, 8]);
	
	for(var i=0; i<ENEMY_ANIM_MAX; i++)
	{
		this.sprite.setAnimationOffset(i, -30, -30);
	}
	
	this.position = new Vector2();
	this.position.set(x, y);
	this.velocity = new Vector2();
	this.moveRight = true;
	this.pause = 0;
	this.direction = RIGHT;
};

var left = false;
var right = false;

var RIGHT = 0;
var LEFT = 1;

var ENEMY_ANIM_RIGHT = 0;
var ENEMY_ANIM_LEFT = 1;
var ENEMY_ANIM_MAX = 2

Enemy.prototype.update = function(dt)
{
	this.sprite.update(dt);
	
	if(this.pause > 0)
	{
		this.pause -= dt;
	}
	else
	{
		var ddx = 0; // acceleration
		var tx = pixelToTile(this.position.x);
		var ty = pixelToTile(this.position.y);
		var nx = (this.position.x)%TILE; // true if enemy overlaps right
		var ny = (this.position.y)%TILE; // true if enemy overlaps below
		var cell = cellAtTileCoord(LAYER_PLATFORMS, tx, ty);
		var cellright = cellAtTileCoord(LAYER_PLATFORMS, tx + 1, ty);
		var celldown = cellAtTileCoord(LAYER_PLATFORMS, tx, ty + 1);
		var celldiag = cellAtTileCoord(LAYER_PLATFORMS, tx + 1, ty + 1);
		if(this.moveRight)
		{
			if(celldiag && !cellright) 
			{
				ddx = ddx + ENEMY_ACCEL;	 // enemy wants to go right
				if(this.sprite.currentAnimation != ENEMY_ANIM_RIGHT)
					this.sprite.setAnimation(ENEMY_ANIM_RIGHT);
			}
			else 
			{
				this.velocity.x = 0;
				this.moveRight = false;
				this.pause = 0.5;
			}
		}
		if(!this.moveRight)
		{
			if(celldown && !cell) 
			{
				ddx = ddx - ENEMY_ACCEL;	// enemy wants to go left
				if(this.sprite.currentAnimation != ENEMY_ANIM_LEFT)
					this.sprite.setAnimation(ENEMY_ANIM_LEFT);
			}
			else 
			{
				this.velocity.x = 0;
				this.moveRight = true;
				this.pause = 0.5;
			}
		}
		this.position.x = Math.floor(this.position.x + (dt * this.velocity.x));
		this.velocity.x = bound(this.velocity.x + (dt * ddx), -ENEMY_MAXDX, ENEMY_MAXDX);
	}
}

Enemy.prototype.draw = function()
{
	this.sprite.draw(context, this.position.x - worldOffsetX, this.position.y - worldOffsetY);
}
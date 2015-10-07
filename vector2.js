var Vector2 = function() {
	this.x = 0;
	this.y = 0;
};

Vector2.prototype.set = function(x, y) {
	this.x = x;
	this.y = y;
};

Vector2.prototype.normalize = function() {
	var length = (this.x * this.x) + (this.y * this.y);
	if(length != 0)
	{
		this.x = this.x / Math.sqrt(length);
		this.y = this.y / Math.sqrt(length);
	}
};

Vector2.prototype.add = function(v2) {
	this.x = this.x + v2.x;
	this.y = this.y + v2.y;
};

Vector2.prototype.subtract = function(v2) {
	this.x = this.x - v2.x;
	this.y = this.y - v2.y;
};

Vector2.prototype.multiplyScalar = function(num) {
	this.x = this.x * num;
	this.y = this.y * num;
};




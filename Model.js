(function (game) {
	"use strict";
	var events = {};
	game.model = {};
	game.model.world = [];
	game.model.maxx = 10;
	game.model.maxy = 22;
	game.model.minx = 10;
	game.model.miny = 20;
	game.model.posx = 5;
	game.model.posy = 0;
	game.model.world = [];
	game.model.active = [ 0x000 ];
	game.model.active.color = 0xf;
	game.model.rotation = 0;
	game.model.placeattemptcount = 0;
	game.model.placeattempts = 2;
	game.model.blocks = [
		// HEX :
		// 1 byte color index
		// 1 byte first row
		// 1 byte second row
		// 1 byte third row
		// 1 byte fourth row
		[ 0x20F00, 0x22222, 0x200F0, 0x24444 ],
		[ 0x344C0, 0x38E00, 0x36440, 0x30E20 ],
		[ 0x44460, 0x40E80, 0x4C440, 0x42E00 ],
		[ 0x5CC00, 0x5CC00, 0x5CC00, 0x5CC00 ],
		[ 0x606C0, 0x68C40, 0x66C00, 0x64620 ],
		[ 0x70E40, 0x74C40, 0x74E00, 0x74640 ],
		[ 0x80C60, 0x84C80, 0x8C600, 0x82640 ]
	];
	game.model.ghost = (function () {
		var ghost;
		function findGhostPos() {
			var pos, n = 0;
			while (game.model.iterate([ game.model.posx, game.model.posy + n], game.model.isVacant)) {
				pos = [ game.model.posx, game.model.posy + n ];
				n += 1;
			}
			return pos;
		}
		return function () {
			ghost = findGhostPos();
			return ghost;
		};
	}());
	game.model.fire = function (e, obj) {
		var i, len;
		//if (game.model.state === 'gameover') { return false; }
		if (typeof e !== 'string') { throw new Error('game.model.fire: invalid event.'); }
		if (events[e] === undefined) { return false; }
		for (i = 0, len = events[e].length; i < len; i += 1) {
			events[e][i].apply(this, [ obj ]);
		}
	};
	game.model.bind = function (e, func) {
		if (typeof e !== 'string') { throw new Error('game.model.bind: expected string as first argument.'); }
		if (typeof func !== 'function') { throw new Error('game.model.bind: expected a function to bind.'); }
		if (events[e] === undefined) { events[e] = []; }
		events[e].push(func);
		return this;
	};
	/*jslint bitwise: true*/
	game.model.color = function () {
		var active = game.model.blocks[game.model.rotation];
		return (active >> 16) & 0xf;
	};
	/*jslint bitwise: false*/
	/*jslint bitwise: true*/
	game.model.isInWorld = function (x, y) {
		return (0 <= x && x < game.model.maxx) && (0 < y && y <= game.model.maxy);
	};
	game.model.isVacant = function (x, y) {
		if (!game.model.isInWorld(x, y)) { return false; }
		return (game.model.world[x] && game.model.world[x][y] === 0);
	};
	/*jslint bitwise: false*/
	game.model.move = function (x, y) {
		if (!(typeof x === 'number' && typeof y === 'number')) { throw new Error('game.model.move: arguments must be numbers.'); }
		return game.model.position(game.model.posx + x, game.model.posy + y);
	};
	/*jslint bitwise: true*/
	game.model.areVacant = function (dx, dy) {
		var x, y, c, active = game.model.blocks[game.model.rotation];
		dx = dx === undefined ? game.model.posx : dx;
		dy = dy === undefined ? game.model.posy : dy;
		for (y = 0; y < 4; y += 1) {
			c = (active >> (12 - (y * 4))) & 0xf;
			for (x = 0; x < 4; x += 1) {
				if (!game.model.isVacant(x + dx, y + dy)) { return false; }
			}
		}
		return true;
	};
	/*jslint bitwise: false*/
	/*jslint bitwise: true*/
	game.model.iterate = function (block, pos, func) {
		var x, y, dx, dy, c, active = game.model.active[game.model.rotation];
		if (typeof pos === 'function') {
			func = pos;
			pos = [ game.model.posx, game.model.posy ];
		}
		if (typeof block === 'object') {
			pos = block;
			block = game.model.active[game.model.rotation];
		}
		if (typeof block === 'function') {
			func = block;
			pos = [ game.model.posx, game.model.posy ];
			block = game.model.active[game.model.rotation];
		}
		if (typeof func !== 'function' || typeof pos !== 'object' || typeof block !== 'number') { throw new Error('game.model.iterate: invalid argument(s).'); }
		dx = pos[0];
		dy = pos[1];
		for (y = 3; y >= 0; y -= 1) {
			c = (block >> (12 - (y * 4))) & 0xf;
			for (x = 3; x >= 0; x -= 1) {
				if ((c >> (3 - x)) & 0x1) {
					if (func(x + dx, y + dy) === false) { return false; }
				}
			}
		}
		return true;
	};
	/*jslint bitwise: false*/
	/*jslint bitwise: true*/
	game.model.getWorld = function () {
		var x, y, maxx = game.model.maxx, maxy = game.model.maxy, ret = [], c, ghost = game.model.ghost(), dx, dy, gdx, gdy, active = game.model.active[game.model.rotation];
		for (x = 0; x < maxx; x += 1) {
			ret[x] = [];
			for (y = 0; y < maxy; y += 1) {
				ret[x][y] = game.model.world[x][y];
			}
		}
		dx = game.model.posx;
		dy = game.model.posy;
		if (ghost) {
			gdx = game.model.ghost()[0];
			gdy = game.model.ghost()[1];
		}
		for (y = 0; y <= 3; y += 1) {
			c = (active >> (12 - (y * 4))) & 0xf;
			for (x = 0; x <= 3; x += 1) {
				if ((c >> (3 - x)) & 0x1) {
					if (ret[dx + x] === undefined) {
						throw new Error('ret[dx + x] is undefined.');
					}
					ret[dx + x][dy + y] = ret[dx + x][dy + y] || ((active >> 16) & 0xf);
					if (ghost) {
						if (ret[gdx + x] === undefined) {
							throw new Error('crap.');
						}
						ret[gdx + x][gdy + y] = ret[gdx + x][gdy + y] || 0x1;
					}
				}
			}
		}
		return ret;
	};
	/*jslint bitwise: false*/
	game.model.position = function (x, y) {
		var oldX = game.model.posx, oldY = game.model.posy, diffX, diffY;
		if (x === undefined && y === undefined) { return [game.model.posx, game.model.posy]; }
		if (!(typeof x === 'number' && typeof y === 'number')) { throw new Error('game.model.position: arguments must be numbers.'); }
		//if (x < 0 || y < 0) { throw new Error('game.model.position: arguments must be positive numbers.'); }
		if (!game.model.iterate([x, y], game.model.isVacant)) { return false; }
		game.model.posx = x;
		game.model.posy = y;
		diffX = x - oldX;
		diffY = y - oldY;
		game.model.iterate(function () {
			game.model.fire('changeposition', game.model.getWorld());
		});
		return this;
	};
	game.model.rotate = function (diff) {
		var blocks, pos;
		if (typeof diff === 'boolean') { diff = diff ? 1 : -1; }
		if (diff === undefined) { diff = 1; }
		if (typeof diff !== 'number') { throw new Error('game.model.rotate: argument must be a number.'); }
		//game.model.rotation = (game.model.rotation + diff) % game.model.active.length;
		// check if the rotation is valid
		blocks = game.model.active[(game.model.rotation + diff) % game.model.active.length];
		pos = [ game.model.posx, game.model.posy ];
		if (game.model.iterate(blocks, pos, game.model.isVacant)) {
			//if (!game.model.iterate(blocks, pos, game.model.isInWorld)) { }
			game.model.rotation = (game.model.rotation + diff) % game.model.active.length;
			game.model.fire('rotate', game.model.getWorld());
			return true;
		}
		// could not rotate
		game.model.fire('errorrotate');
	};
	game.model.speed = (function () {
		var speed = 1;
		return function (value) {
			if (value === undefined) { return speed; }
			if (typeof value !== 'number') { throw new Error('game.model.speed: expected numerical argument.'); }
			speed = value;
			return this;
		};
	}());
	game.model.pause = (function () {
		var paused = false;
		return function pause(to) {
			if (to === undefined) { return paused; }
			if (typeof paused === 'boolean') { paused = to; }
		};
	}());
	/*jslint bitwise: true*/
	game.model.place = function (dx, dy) {
		// Place the active block at [dx, dy]
		var x, y, active = game.model.active[game.model.rotation], c, cid;
		if (dx === undefined && dy === undefined) {
			dx = game.model.posx;
			dy = game.model.posy;
		}
		if (!(typeof dx === 'number' && typeof dy === 'number')) { throw new Error('game.model.place: arguments must be numbers.'); }
		function place(x, y) {
			game.model.world[x][y] = cid;
			game.model.fire('changetile', { posX: (x + dx), posY: (y + dy) });
		}
		for (y = 0; y < 4; y += 1) {
			c = (active >> (12 - (y * 4))) & 0xf;
			for (x = 0; x < 4; x += 1) {
				cid = (active >> 16) & 0xf;
				if (game.model.iterate(game.model.isVacant)) {
					game.model.iterate(place);
				}
			}
		}
		game.model.fire('placeblock');
		return this;
	};
	/*jslint bitwise: false*/
	game.model.generate = function (id) {
		if (id === undefined) {
			id = Math.round(Math.random() * (game.model.blocks.length - 1));
		}
		if (typeof id !== 'number') { throw new Error('game.model.generate: id must be a number.'); }
		if (game.model.blocks[id] === undefined) { throw new Error('game.model.generate: no tetrimino of this id is defined.'); }
		game.model.active = game.model.blocks[id];
		game.model.fire('changeactive');
	};
	game.model.score = (function () {
		var score = 0;
		return function (add) {
			if (add === undefined) { return score; }
			if (typeof add !== 'number') { throw new Error('game.model.score: argument must be a number.'); }
			score += add;
		};
	}());
	game.model.gravityShift = function gravityShift(arr) {
		var x, y, maxx = game.model.maxx, maxy = game.model.maxy, arrlen = arr.length, ret, res;
		for (x = 0; x < maxx; x += 1) {
			ret = [];
			for (y = 0; y <= arrlen; y += 1) {
				ret[y] = 0x0;
			}
			for (y; y <= maxy; y += 1) {
				if (arr.indexOf(y) === -1) {
					ret.push(game.model.world[x][y]);
				}
			}
			game.model.world[x] = ret;
		}
	};
	game.model.getColumnAt = function (x) {
		var y, ret = [], maxy = game.model.maxy;
		for (y = 0; y < maxy; y += 1) {
			ret[y] = game.model.world[x][y];
		}
		return ret;
	};
	game.model.getRowAt = function (y) {
		var x, ret = [], maxx = game.model.maxx;
		for (x = 0; x < maxx; x += 1) {
			ret[x] = game.model.world[x][y];
		}
		return ret;
	};
	game.model.shiftRow = function shiftRow(r, amount) {
		var x, maxx = game.model.maxx, maxy = game.model.maxy;
		if (!amount) { return false; }
		for (x = 0; x < maxx; x += 1) {
			game.model.world[x][r + amount] = game.model.world[x][r];
		}
	};
	game.model.clear = function clear() {
		var x, y, row, count = 0, rowsCleared = [], ret = [], maxy = game.model.maxy;
		for (y = maxy - 1; y >= 0; y -= 1) {
			row = game.model.getRowAt(y);
			if (rowsCleared.length) { game.model.shiftRow(y, rowsCleared.length); }
			if (row.indexOf(0) === -1) {
				// Row y is full
				rowsCleared.push(y);
			}
			// shift them up
		}
		//if (rowsCleared.length) { game.model.fire('clearlines', rowsCleared); }
	};
	game.model.resetPosition = function () {
		game.model.posx = Math.floor(game.model.maxx / 2);
		game.model.posy = 0;
	};
	game.model.init = function (w) {
		var world = [], x, y, maxx = game.model.maxx, maxy = game.model.maxy;
		for (x = 0; x < maxx; x += 1) {
			world[x] = [];
			for (y = 0; y < maxy; y += 1) {
				world[x][y] = (w !== undefined ? (w[x] !== undefined ? (w[x][y] || 0) : 0) : 0);
			}
		}
		game.model.world = world;
		// reset position
		game.model.resetPosition();
		return world;
	};
	game.model.bind('gamestart', game.model.init);
	game.model.bind('gamestart', game.model.generate);
	game.model.bind('placeblock', game.model.resetPosition);
	game.model.bind('placeblock', game.model.generate);
	game.model.bind('placeblock', game.model.clear);
	game.model.bind('clearlines', game.model.gravityShift);
	(function () {
		var x, maxx = game.model.maxx, y, maxy = game.model.maxy;
		for (x = 0; x < maxx; x += 1) {
			game.model.world[x] = [];
			for (y = 0; y < maxy; y += 1) {
				game.model.world[x][y] = 0x00;
			}
		}
	}());
	// The game loop
	game.model.loop = (function () {
		function loop() {
			if (game.model.pause()) { return false; }
			game.model.fire('loop');
		}
		return window.setInterval(loop, 100);
	}());
	game.model.end = function endLoop() {
		window.clearInterval(game.model.loop);
	};
	//game.model.bind('gameover', game.model.end);
	game.model.bind('loop', function () {
		var i = 0, len = game.model.world.length;
		for (i; i < len; i += 1) {
			if (game.model.world[i][2]) {
				game.model.fire('gameover');
				return false;
			}
		}
		return true;
	});
	game.model.bind('loop', function () {
		var time = +(new Date()), speed = game.model.speed(), ptime = game.model.timeActive, pptd;
		if (ptime === undefined || ptime + (1000 / speed) < time) {
			if (!game.model.move(0, 1)) {
				if (game.model.placeattempts <= game.model.placeattemptcount) {
					game.model.place();
					game.model.placeattemptcount = 0;
				} else {
					game.model.placeattemptcount += 1;
				}
			}
			game.model.timeActive = time;
		}
	});
	game.model.speed(5);
	game.model.fire('gamestart');
}(window.game = {}));

/*globals window*/
/* Functions
 * Tetris.lower()
 ** Lower the active piece by 1 tile
 * Tetris.rotate(diff)
 * Tetris.place(x, y)
 * Tetris.clear()
 ** Clear all full game rows
 * Tetris.bind()
 * Tetris.fire()
 * Tetris.unbind()
 ** Remove hook from event
 * Tetris.score()
 * Tetris.hold()
 ** Hold a tetrimino.
 * Tetris.generate()
 * Tetris.speed()
 ** Change the fall speed of tetriminos
 * Tetris.ghost()
 ** Toggle the ghost piece
 */
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
	game.model.blocks = [
		// HEX :
		// 4 bytes color index
		// 4 bytes first row
		// 4 bytes second row
		// 4 bytes third row
		// 4 bytes fourth row
		[ 0x10F00, 0x12222, 0x100F0, 0x14444 ],
		[ 0x244C0, 0x28E00, 0x26440, 0x20E20 ],
		[ 0x34460, 0x30E80, 0x3C440, 0x32E00 ],
		[ 0x4CC00, 0x4CC00, 0x4CC00, 0x4CC00 ],
		[ 0x506C0, 0x58C40, 0x56C00, 0x54620 ],
		[ 0x60E40, 0x64C40, 0x64E00, 0x64640 ],
		[ 0x70C60, 0x74C80, 0x7C600, 0x72640 ]
	];
	game.model.fire = function (e, obj) {
		var i, len;
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
	game.model.isVacant = function (x, y) {
		return ((0 < x && x < game.model.maxx) && (0 < y && y < game.model.maxy)) && (game.model.world[x] !== undefined && game.model.world[x][y] === 0);
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
	game.model.iterate = function (func, dx, dy) {
		var x, y, c, active = game.model.blocks[game.model.rotation];
		dx = dx === undefined ? game.model.posx : dx;
		dy = dy === undefined ? game.model.posy : dy;
		for (y = 0; y < 4; y += 1) {
			c = (active >> (12 - (y * 4))) & 0xf;
			for (x = 0; x < 4; x += 1) {
				if (!func(x + dx, y + dy)) { return false; }
			}
		}
		return true;
	};
	/*jslint bitwise: false*/
	game.model.position = function (x, y) {
		var oldX = game.model.posx, oldY = game.model.posy;
		if (x === undefined && y === undefined) { return [game.model.posx, game.model.posy]; }
		if (!(typeof x === 'number' && typeof y === 'number')) { throw new Error('game.model.position: arguments must be numbers.'); }
		if (x < 0 || y < 0) { throw new Error('game.model.position: arguments must be positive numbers.'); }
		if (!game.model.iterate(game.model.isVacant, x, y)) { return false; }
		game.model.posx = x;
		game.model.posy = y;
		game.model.iterate(function (x, y) {
			game.model.fire('changeposition', { oldX: oldX, newX: x, oldY: oldY, newY: y, cid: game.model.color() });
		});
		return this;
	};
	game.model.rotate = function (diff) {
		if (typeof diff === 'boolean') { diff = diff ? 1 : -1; }
		if (diff === undefined) { diff = 1; }
		if (typeof diff !== 'number') { throw new Error('game.model.rotate: argument must be a number.'); }
		game.model.rotation = (game.model.rotation + diff) % game.model.active.length;
		game.model.fire('rotate');
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
	/*jslint bitwise: true*/
	game.model.place = function (dx, dy) {
		// Place the active block at [dx, dy]
		var x, y, active = game.model.active[game.model.rotation], c;
		if (dx === undefined && dy === undefined) {
			dx = game.model.posx;
			dy = game.model.posy;
		}
		if (!(typeof dx === 'number' && typeof dy === 'number')) { throw new Error('game.model.place: arguments must be numbers.'); }
		for (y = 0; y < 4; y += 1) {
			c = (active >> (12 - (y * 4))) & 0xf;
			for (x = 0; x < 4; x += 1) {
				if ((c >> (3 - x)) & 0x1) {
					// 0x0FFFF
					game.model.world[x + (dx || 0)][y + (dy || 0)] = (active >> 16);
					game.model.fire('changetile', { posX: (x + dx), posY: (y + dy) });
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
	game.model.resetPosition = function () {
		game.model.posx = Math.floor(game.model.maxx / 2);
		game.model.posy = 0;
	};
	game.model.bind('placeblock', game.model.resetPosition);
	game.model.bind('placeblock', game.model.generate);
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
		function loop() { game.model.fire('loop'); }
		return window.setInterval(loop, 100);
	}());
	game.model.end = function endLoop() {
		window.clearInterval(game.model.loop);
	};
	game.model.bind('gameover', game.model.end);
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
		var time = +(new Date()), speed = game.model.speed(), ptime = game.model.timeActive;
		if (ptime === undefined || ptime + (1000 / speed) < time) {
			if (!game.model.move(0, 1)) {
				game.model.place();
			}
			game.model.timeActive = time;
		}
	});
}(window.game = {}));

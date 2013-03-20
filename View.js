(function (game) {
	"use strict";
	/*globals window, document, game*/
	var container, world, score, active, next, clear, events = {};
	if (game === undefined) { throw new Error('Game has not loaded.'); }
	if (game.view !== undefined) { throw new Error('View is already loaded.'); }
	game.view = {};
	game.view.blockWidth = 22;
	game.view.blockHeight = 22;
	game.view.minx = 10;
	game.view.maxx = 10;
	game.view.miny = 20;
	game.view.maxy = 22;
	container = document.createElement('div');
	container.tabIndex = 1;
	game.view.element = container;
	world = document.createElement('div');
	score = document.createElement('div');
	active = document.createElement('div');
	next = document.createElement('div');
	clear = document.createElement('div');
	clear.style.clear = 'both';
	// Styles
	world.style.width = game.view.maxx * game.view.blockWidth + "px";
	world.style.height = game.view.maxy * game.view.blockHeight + "px";
	world.style.background = 'black';
	active.style.width = game.view.blockWidth + "px";
	active.style.height = game.view.blockHeight + "px";
	next.style.width = game.view.blockWidth * 4 + "px";
	next.style.height = game.view.showPieces * game.view.blockHeight * 4 + "px";
	score.style.width = 300 + "px";
	//container.appendChild(world);
	//container.appendChild(score);
	//container.appendChild(active);
	//container.appendChild(next);
	game.view.colors = [
		"black", // background
		"lightgrey", // ghost
		"cyan", // I
		"darkblue", // J
		"orange", // L
		"yellow", // O
		"red", // Z
		"green", // S
		"purple" // T
	];
	game.view.tetrimino = function () {
		var mono = document.createElement('div');
		mono.className = 'mono';
		return mono;
	};
	game.view.fire = function (e, obj) {
		var args = {}, p, i, len;
		if (typeof e !== 'string') { throw new Error('game.view.fire: invalid event.'); }
		if (events[e] === undefined) { return false; }
		args.view = this;
		for (p in obj) {
			if (obj.hasOwnProperty(p)) {
				args[p] = obj[p];
			}
		}
		for (i = 0, len = events[e].length; i < len; i += 1) {
			events[e][i].apply(this, [ args ]);
		}
	};
	game.view.bind = function (e, func) {
		if (typeof e !== 'string') { throw new Error('game.view.bind: expected string as first argument.'); }
		if (events[e] === undefined && typeof func === 'function') { events[e] = []; }
		events[e].push(func);
		return this;
	};
	game.view.world = (function () {
		var world = [];
		return function (worldReplacement) {
			if (worldReplacement === undefined) { return world; }
			if (world !== worldReplacement) { world = worldReplacement; }
			game.view.fire('changeworld');
		};
	}());
	game.view.ghost = (function () {
		var ghost = false;
		return function (x, y) {
			if (x === false) {
				if (ghost !== false) {
					ghost = false;
					game.view.fire('removeghost');
					return this;
				}
				return this;
			}
			if (typeof x === 'number' && typeof y === 'number') {
				ghost = [ x, y ];
				game.view.fire('changeghost');
				return this;
			}
			throw new Error('game.view.ghost: invalid arguments.');
		};
	}());
	game.view.active = (function () {
		var x, y;
		return function (posx, posy) {
			if (posx === undefined || posy === undefined) { return [ x, y ]; }
			if (typeof x === 'number' && typeof y === 'number') {
				if (!(x === posx && y === posy)) {
					x = posx;
					y = posy;
					game.view.fire('changeactive');
					return this;
				}
			}
			throw new Error('game.view.active: invalid arguments.');
		};
	}());
	game.view.next = (function () {
		var next = [];
		return function (arr) {
			if (typeof arr === 'number') {
				next.length = arr;
				game.view.fire('changenextcount');
				return this;
			}
			if (typeof arr === 'object') {
				if (arr.length !== next.length) { throw new Error('game.view.next: input array must have a length of ' + next.length); }
				next = arr;
				game.view.fire('changenext');
				return this;
			}
			throw new Error('game.view.next: invalid arguments');
		};
	}());
	game.view.stats = (function () {
		var score = 0, movesetcount = {};
		return function (obj) {
			var move, changed = false;
			if (typeof obj === 'object') {
				for (move in obj) {
					if (obj.hasOwnProperty(move)) {
						if (movesetcount[move] !== undefined) { throw new Error('game.view.stats: move ' + move + ' unrecognized.'); }
						if (movesetcount[move] !== obj[move]) {
							movesetcount[move] = obj[move];
							changed = true;
						}
					}
				}
				if (changed) {
					game.view.fire('changestats');
				}
				return this;
			}
			if (typeof obj === 'number') {
				score = obj;
				game.view.fire('changescore');
				return this;
			}
			throw new Error('game.view.stats: invalid arguments.');
		};
	}());
	game.view.bind('changescore', function (e) {
		while (score.lastChild) { score.removeChild(score.lastChild); }
		score.appendChild(document.createTextNode(e.score));
	});
	game.view.bind('changeactive', function (e) {
		active.style.left = e.posx + "px";
		active.style.top = e.posy + "px";
	});
	game.view.bind('changenextcount', function (e) {
		var d = e.oldCount - e.newCount;
		while ((d -= 1) >= 0) {
			next.removeChild(next.lastChild);
		}
		while ((d += 1) <= 0) {
			next.appendChild('div');
		}
	});
	game.view.bind('changenext', function () {
		return this;
	});
	game.view.bind('changestats', function () {
		return this;
	});
	game.view.color = function (obj) {
		var xi, xn, yi, yn, cid;
		xi = obj.oldX;
		xn = obj.newX;
		yi = obj.oldY;
		yn = obj.newY;
		cid = obj.cid;
		game.view.world[xi].children[yi].style.backgroundColor = 'black';
		//game.view.world[xi].children[yi].style.border = '1px solid #fff';
		game.view.world[xn].children[yn].style.backgroundColor = game.view.colors[cid];
	};
	game.view.render = function render(world) {
		var x, y, maxx = game.view.maxx, maxy = game.view.maxy, c;
		for (x = 0; x < maxx; x += 1) {
			for (y = 0; y < maxy; y += 1) {
				c = game.view.colors[world[x][y]] || 'black';
				game.view.world[x].children[y].style.backgroundColor = c;
			}
		}
	};
	game.view.world = [];
	game.view.init = function () {
		var x, y, maxx, maxy, box;
		box = document.getElementById('tetris');
		box.appendChild(container);
		container.focus();
		for (x = 0, maxx = game.view.maxx; x < maxx; x += 1) {
			game.view.world[x] = document.createElement('div');
			game.view.world[x].className = 'row';
			container.appendChild(game.view.world[x]);
			for (y = 0, maxy = game.view.maxy; y < maxy; y += 1) {
				game.view.world[x].appendChild(game.view.tetrimino());
			}
		}
	};
}(window.game));

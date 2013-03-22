(function (game) {
	"use strict";
	/*globals window, game*/
	var events = {};
	if (window.game === undefined) { throw new Error('Game has not loaded.'); }
	if (game.model === undefined) { throw new Error('Model has not loaded.'); }
	if (game.view === undefined) { throw new Error('View is not loaded.'); }
//	if (game.controller !== undefined) { throw new Error('Controller is already loaded.'); }
	game.controller = {};
	// Controller setup
	// Example:
	// The following code sets up a keybind event for ctrl + left arrow
	// And sets the position to (0, posy)
	// game.controller.setup([ 17, 37 ], function () {
	//   game.model.position(0, game.model.position()[1])
	// });
	game.controller.activeKeys = [];
	game.controller.keyEvents = [];
	game.controller.minKeyCode = 8;
	game.controller.maxKeyCode = 222;
	game.controller.invalidKeyCodes = [
		10, 11, 12, 14, 15, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 41, 42, 43, 44, 47, 58, 59, 60, 61, 62, 63, 64, 94, 95, 108, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218
	];
	game.controller.fire = function (e, obj) {
		var i, len;
		if (typeof e !== 'string') { throw new Error('game.model.fire: invalid event.'); }
		if (events[e] === undefined) { return false; }
		for (i = 0, len = events[e].length; i < len; i += 1) {
			events[e][i].apply(this, [ obj ]);
		}
	};
	game.controller.bind = function (e, func) {
		if (typeof e !== 'string') { throw new Error('game.model.bind: expected string as first argument.'); }
		if (events[e] === undefined && typeof func === 'function') { events[e] = []; }
		events[e].push(func);
		return this;
	};
	// register activeKeys
	game.controller.bind('keydown', function (e) {
		var i, len, id = 0, shiftleft;
		if (game.controller.activeKeys.indexOf(e.keyCode) === -1) {
			game.controller.activeKeys.push(e.keyCode);
			shiftleft = Math.ceil(Math.log(game.controller.maxKeyCode - game.controller.minKeyCode) / Math.log(2));
			for (i = 0, len = game.controller.activeKeys.length; i < len; i += 1) {
				/*jslint bitwise: true*/
				id += game.controller.activeKeys[i] << (shiftleft * (len - i - 1));
				/*jslint bitwise: false*/
			}
			game.controller.fire('keydown' + id);
		}
	});
	game.controller.bind('keyup', function (e) {
		game.controller.activeKeys.splice(game.controller.activeKeys.indexOf(e.keyCode), 1);
	});
	game.controller.init = function () {
		game.view.element.addEventListener('keydown', function (e) {
			game.controller.fire('keydown', e);
		});
		// deregister activeKeys
		game.view.element.addEventListener('keyup', function (e) {
			game.controller.fire('keyup', e);
		});
	};
	// initialize the controls
	game.controller.setup = function controllerSetup(keys, action) {
		var i, len, id = 0, shiftleft;
		if (typeof keys !== 'object' || typeof keys.length !== 'number' || keys.length <= 0) { throw new Error('game.controller.setup: expected an array of keyCodes as first argument.'); }
		if (typeof action !== 'function') { throw new Error('game.controller.setup: expected callback as second argument.'); }
		shiftleft = Math.ceil(Math.log(game.controller.maxKeyCode - game.controller.minKeyCode) / Math.log(2));
		for (i = 0, len = keys.length; i < len; i += 1) {
			if (game.controller.invalidKeyCodes.indexOf(keys[i]) !== -1) {
				throw new Error('game.controller.setup: the key of keyCode ' + keys[i] + ' cannot be bound to. No key exists.');
			}
			/*jslint bitwise: true*/
			id += keys[i] << (shiftleft * (len - i - 1));
			/*jslint bitwise: false*/
		}
		id = "keydown" + id;
		game.controller.bind(id, action);
		return this;
	};
	game.controller.setup([ 82 ], function () {
		game.model.init();
	});
	game.controller.setup([ 37 ], function () {
		game.model.move(-1, 0);
	});
	game.controller.setup([ 17, 39 ], function () {
		var pos;
		do { pos = game.model.move(1, 0); } while (pos);
	});
	game.controller.setup([ 17, 37 ], function () {
		var pos;
		do { pos = game.model.move(-1, 0); } while (pos);
	});
	game.controller.setup([ 39 ], function () {
		game.model.move(1, 0);
	});
	game.controller.setup([ 38 ], function () {
		game.model.rotate(1);
	});
	game.controller.setup([ 80 ], function () {
		game.model.pause(!game.model.pause());
	});
	game.model.bind('changeposition', game.model.ghost);
	game.model.bind('applyghost', game.view.render);
	game.model.bind('changeposition', game.view.render);
	game.model.bind('rotate', game.view.render);
	window.addEventListener('keydown', function (e) {
		if (e.keyCode === 32 || (e.keyCode >= 37 && e.keyCode <= 40)) {
			e.preventDefault();
		}
	});
	game.controller.setup([ 32 ], function () {
		var pos;
		do {
			pos = game.model.move(0, 1);
		} while (pos);
	});
	//game.model.bind('changetile', game.view.render);
	//game.model.bind('rotate', game.view.render);
	//game.model.bind('changeactive', game.view.render);
}(window.game));

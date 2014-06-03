/*!
 * gamepad.js 0.0.1
 * https://github.com/Tom32i/gamepad.js
 * Copyright 2014 Thomas JARRAND
 */

function EventEmitter(){this._eventElement=document.createElement("div")}EventEmitter.prototype.emit=function(t,e){this._eventElement.dispatchEvent(new CustomEvent(t,{detail:e}))},EventEmitter.prototype.addEventListener=function(t,e){this._eventElement.addEventListener(t,e,!1)},EventEmitter.prototype.removeEventListener=function(t,e){this._eventElement.removeEventListener(t,e,!1)},EventEmitter.prototype.on=EventEmitter.prototype.addEventListener,EventEmitter.prototype.off=EventEmitter.prototype.removeEventListener;
/*!
 * option-resolver.js 0.0.1
 * https://github.com/Tom32i/option-resolver.js
 * Copyright 2014 Thomas JARRAND
 */

function OptionResolver(t){this.allowExtra="undefined"!=typeof t&&t,this.defaults={},this.types={},this.optional=[],this.required=[]}OptionResolver.prototype.setDefaults=function(t){for(var e in t)t.hasOwnProperty(e)&&(this.defaults[e]=t[e]);return this},OptionResolver.prototype.setTypes=function(t){for(var e in t)t.hasOwnProperty(e)&&(this.types[e]=t[e]);return this},OptionResolver.prototype.setOptional=function(t){return this.allowExtra?void 0:(this.addToArray(this.optionals,t),this)},OptionResolver.prototype.setRequired=function(t){return this.addToArray(this.required,t),this},OptionResolver.prototype.resolve=function(t){var e={};for(var o in this.defaults)this.defaults.hasOwnProperty(o)&&(e[o]=this.getValue(t,o));for(var i=this.required.length-1;i>=0;i--)if(o=this.required[i],"undefined"==typeof e[o])throw'Option "'+o+'" is required.';return e},OptionResolver.prototype.getValue=function(t,e){var o=null;if(!this.optionExists(e))throw'Unkown option "'+e+'".';return"undefined"!=typeof t[e]?o=t[e]:"undefined"!=typeof this.defaults[e]&&(o=this.defaults[e]),this.checkType(e,o),o},OptionResolver.prototype.checkType=function(t,e){var o="undefined"!=typeof this.types[t]?this.types[t]:!1,i=typeof e;if(o&&i!==o&&("string"===o&&(e=String(e)),"boolean"===o&&(e=Boolean(e)),"number"===o&&(e=Number(e)),i=typeof e,o!==i))throw'Wrong type for option "'+t+'". Expected '+this.types[t]+" but got "+typeof e},OptionResolver.prototype.optionExists=function(t){return this.allowExtra?!0:"undefined"!=typeof this.defaults[t]||this.optional.indexOf(t)>=0||this.required.indexOf(t)>=0},OptionResolver.prototype.addToArray=function(t,e){for(var o,i=e.length-1;i>=0;i--)o=e[i],t.indexOf(o)>=0&&t.push(o)};
/**
 * Gamepad Handler
 *
 * @param {Gamepad} gamepad
 */
function GamepadHandler(gamepad, options)
{
    EventEmitter.call(this);

    this.gamepad = gamepad;
    this.sticks  = new Array(this.gamepad.axes.length);
    this.buttons = new Array(this.gamepad.buttons.length);
    this.options = this.resolveOptions(options);

    for (var s = this.sticks.length - 1; s >= 0; s--) {
        this.sticks[s] = [0, 0];
    }

    for (var b = this.buttons.length - 1; b >= 0; b--) {
        this.buttons[b] = false;
    }

    this.gamepad.handler = this;
}

GamepadHandler.prototype = Object.create(EventEmitter.prototype);
GamepadHandler.prototype.constructor = GamepadHandler;

/**
 * Option resolver
 *
 * @type {OptionResolver}
 */
GamepadHandler.prototype.optionResolver = new OptionResolver(false);

GamepadHandler.prototype.optionResolver.setDefaults({
    analog: true,
    deadZone: 0,
    precision: 0
});

GamepadHandler.prototype.optionResolver.setTypes({
    analog: 'boolean',
    deadZone: 'number',
    precision: 'number'
});

/**
 * Resolve options
 *
 * @param {Object} options
 *
 * @return {Object}
 */
GamepadHandler.prototype.resolveOptions = function(source)
{
    var customStick = typeof source.stick !== 'undefined',
        customButton = typeof source.button !== 'undefined',
        options = {
            stick: this.optionResolver.resolve(customStick ? source.stick : (customButton ? {} : source)),
            button: this.optionResolver.resolve(customButton ? source.button : (customStick ? {} : source))
        };

    options.stick.deadZone   = Math.max(Math.min(options.stick.deadZone, 1), 0);
    options.button.deadZone  = Math.max(Math.min(options.button.deadZone, 1), 0);
    options.stick.precision  = options.stick.precision ? Math.pow(10, options.stick.precision) : 0;
    options.button.precision = options.button.precision ? Math.pow(10, options.button.precision) : 0;

    return options;
};

/**
 * Update
 */
GamepadHandler.prototype.update = function()
{
    var i = 0,
        s = 0,
        a = 0;

    for (s = 0; s < 2; s++) {
        for (a = 0; a < 2; a++) {
            this.setStick(s, a, this.gamepad.axes[i], this.options.stick);
            i++;
        }
    }

    for (i = this.gamepad.buttons.length - 1; i >= 0; i--) {
        this.setButton(i, this.gamepad.buttons[i], this.options.button);
    }
};

/**
 * Set stick
 *
 * @param {Number} stick
 * @param {Number} axis
 * @param {Number} value
 */
GamepadHandler.prototype.setStick = function(stick, axis, value, options)
{
    if (options.deadZone && value < options.deadZone && value > -options.deadZone) {
        value = 0;
    }

    if (!options.analog) {
        value = value > 0 ? 1 : value < 0 ? -1 : 0;
    } else if (options.precision) {
        value = Math.round(value * options.precision) / options.precision;
    }

    if (this.sticks[stick][axis] !== value) {
        this.sticks[stick][axis] = value;
        this.emit('axis', {gamepad: this.gamepad, axis: axis, value: this.sticks[stick][axis]});
    }
};

/**
 * Set button
 *
 * @param {Number} index
 * @param {GamepadButton} button
 */
GamepadHandler.prototype.setButton = function(index, button, options)
{
    var value = button.value;

    if (options.deadZone && button.value < options.deadZone && button.value > -options.deadZone) {
        value = 0;
    }

    if (!options.analog) {
        value = button.pressed ? 1 : 0;
    } else if (options.precision) {
        value = Math.round(value * options.precision) / options.precision;
    }

    if (this.buttons[index] !== value) {
        this.buttons[index] = value;
        this.emit('button', {
            gamepad: this.gamepad,
            button: button,
            index: index,
            pressed: button.pressed,
            value: value
        });
    }
};
/**
 * Gamepad Listener
 */
function GamepadListener(options)
{
    EventEmitter.call(this);

    this.options  = typeof(options) === 'object' ? options : {};
    this.frame    = null;
    this.gamepads = [];
    this.update   = this.update.bind(this);
    this.onAxis   = this.onAxis.bind(this);
    this.onButton = this.onButton.bind(this);
    this.stop     = this.stop.bind(this);

    window.addEventListener('error', this.stop);

    this.start();
}

GamepadListener.prototype = Object.create(EventEmitter.prototype);
GamepadListener.prototype.constructor = GamepadListener;

/**
 * Start
 */
GamepadListener.prototype.start = function()
{
    if (!this.frame) {
        this.update();
    }
};

/**
 * Stop
 */
GamepadListener.prototype.stop = function()
{
    if (this.frame) {
        window.cancelAnimationFrame(this.frame);
        this.frame = null;
    }
};

/**
 * Update
 */
GamepadListener.prototype.update = function()
{
    this.frame = window.requestAnimationFrame(this.update);

    this.checkForNewGamepad();

    for (var i = this.gamepads.length - 1; i >= 0; i--) {
        this.gamepads[i].handler.update();
    }
};

/**
 * Check for new gampads
 */
GamepadListener.prototype.checkForNewGamepad = function()
{
    var gamepads = this.getGamepads();

    if (gamepads.length !== this.gamepads.length) {
        for (var i = gamepads.length - 1; i >= 0; i--) {
            if (gamepads[i] && this.gamepads.indexOf(gamepads[i]) < 0) {
                this.addGamepad(gamepads[i]);
            }
        }
    }
};

/**
 * Add gamepad
 *
 * @param {GamepadHandler} gamepad
 */
GamepadListener.prototype.addGamepad = function(gamepad)
{
    var handler = new GamepadHandler(gamepad, this.options);

    this.gamepads.push(gamepad);

    handler.on('axis', this.onAxis);
    handler.on('button', this.onButton);
};

/**
 * On axe
 *
 * @param {Event} event
 */
GamepadListener.prototype.onAxis = function(event)
{
    this.emit('axis', event.detail);
};

/**
 * On button
 *
 * @param {Event} event
 */
GamepadListener.prototype.onButton = function(event)
{
    this.emit('button', event.detail);
};

/**
 * Get gampads
 *
 * @return {GamepadList}
 */
GamepadListener.prototype.getGamepads = function()
{
    return typeof(navigator.getGamepads) !== 'undefined' ? navigator.getGamepads() : (typeof(navigator.webkitGetGamepads) !== 'undefined' ? navigator.webkitGetGamepads() : null);
};
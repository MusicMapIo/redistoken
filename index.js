var randomToken = require('random-token-generator'),
	redis = require('redis');
var util = require('util');
var RedisToken = module.exports = function(opts) {
	this.conn = null;
	this.opts = opts = opts || {};
	this.opts.prefix = opts.prefix || '';

	// Redis options
	this.opts.expires = typeof opts.expires !== 'undefined' ? opts.expires : 60;
	this.opts.onReady = opts.onReady || function() {};
	this.opts.onConnect = opts.onConnect || function() {};
	this.opts.onError = opts.onError || function() {};

	// Token options
	this.opts.strongKey = opts.strongKey || false;
	this.opts.tokenLen = opts.tokenLen || 16;

	// Data options
	this.opts.stringifyData = typeof opts.stringifyData !== 'undefined' ? opts.stringifyData : true;
	this.opts.singleUse = typeof opts.singleUse !== 'undefined' ? opts.singleUse : true;
};

RedisToken.prototype.set = function(data, done) {
	// Create connection if not already created
	this.connect();

	this.generateKey(function(err, token) {
		if (err) {
			return done(err);
		}

		// Stringify data?
		if (this.opts.stringifyData) {
			try {
				data = JSON.stringify(data);
			} catch(e) {
				return done(e);
			}
		}

		// Shared done function
		var _done = function(err) {
			if (err) {
				return done(err);
			}
			done(null, token);
		};

		// Prefix key
		var key = this.opts.prefix + token;

		// Expires or not?
		if (this.opts.expires) {
			this.conn.setex(key, this.opts.expires, data, _done);
		} else {
			this.conn.set(key, data, _done);
		}
		
	}.bind(this));
};

RedisToken.prototype.get = function(token, done) {
	// Create connection if not already created
	this.connect();

	// Prefix key
	var token = this.opts.prefix + token;

	this.conn.get(token, function(err, data) {
		if (err || !data) {
			return done(err || new Error('No data found under token'));
		}

		// Delete if single use
		if (this.opts.singleUse) {
			this.conn.del(token);
		}

		// Parse data?
		if (this.opts.stringifyData) {
			try {
				data = JSON.parse(data);
			} catch(e) {
				return done(e);
			}
		}

		// Successfully done
		done(null, data);
	}.bind(this));
};

RedisToken.prototype.generateKey = function(done) {
	// Create connection if not already created
	this.connect();

	randomToken.generateKey({
		len: this.opts.tokenLen,
		strong: this.opts.strongKey
	}, function(err, token) {
		if (err) {
			return done(err);
		}

		var key = this.prefix + token;

		this.conn.exists(key, function(err, exists) {
			if (err) {
				return done(err);
			}

			// If it exists try again
			if (exists) {
				return this.generateKey(done);
			}

			// Valid key
			done(err, token, key);
		}.bind(this));
	}.bind(this));
};

RedisToken.prototype.connect = function() {
	// Create connection if not already created
	if (!this.conn) {

		if (this.opts.redisUrl) {
			this.conn = require('redis-url').connect(this.opts.redisUrl);
		} else {
			this.conn = redis.createClient(this.opts.redisPort, this.opts.redisHost, this.opts.redisOpts);
		}
		
	}
}

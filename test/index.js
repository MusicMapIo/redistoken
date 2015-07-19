var assert = require('assert'),
	Rt = require('../'),
	redisPort = process.env.REDIS_PORT || 6379,
	redisHost = process.env.REDIS_HOST || '127.0.0.1';

describe('Redis Token', function() {

	it('should generate a token', function(done) {
		var rt = new Rt({
			redisPort: redisPort,
			redisHost: redisHost
		});
		rt.set({
			foo: 'bar'
		}, function(err, token) {
			assert.equal(err, null);
			assert.notEqual(token, undefined);
			assert.notEqual(token, null);
			assert.notEqual(token, '');

			rt.get(token, function(err, data) {
				assert.equal(err, null);
				assert.equal(data.foo, 'bar');
				done();
			});
		});
	});

	it('should generate a strong token', function(done) {
		var rt = new Rt({
			redisPort: redisPort,
			redisHost: redisHost,
			strong: true
		});
		rt.set({
			foo: 'bar'
		}, function(err, token) {
			assert.equal(err, null);
			assert.notEqual(token, undefined);
			assert.notEqual(token, null);
			assert.notEqual(token, '');

			rt.get(token, function(err, data) {
				assert.equal(err, null);
				assert.equal(data.foo, 'bar');
				done();
			});
		});
	});

	it('should expire a token', function(done) {
		var rt = new Rt({
			redisPort: redisPort,
			redisHost: redisHost,
			expires: 1
		});
		rt.set({
			foo: 'bar'
		}, function(err, token) {
			assert.equal(err, null);

			// Wait for expiration
			setTimeout(function() {
				rt.get(token, function(err, data) {
					assert.equal(err.message, 'No data found under token');
					assert(!data);
					done();
				});
			}, 1500);
		});
	});

	it('should delete a single use token', function(done) {
		var rt = new Rt({
			redisPort: redisPort,
			redisHost: redisHost
		});
		rt.set({
			foo: 'bar'
		}, function(err, token) {
			assert.equal(err, null);

			rt.get(token, function(err, data) {
				assert.equal(err, null);
				rt.get(token, function(err, data) {
					assert.equal(err.message, 'No data found under token');
					assert(!data);
					done();
				});
			});
		});
	});

});

/*jshint mocha:true*/

require('dotenv').load({path: '.env.test'});
var assert = require('chai').assert;

var notification = require('../../server/notification');

describe('Notifications', function () {

  describe('Handle Errors', function () {

    it('error Error', function () {

      var fields = notification.error(new Error('test'));

      assert(fields.Stack, 'fields.Stack should be present');
    });

    it('error String', function () {

      var fields = notification.error('test');

      assert(fields.Message === 'test', 'fields.Message should be test');
    });
  });

  describe('Handle Info', function () {

    it('info', function () {

      var fields = notification.info('Hello');

      assert(fields.Message === 'Hello', 'fields.Message should be Hello');
    });
  });
});




/*jshint node:true*/

var expect = require("chai").expect;

var utils = require("../utils");

describe("Operational Environment", function() {
  
  describe("IBM Bluemix", function() {

    it("isBluemix", function() {
      process.env.VCAP_APP_PORT = 8080;
      expect(utils.isBluemix()).to.equal(true);
    });
    
    it("isBluemix NOT", function() {
      delete process.env.VCAP_APP_PORT;
      expect(utils.isBluemix()).to.equal(false);
    });
  });

  describe("Heroku", function() {
    
    it("isHeroku", function() {
      process.env.PORT = 8080;
      expect(utils.isHeroku()).to.equal(true);
    });
    
    it("isHeroku NOT", function() {
      delete process.env.PORT;
      expect(utils.isHeroku()).to.equal(false);
    });
  });
});
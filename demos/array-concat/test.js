// Chai 
var expect = require('chai').expect;
var assert = require('chai').assert;

var party_count = 4;
var mpc = require('./mpc.js');

/**
 * CHANGE THIS: Generate inputs for your tests
 * Should return an object with this format:
 * {
 *   'party_id': [ 'test1_input', 'test2_input', ...]
 * }
 */
function generateInputs(party_count) {
  var numberOfTestCases = 10;
  var maximumStringLength = 4;
  var inputs = {};
  for (var i = 0; i < party_count; i++) {
    inputs[i+1] = [];
  }

  var generateRandomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length)+1);
    return text;
  };

  for (var i = 0; i < party_count; i++) {
    for (var j = 0; j < numberOfTestCases; j++) {
      inputs[i+1].push(generateRandomString(Math.floor((Math.random() * maximumStringLength))+1));
    }
  }
  return inputs;
}

/**
 * CHANGE THIS: Compute the expected results not in MPC
 * @param {object} inputs - same format as generateInputs output.
 * Should return a single array with the expected result for every test in order
 *   [ 'test1_output', 'test2_output', ... ]
 */
function computeResults(inputs) {
  var results = [];

  for (var j = 0; j < inputs['1'].length; j++) {
    var string = "";
    for (var k = 1; k <= party_count; k++) {
      string += inputs[k][j];
    }
    results.push(string);
  }
  return results;
}


/**
 * Do not change unless you have to.
 */
describe('Test', function() {
  this.timeout(0); // Remove timeout

  it('Exhaustive', function(done) {
    var count = 0;

    var inputs = generateInputs(party_count);
    var results = computeResults(inputs);

    var onConnect = function(jiff_instance) {
      var partyInputs = inputs[jiff_instance.id];
      var promises = [];
      for (var j = 0; j < partyInputs.length; j++) {
        var promise = mpc.compute(partyInputs[j], jiff_instance);
        promises.push(promise);
      }

      Promise.all(promises).then(function(asciiCode) {
        count++;
        var values = "";
    
        // convert each opened number to a character
        // and add it to the final stringls
        for(let i = 0; i < values.length; i++) {
          values += String.fromCharCode(values[i]);
        }

        for (var i = 0; i < values.length; i++) {
          // construct debugging message
          var ithInputs = inputs[1][i] + "";
          for(var j = 2; j <= party_count; j++)
            ithInputs += "," + inputs[j][i];
          var msg = "Party: " + jiff_instance.id + ". inputs: [" + ithInputs + "]";

          // assert results are accurate
          try {
            assert.deepEqual(values[i], results[i], msg);
          } catch(assertionError) {
            done(assertionError);
            done = function(){}
          }
        }

        jiff_instance.disconnect();
        if (count == party_count)
          done();
      });
    };
    
    var options = { party_count: party_count, onError: console.log, onConnect: onConnect };
    for(var i = 0; i < party_count; i++)
      mpc.connect("http://localhost:8080", "mocha-test", options);
  });
});

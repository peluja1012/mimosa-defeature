"use strict";

var _ = require('lodash');

var _setObjectValuesToBoolean = function(obj, bool) {
  return _.mapValues(obj, function(val) {
    if(typeof val === "object") {
      return _setObjectValuesToBoolean(val, bool);
    }
    return bool;
  });
};

var _flattenObj = function(obj, flatObj, prefix) {
  _.forOwn(obj, function(val, key) {
    var newPrefix;
    if(prefix) {
      newPrefix = prefix.concat("-", key);
    } else {
      newPrefix = key;
    }
    if(typeof val === "object") {
      _flattenObj(val, flatObj, newPrefix);
    } else {
      flatObj[newPrefix] = val;
    }
  });

  return flatObj;
};

exports.mergeFeatureFiles = function(masterFilePath, childFilePath) {
  var masterFeaturesObj = require(masterFilePath);
  var childFeaturesObj = require(childFilePath);

  return _.merge(masterFeaturesObj, childFeaturesObj, function(a, b) {
    if( typeof a === "object" && typeof b === "boolean") {
      return _setObjectValuesToBoolean(a, b);
    }
    return undefined;
  });
};

exports.flattenFeaturesObj = function(featuresObj) {
  return _flattenObj(featuresObj, {});
};
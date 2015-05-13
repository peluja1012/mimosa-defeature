"use strict";

var template = require( './lib/template' );
var css = require( './lib/css' );
var javascript = require( './lib/javascript' );
var config = require('./config');
var fileUtils = require('./lib/file_utils');
var path = require('path');
var _ = require('lodash');

var defeatureModules = [template, css, javascript];

var _prepareFeatures = function(mimosaConfig, options, next) {
  var masterFilePath = path.join(mimosaConfig.defeature.folderFull, mimosaConfig.defeature.features.master);
  var flattenedFeaturesObj;
  if (mimosaConfig.defeature.features.child) {
    var childFilePath = path.join(mimosaConfig.defeature.folderFull, mimosaConfig.defeature.features.child);
    flattenedFeaturesObj = fileUtils.flattenFeaturesObj(fileUtils.mergeFeatureFiles(masterFilePath, childFilePath));
  } else {
    var masterFeaturesObj = require(masterFilePath);
    flattenedFeaturesObj = fileUtils.flattenFeaturesObj(masterFeaturesObj);
  }

  var includedFeatures = _.keys(_.pick(flattenedFeaturesObj, function(val, key) {
                          return val === true;
                        }));
  var excludedFeatures = _.keys(_.pick(flattenedFeaturesObj, function(val, key) {
                          return val === false;
                        }));

  mimosaConfig.defeature.includedFeatures = includedFeatures;
  mimosaConfig.defeature.excludedFeatures = excludedFeatures;

  // when running a build, add feature that
  // allows defeaturing to be build v watch specific
  // Allows for leaving things in for dev that need removing for build
  if (mimosaConfig.isBuild) {
    excludedFeatures.push("mimosa-build-exclude");
  } else {
    includedFeatures.push("mimosa-build-exclude");
  }

  // allow for defeaturing based on NODE_ENV
  // lets someone pick/choose lines of code based
  // on destination. Assume not production unless
  // explicitly defined
  if(process.env.NODE_ENV && process.env.NODE_ENV === "production") {
    includedFeatures.push("environment-production");
  } else {
    excludedFeatures.push("environment-production");
  }

  next();
};

var registration = function( mimosaConfig, register ) {
  register(['preBuild'], "init", _prepareFeatures);
  defeatureModules.forEach( function( mod ) {
    mod.registration( mimosaConfig, register );
  });
};

module.exports = {
  registration: registration,
  defaults:     config.defaults,
  validate:     config.validate
};
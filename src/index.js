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
  var childFilePath = path.join(mimosaConfig.defeature.folderFull, mimosaConfig.defeature.features.child);
  var flattenedFeaturesObj = fileUtils.flattenFeaturesObj(fileUtils.mergeFeatureFiles(masterFilePath, childFilePath));
  var includedFeatures = _.keys(_.pick(flattenedFeaturesObj, function(val, key) {
                          return val === true;
                        }));
  var excludedFeatures = _.keys(_.pick(flattenedFeaturesObj, function(val, key) {
                          return val === false;
                        }));

  mimosaConfig.defeature.includedFeatures = includedFeatures;
  mimosaConfig.defeature.excludedFeatures = excludedFeatures;

  next();
};

var registration = function( mimosaConfig, register ) {
  if (mimosaConfig.defeature.features.child) {
    register(['preBuild'], "init", _prepareFeatures);
    defeatureModules.forEach( function( mod ) {
      mod.registration( mimosaConfig, register );
    });
  }
};

module.exports = {
  registration: registration,
  defaults:     config.defaults,
  placeholder:  config.placeholder,
  validate:     config.validate
};
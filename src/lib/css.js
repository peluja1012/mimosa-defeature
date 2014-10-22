"use strict";

var regexDefeatureUtils = require('./regex_defeature_utils');
var logger = null;

var _defeature = function( mimosaConfig, options, next ) {
  if ( options.files && options.files.length ) {
    options.files.forEach( function( file ) {      
      // remove ranges from source
      var finalSource = "";
      var source = file.outputFileText;
      var start = 0;
      var opts = {
        source:                   source,
        includedFeatures:         mimosaConfig.defeature.includedFeatures,
        excludedFeatures:         mimosaConfig.defeature.excludedFeatures,
        startCommentText:         "/\\*",
        endCommentText:           "\\*/",
        logger:                   logger,
        allowEntireFileDefeature: false
      };
      var rangesToRemove = regexDefeatureUtils.mergeOverlappingRanges(regexDefeatureUtils.getRangesToRemove(opts));
      if(rangesToRemove.length > 0) {
        rangesToRemove.forEach(function(range) {
          var sourceToDelete = source.substring(range[0], range[1]);
          var linesToDelete = sourceToDelete.split('\n');
          var newLineSource = linesToDelete.reduce(function(previous) {
            return previous + "\n";
          }, '');
          
          finalSource += source.slice(start, range[0]) + newLineSource;
          start = range[1];
        });
        finalSource += source.slice(start, source.length);
        file.outputFileText = finalSource;
      }
    });
  }

  next();
};

exports.registration = function( mimosaConfig, register ) {
  logger = mimosaConfig.log;
  var exts = mimosaConfig.extensions.css;
  register( ['add', 'update', 'remove', 'buildExtension'], 'afterCompile', _defeature, exts );
};
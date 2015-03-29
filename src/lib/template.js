"use strict";

var path = require( 'path' );
var regexDefeatureUtils = require('./regex_defeature_utils');
var logger = null;

var _defeature = function( mimosaConfig, options, next ) {
  if ( options.files && options.files.length ) {

    // if need to remove blank templates, set up keepFiles array
    var keepFiles;
    if (mimosaConfig.defeature.removeFileDefeatures.template) {
      keepFiles = [];
    }

    options.files.forEach( function( file ) {
      // remove ranges from source
      var finalSource = "";
      var source = file.inputFileText;
      var start = 0;
      var opts = {
        source:           source,
        includedFeatures: mimosaConfig.defeature.includedFeatures,
        excludedFeatures: mimosaConfig.defeature.excludedFeatures,
        startCommentText: "{{!--",
        endCommentText:   "--}}",
        logger:           logger
      };
      var rangesToRemove = regexDefeatureUtils.mergeOverlappingRanges(regexDefeatureUtils.getRangesToRemove(opts));
      if(rangesToRemove.length > 0) {
        rangesToRemove.forEach(function(range) {
          finalSource += source.slice(start, range[0]);
          start = range[1];
        });
        finalSource += source.slice(start, source.length);
        file.inputFileText = finalSource;
        // keepFiles array exists, and the file has content
        // add file to keepFiles.  This leaves out any files
        // that have length = 0.
        if(keepFiles && finalSource.length && finalSource.length > 0) {
          keepFiles.push(file);
        }
      } else {
        // if removing files, need to put unchanged files into list
        // of files to keep
        if(keepFiles) {
          keepFiles.push(file);
        }
      }
    });

    // if removing files, reset file list.
    if(keepFiles) {
      options.files = keepFiles;
    }
  }

  next();
};

exports.registration = function( mimosaConfig, register ) {
  logger = mimosaConfig.log;
  var exts = mimosaConfig.extensions.template;
  register(
    ['add', 'update', 'remove', 'buildExtension'],
    'afterRead',
    _defeature,
    exts
  );
};
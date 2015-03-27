"use strict";

var path = require( 'path' ),
    util = require('util'),
    _ = require('lodash'),
    logger = null,
    rocambole = require("rocambole"),
    rocamboleToken = require("rocambole-token");

// function that allows you iterate and also break out of the iteration
var _eachTokenInBetween = function(startToken, endToken, iterator) {
  var last = endToken && endToken.next;
  while (startToken && startToken !== last) {
    var ret = iterator(startToken);
    if(!ret) {
      break;
    }
    startToken = startToken.next;
  }
};

var _stripTagsFromFeatureText = function(featureText) {
 return featureText.replace(':start', '').replace(':end', '').replace(':file', '');
};

var _processBrToken = function(token) {
  var newTokenValue = '// ';
  // No trailing whitespace on last line
  // or on any empty lines
  if (!token.next.next || rocamboleToken.isBr(token.next.next)) {
    newTokenValue = '//';
  }
  var newToken = {
    type : 'Custom', // can be anything (not used internally)
    value : newTokenValue
  };
  rocamboleToken.after(token.next, newToken);

  return newToken;
};

var _commentOutEntireFile = function(ast, tokensToRemove) {
  // Remove comment tokens that have been previously added
  if(tokensToRemove) {
    tokensToRemove.forEach(function(token) {
      rocamboleToken.remove(token);
    });
  }

  rocamboleToken.eachInBetween(ast.startToken, ast.endToken, function(token) {
    // Block comments could have newline chars, so we need to comment those out too.
    if(token.type === 'BlockComment') {
      token.raw = token.raw.replace(/\n/g, "\n//");
    }

    if(rocamboleToken.isBr(token.next)) {
      _processBrToken(token);
    }
  });
};

var _commentOutExcludedFeatures = function(mimosaConfig, ast, includedFeatures, excludedFeatures) {
    // Keeps track of whether a particular feature should be commented out or not as we iterate
    // over all the tokens
    var featureStatusList = [];
    var shouldCommentOutEntireFile = false;
    var newCommentTokens = [];
    _eachTokenInBetween(ast.startToken, ast.endToken, function(token) {
      // Find all of the block comments in the file
      if(token.type === 'BlockComment') {
        var comment = token.value;
        var isFeatureComment = comment.match(/ feature .*?/) !== null;
        if(isFeatureComment) {
          var fNameString = comment.replace('feature', '').trim();
          var fNameList = fNameString.split(',');
          var containsIncludedFeature = _.filter(fNameList, function(fName) {
            return includedFeatures.indexOf(_stripTagsFromFeatureText(fName)) !== -1;
          }).length > 0;

          // Iterate over all of the features that are mentioned in the comment
          for (var i = 0; i < fNameList.length; i++) {
            var fName = fNameList[i];
            var shouldExcludeFeature = excludedFeatures.indexOf(_stripTagsFromFeatureText(fName)) !== -1 &&
                                      !containsIncludedFeature;

            // Only comment out feature if it's in the exludedFeatures array AND the comment doesn't mention any features that
            // are in the includedFeatures array
            if(shouldExcludeFeature) {
              var cleanFName;
              var featureStatus;
              var existingFeatureStatus;
              if(fName.indexOf(":file") !== -1) {
                shouldCommentOutEntireFile = true;
                // Break out of loop
                return false;
              } else if(fName.indexOf(":start") !== -1) {
                // Start commenting out a :start feature
                cleanFName = fName.replace(":start", "");
                existingFeatureStatus = _.findWhere(featureStatusList, {name:cleanFName, type:"multiLine"});
                if(existingFeatureStatus) {
                  existingFeatureStatus.comment = true;
                } else {
                  featureStatus = {
                    type: "multiLine",
                    name: cleanFName,
                    comment: true
                  };
                  featureStatusList.push(featureStatus);
                }
              } else if(fName.indexOf(":end") !== -1) {
                // Stop commenting out the closest matching :start feature
                cleanFName = fName.replace(":end", "");
                var startingFeature = _.findWhere(featureStatusList, {name:cleanFName, type:"multiLine"});
                if(startingFeature) {
                  startingFeature.comment = false;
                }
              } else {
                // Start commenting out a single line feature
                cleanFName = fName;
                existingFeatureStatus = _.findWhere(featureStatusList, {name:cleanFName, type:"singleLine"});
                if(existingFeatureStatus) {
                  existingFeatureStatus.comment = true;
                } else {
                  featureStatus = {
                    type: "singleLine",
                    name: cleanFName,
                    comment: true
                  };
                  featureStatusList.push(featureStatus);
                }
              }
            }

          }
        }
      }

      // Actually comment out the line
      var shouldComment = shouldCommentOutEntireFile || _.where(featureStatusList, {comment:true}).length > 0;
      if(shouldComment) {
        // Block comments could have newline chars, so we need to comment those out too.
        if(token.type === 'BlockComment') {
          token.raw = token.raw.replace(/\n/g, "\n//");
        }
        if(rocamboleToken.isBr(token.next)) {
          var newToken = _processBrToken(token);
          newCommentTokens.push(newToken);

          // Stop commenting single line features
          var singleLineFeatureStatusList = _.where(featureStatusList, {type: "singleLine"});
          singleLineFeatureStatusList.forEach(function(f) {
            f.comment = false;
          });
        }
      }

      return true;
    });

    if(shouldCommentOutEntireFile) {
      // if its a file exclude, and we are not writing
      // files that have file exclude, just return false...
      if (mimosaConfig.defeature.removeFileDefeatures.javascript) {
        return false;
      }

      // ...otherwise comment out entire file
      _commentOutEntireFile(ast, newCommentTokens);
    }

    return true;
};

var _defeature = function( mimosaConfig, options, next ) {
  if ( !options.isVendor && options.files && options.files.length ) {
    var keepFiles = [];
    options.files.forEach( function( file ) {
      var includedFeatures = mimosaConfig.defeature.includedFeatures;
      var excludedFeatures = mimosaConfig.defeature.excludedFeatures;
      // Do a quick check to see if the file has any feature comments before
      // doing any heavy processing
      var shouldDefeatureFile = false;
      for (var i = 0; i < excludedFeatures.length; i++) {
        var featureName = excludedFeatures[i];
        var featureMatcher = new RegExp("/\\* feature .*?"+ featureName + ".*? \\*/", "g");
        if(featureMatcher.test(file.inputFileText)) {
          shouldDefeatureFile = true;
          break;
        }
      }

      var keep = true;
      if(shouldDefeatureFile) {
        try {
          var ast = rocambole.parse(file.inputFileText);
          var keepFile = _commentOutExcludedFeatures(mimosaConfig, ast, includedFeatures, excludedFeatures);

          // _commentOutExcludedFeatures will return false if the file has been
          // file defeatured and should not be written
          if (keepFile) {
            file.inputFileText = ast.toString();
          } else {
            keep = false;
          }
        } catch(error) {
          logger.error("Unable to defeature file [[ " + file.outputFileName + " ]] due to parsing errors ", error);
        }
      }

      // only keeping files that need to be written
      if (keep) {
        keepFiles.push(file);
      }

    });

    options.files = keepFiles;
  }

  next();
};

exports.registration = function( mimosaConfig, register ) {
  logger = mimosaConfig.log;
  var exts = mimosaConfig.extensions.javascript;
  register(
    ['add', 'update', 'remove', 'buildFile'],
    'afterRead',
    _defeature,
    exts
  );
};
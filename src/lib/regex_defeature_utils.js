"use strict";

var _ = require('lodash');

var _stripTagsFromFeatureText = function(featureText) {
 return featureText.replace(':start', '').replace(':end', '').replace(':file', '');
};

var mergeOverlappingRanges = function(rangeList) {
  if(rangeList.length === 0) {
    return rangeList;
  }

  // Sort list of ranges by start property
  var sortedRangeList = _.sortBy(rangeList, function(range) {
    return range[0];
  });

  for (var i = 0; i < sortedRangeList.length - 1; i++) {
    if(sortedRangeList[i][1] > sortedRangeList[i+1][0]) {
      var sortedRangeListCopy = sortedRangeList.slice();
      var mergedRange = [sortedRangeListCopy[i][0], Math.max(sortedRangeListCopy[i][1], sortedRangeListCopy[i+1][1])];
      sortedRangeListCopy.splice(i, 2, mergedRange);
      return mergeOverlappingRanges(sortedRangeListCopy);
    } 
  }

  return sortedRangeList;

};

var getRangesToRemove = function(opts) {
  var source                   = opts.source;
  var includedFeatures         = opts.includedFeatures;
  var excludedFeatures         = opts.excludedFeatures;
  var startCommentText         = opts.startCommentText;
  var endCommentText           = opts.endCommentText;
  var logger                   = opts.logger;
  var allowEntireFileDefeature = typeof opts.allowEntireFileDefeature !== 'undefined' ?  opts.allowEntireFileDefeature : true;

  var rangesToRemove = [];
  excludedFeatures.forEach(function(featureName) {
    var featureMatcher = new RegExp(startCommentText + " feature .*?" + featureName + ".*? " + endCommentText + "[\\s]*?\\n", "g");
    var endTagMatcher = new RegExp(startCommentText + " feature .*?" + featureName + ":end.*? " + endCommentText + "[\\s]*?(?:\\n|$)");
    var nextLineMatcher = new RegExp(".*?\\n");
    var featureCommentStartMatcher = new RegExp(startCommentText + " feature ");
    var featureCommentEndMatcher = new RegExp(" " + endCommentText + "[\\s]*\\n");
    var matchResults;

    // Find feature comments that include featureName
    while ((matchResults = featureMatcher.exec(source)) !== null) {
      var featureText = matchResults[0];

      // parse feature text i.e. 'blah:start, foo:start', 'blah', 'foo:start', 'foo, blah'
      var plainFeaturesText = featureText.replace(featureCommentStartMatcher, '').replace(featureCommentEndMatcher, '');
      var plainFeaturesArray = plainFeaturesText.split(", ");

      // features in feature comment that have to do with the excluded feature
      var relatedFeatures = _.filter(plainFeaturesArray, function(f) {
        return featureName.indexOf(_stripTagsFromFeatureText(f)) !== -1;
      });

      // features in feature comment that don't have anything to do with the excluded feature
      var otherFeatures = _.filter(plainFeaturesArray, function(f) {
        return featureName.indexOf(_stripTagsFromFeatureText(f)) === -1;
      });

      var isOtherFeatureIncluded = _.filter(otherFeatures, function(otherFeature) {
        return includedFeatures.indexOf(_stripTagsFromFeatureText(otherFeature)) !== -1;
      }).length > 0;

      // Don't add a range if both an included feature and an excluded feature are mentioned
      // in a feature comment
      if(!isOtherFeatureIncluded) {
        relatedFeatures.forEach(function(relatedFeature) {
          // Ignore end tag features
          if(relatedFeature.indexOf(":end") === -1) {
            var rangeStart, rangeEnd;
            if(relatedFeature.indexOf(":file") !== -1) {
              if(allowEntireFileDefeature) {
                rangesToRemove.push([0, source.length]);
                return rangesToRemove;
              } else {
                logger.error("Cannot use ':file' defeature option with this file extension");
              }
            } else if(relatedFeature.indexOf(":start") !== -1) {
              // Find the matching :end tag
              var endTagMatchResults = endTagMatcher.exec(source.substring(featureMatcher.lastIndex));
              if(endTagMatchResults) {
                rangeStart = matchResults.index;
                rangeEnd = featureMatcher.lastIndex + endTagMatchResults.index + endTagMatchResults[0].length;
                rangesToRemove.push([rangeStart, rangeEnd]);
              }

            } else {
              // Find the next line
              var nextLineMatchResults = nextLineMatcher.exec(source.substring(featureMatcher.lastIndex));
              if(nextLineMatchResults) {
                rangeStart = matchResults.index;
                rangeEnd = featureMatcher.lastIndex + nextLineMatchResults.index + nextLineMatchResults[0].length;
                rangesToRemove.push([rangeStart, rangeEnd]);
              }
            }
          }
        });
      }
    }
  });
  
  return rangesToRemove;
};

module.exports = {
  mergeOverlappingRanges: mergeOverlappingRanges,
  getRangesToRemove: getRangesToRemove
}; 
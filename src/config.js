"use strict";

var path = require( "path" );

exports.defaults = function() {
  return {
    defeature: {
      folder: 'feature',
      features: {
        master: 'master',
        child: null
      }
    }
  };
};


exports.placeholder = function () {
  var ph = "\n\n  defeature:            # Configuration for removing features from the application \n" +
     "    folder:'feature'              # Path to folder containing feature files \n\n" +
     "    features: \n" +
     "      master:'master'             # Name of json file containing all of the possible features the app makes available \n\n " +
     "      child: null                 # Optionally, a json file that selectively excludes features present in the master file  \n";

  return ph;
};

exports.validate = function( config, validators )  {
  var errors = [];
  if ( validators.ifExistsIsObject( errors, "defeature config", config.defeature ) ) {
    if ( validators.ifExistsIsString( errors, "defeature.folder", config.defeature.folder ) ) {
      config.defeature.folderFull = path.join( config.root, config.defeature.folder );
    }
    
    if ( validators.ifExistsIsObject( errors, "defeature.features", config.defeature.features ) ) {
      validators.ifExistsIsString( errors, "defeature.features.master", config.defeature.features.master );
      validators.ifExistsIsString( errors, "defeature.features.child", config.defeature.features.child );
    }
  }

  return errors;
};
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
/**
 * Created by patricepaquette on 2016-05-05.
 */

function BaseCashbackWebDriver(){
}

BaseCashbackWebDriver.prototype.ready = function(callback){
  return Q.Promise(function(resolve, reject){
    jQuery(document).ready(function(){
      if(callback){ callback(); }
      resolve();
    });
  });
}

BaseCashbackWebDriver.prototype.redirect = function(){
  throw new Exception("Not implemented");
}
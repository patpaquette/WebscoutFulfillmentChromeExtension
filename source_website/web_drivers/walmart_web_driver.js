/**
 * Created by patricepaquette on 2016-03-08.
 */

function WalmartWebDriver(){
}

WalmartWebDriver.prototype = new BaseWebDriver('walmart');

WalmartWebDriver.prototype.ready = function(callback){
  var that = this;

  function is_ready(){
    console.log("checking if ready");
    switch(that.page_type){
      case "shipping":
        var elements = $("section[data-view-name=shipping-address]")
          .filter(function(index, element){
            return $(element).hasClass('expanded');
          });
        return elements.length > 0;
    }

    return false;
  }


  BaseWebDriver.prototype.ready.call(this, function(){
    async.until(function(){
      return is_ready();
    }, function(done){
      setTimeout(function(){
        done();
      }, 1000)
    }, function(){
      callback();
    });
  });

}
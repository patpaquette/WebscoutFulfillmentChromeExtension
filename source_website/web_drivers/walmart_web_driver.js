/**
 * Created by patricepaquette on 2016-03-08.
 */

function WalmartWebDriver(){
}

WalmartWebDriver.prototype = new BaseWebDriver('walmart');

WalmartWebDriver.prototype.ready = function(callback){
  var that = this;

  console.log("hmm?");
  function is_ready(){
    console.log("checking if ready");
    switch(that.page_type){
      case "shipping":
        var elements = $(".checkout-address-book #COAC2ShpAddrFirstName")
          .filter(function(index, element){
            return $(element).attr('style');
          });
        console.log("elements found : " + elements.length);
        return elements.length > 0;
    }

    return false;
  }


  BaseWebDriver.prototype.ready.call(this, function(){
    var count = 0;
    async.until(function(){
      return is_ready() || ++count > 10;
    }, function(done){
      setTimeout(function(){
        done();
      }, 1000)
    }, function(){
      callback();
    });
  });

}
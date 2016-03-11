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

    return true ;
  }


  BaseWebDriver.prototype.ready.call(this, function(){
    async.until(function(){
      return is_ready();
    }, function(done){
      setTimeout(function(){
        done();
      }, 1000)
    }, function(){
      console.log($("label[for=COAC2ShpAddrFirstName]").get(0));
      callback();
    });
  });

}

WalmartWebDriver.prototype._is_dropdown = function(element){
  return $(element).hasClass('chooser') && $(element).hasClass('js-chooser');
}

WalmartWebDriver.prototype._dropdown_resolver = function(element, value){
  var that = this;
  var shipping_state = this._get_normalized_us_state(value);

  $(element).find('button')
    .filter(function(){
      return shipping_state === that._get_normalized_us_state($(this).text());
    })
    .first()
    .trigger('click');
}
/**
 * Created by patricepaquette on 2016-05-05.
 */

function UpromiseWebDriver(){
}

UpromiseWebDriver.prototype = new BaseCashbackWebDriver();

UpromiseWebDriver.prototype.redirect = function(){
  var href = jQuery("tbody#retailer_listing tr td a").attr('href');

  window.location = "https://shop.upromise.com" + href;
}

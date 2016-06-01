/**
 * Created by patricepaquette on 2016-05-05.
 */

function UpromiseWebDriver(){
}

UpromiseWebDriver.prototype = new BaseCashbackWebDriver();

UpromiseWebDriver.prototype.is_redirect_page = function(){
  if(window.location.href.indexOf('https://shop.upromise.com/e/members/benefits.php') >= 0){
    return true;
  }

  return false;
}

UpromiseWebDriver.prototype.redirect = function(){
  var href = jQuery("tbody#retailer_listing tr td a").attr('href');

  window.location = "https://shop.upromise.com" + href;
}

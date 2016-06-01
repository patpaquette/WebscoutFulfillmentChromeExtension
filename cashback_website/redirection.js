/**
 * Created by patricepaquette on 2016-05-05.
 */

function extractCashbackDomain(url) {
  var domain;
  //find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2];
  }
  else {
    domain = url.split('/')[0];
  }

  //find & remove port number
  domain = domain.split(':')[0];

  domain = domain.replace('shop.', '');
  domain = domain.replace('www.', '');
  domain = domain.replace('secure2.', ''); // For Home Depot specifically
  domain = domain.replace('.com', '');
  domain = domain.replace('.net', '');
  domain = domain.replace('.org', '');

  return domain;
}

function get_web_driver(domain){
  var capitalized_domain = domain.charAt(0).toUpperCase() + domain.slice(1);
  eval("var web_driver = new " + capitalized_domain + "WebDriver()");

  return web_driver;
}


$(document).ready(function(){
  var domain = extractCashbackDomain(window.location.href);
  var web_driver = get_web_driver(domain);

  web_driver.ready()
    .then(function(){
      if(web_driver.is_redirect_page()){
        web_driver.redirect();
      }
    });
});
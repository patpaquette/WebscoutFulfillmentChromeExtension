//check whether webscout fulfillment is enabled
var url = window.location.href;

if(url.indexOf("webscout_fulfillment=1") >= 0){
  var js_includes = [
    "bower_components/lodash/lodash.js",
    "product_page/product_page_controller.js"
  ];

  js_includes.forEach(function(url){
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(url);
    console.log(s.src);
    s.onload = function() {
      this.parentNode.removeChild(this);
    };
    (document.head || document.documentElement).appendChild(s);
  });
}



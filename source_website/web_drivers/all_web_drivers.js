/**
 * Created by Pierre-Yves on 3/6/2016.
 */

var webDrivers = [
  { host: "walmart", getWebDriver: (function() {return new WalmartWebDriver()}), path: "source_website/web_drivers/walmart_web_driver.js" },
  { host: "toysrus", getWebDriver: (function() {return new ToysrusWebDriver()}), path: "source_website/web_drivers/toysrus_web_driver.js" }
];

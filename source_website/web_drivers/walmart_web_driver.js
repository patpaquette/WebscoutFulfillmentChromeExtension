

WalmartWebDriver.prototype = new BaseWebDriver();
WalmartWebDriver.prototype.constructor = WalmartWebDriver;
function WalmartWebDriver() {
  console.log(this.setDropdownSelections());
}
WalmartWebDriver.prototype.setDropdownSelections = function(webDriver) {
  BaseWebDriver.prototype.setDropdownSelections(webDriver);
  console.log("walmart dropdown");
};

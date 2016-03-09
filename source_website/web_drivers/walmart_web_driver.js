

WalmartWebDriver.prototype = new BaseWebDriver();
WalmartWebDriver.prototype.constructor = WalmartWebDriver;

function WalmartWebDriver() {}

WalmartWebDriver.prototype.setDropdownSelections = function(order_data) {
    // Get the state format that matches Walmart's (full)
    var state = getState(order_data.shipping_state, true);

    // Find and click the button corresponding to the matching state (if there is one)
    // which will select it
    $("button[class*='chooser-option']").filter(function (index, element) {
      if ($(element).text().toUpperCase() == state.toUpperCase()) {
        console.log("clicking element");
        $(element).click();
        return true;
      }
    });
};

/**
 * Created by Pierre-Yves on 3/11/2016.
 */

/** Constructor **/
function ToysrusWebDriver() {}

ToysrusWebDriver.prototype = new BaseWebDriver('toysrus');
ToysrusWebDriver.prototype.constructor = ToysrusWebDriver;


//ToysrusWebDriver.prototype.setDropdownSelections = function(order_data) {
//  this.setStateSelection(order_data.shipping_state);
//};

//ToysrusWebDriver.prototype.setStateSelection = function(state) {
//  state = getState(state, false);

  //targetElement.dispatchEvent(evt);

  //console.log($("#billingAddress\\.address\\.stateSelect")
  //  .simulate("mousedown")
    //.val(state)
    //.children("[value='" + state + "']")
    //.prop("selected", true)
    //.click()
    //.css("color", "rgb(0, 0, 0)")
    //.change()
  //);
  //$(".stateSelect").focus();
  //$(".stateSelect").blur();
  //console.log($("#billingAddress\\.address\\.stateSelect"));
//};



/**
 * Created by patricepaquette on 2016-03-02.
 */

function BaseWebDriver(){
  this._source_domain = null;
  this._index = -1;

  this.overlay = null;
  this.dataFields = null;
  this.dataLabels = null;
  this.copyCombo = null;
  this.payload = { webDriver:this }
}


/** ------------- Property manipulation ------------- **/

/* Index */
// Change the index, highlight accordingly, and copy the new data (if any)
BaseWebDriver.prototype.setIndex = function(newIndex) {
  if(typeof newIndex == "number") {
    removeHighlight(this.dataFields);
    if(this.indexInRange(newIndex)) {
      highlight(this.dataFields.get(newIndex));
      copyToClipboard(this.dataFields.get(newIndex));
    }
    this._index = newIndex;
    console.log("index changed! " + this._index);
    return true;
  }
  // If newIndex is a <b> or <span>, find the index corresponding to the span (or the closest one
  // in the case of <b>) and call setIndex() with it
  else if(typeof newIndex == "object") {
    if($(newIndex).prop("tagName") == "B" && $(newIndex).attr("class") == "buyer-info") {
      newIndex = $(newIndex).nextAll("span.buyer-info");
    }
    if($(newIndex).prop("tagName") == "SPAN" && $(newIndex).attr("class") == "buyer-info") {
      this.setIndex(this.dataFields.index(newIndex));
    }
    else {
      console.log("span error! index not changed!");
      return false;
    }
  }
  else {
    console.log("type error! index not changed!");
    return false;
  }
};

BaseWebDriver.prototype.indexInRange = function(index) {
  if(typeof index == "number") {
    return index >= 0 && index < this.dataFields.length
  }
  else {
    return this._index >= 0 && this._index < this.dataFields.length
  }
};

BaseWebDriver.prototype.incrementIndex = function() { this.setIndex(this._index + 1) };
BaseWebDriver.prototype.decrementIndex = function() { this.setIndex(this._index - 1) };
BaseWebDriver.prototype.getIndex = function() { return this._index };
/* END */

/* Fields and labels */
BaseWebDriver.prototype.initFields = function() { this.dataFields = $("#fulfillment-overlay").find("span.buyer-info") };
BaseWebDriver.prototype.initLabels = function() { this.dataLabels = $("#fulfillment-overlay").find("b.buyer-info") };
/* END */

/* Copy combo */
BaseWebDriver.prototype.initCopyCombo = function() {
  this.copyCombo = $("#copy-combo");
};
/* END */

/* Overlay */
BaseWebDriver.prototype.insert_overlay = function(body, order_data){
  var shipping_fields = _.pick(order_data, ["shipping_name", "shipping_phone", "shipping_address_line_1", "shipping_address_line_2", "shipping_address_line_3", "shipping_city", "shipping_country_code", "shipping_state", "shipping_postal_code"]);

  shipping_fields.quantity = order_data.quantity * order_data.aoi_quantity;
  var split_name = shipping_fields.shipping_name.split(" ");
  shipping_fields.first_name = split_name[0];
  shipping_fields.last_name = split_name.splice(1).join(' ');

  var overlay_template = Handlebars.compile(body);
  var overlay_html = overlay_template(shipping_fields);

  var overlay = $(overlay_html);
  var html = $('html');
  var currentLeft = html.css('left');
  if(currentLeft == 'auto'){
    currentLeft = 0;
  }
  else{
    currentLeft = parseFloat(currentLeft);
  }

  var currentWidth = html.css('width');
  console.log(currentWidth);
  if(currentWidth == 'auto'){
    currentWidth = 0;
  }
  else{
    currentWidth = parseFloat(currentWidth);
  }

  var overlayWidth = 250;
  var newLeft = (overlayWidth + currentLeft) + 'px';
  var newWidth = currentWidth - overlayWidth;

  console.log(overlayWidth);
  console.log("newwidth : " + newWidth);

  html.css('position', 'relative');
  html.css('left', newLeft);
  html.css('width', newWidth);
  html.prepend(overlay);

  // Cache jQuery selectors
  this.initFields();
  this.initLabels();
  this.initCopyCombo();
  this.overlay = $("#fulfillment-overlay");
};
/* END */


/** ------------- Handlers ------------- **/

/* Input */
BaseWebDriver.prototype.inputClick = function(event) {
  if(event.data.webDriver.indexInRange()) {
    pasteStringInElem(this);
    event.data.webDriver.incrementIndex();
  }
};

BaseWebDriver.prototype.initInputHandlers = function(payload) {
  // Only add handler if the input doesn't have one yet
  jQuery.each($("input"), function(index, input) {
    if(!jQuery._data(input, "events")) {
      $(input).click(payload, payload.webDriver.inputClick);
      console.log("event added to input");
    }
  });
};
/* END */

/* Copy combo */
BaseWebDriver.prototype.copyComboClick = function(event) {
  event.data.webDriver.initInputHandlers(event.data);
  event.data.webDriver.setIndex(0);
  event.data.webDriver.copyCombo.text("Restart copy combo!");
};

BaseWebDriver.prototype.initCopyComboHandler = function(payload) {
  // Only add handler if the button doesn't have one yet
  if(!jQuery._data(payload.webDriver.copyCombo, "events")) {
    payload.webDriver.copyCombo.click(payload, payload.webDriver.copyComboClick);
    console.log("event added to copy combo button");
  }
};
/* END */

/* Click to copy */
BaseWebDriver.prototype.dataFieldsClick = function(event) {
  event.data.webDriver.initInputHandlers(event.data);
  event.data.webDriver.setIndex(this);
  console.log("clicked field");
};
BaseWebDriver.prototype.dataLabelsClick = function(event) {
  event.data.webDriver.initInputHandlers(event.data);
  event.data.webDriver.setIndex(this);
  console.log("clicked label");
};
BaseWebDriver.prototype.initClickToCopyHandlers = function(payload) {
  // Data fields handler
  jQuery.each(payload.webDriver.dataFields, function(index, dataField) {
    if (!jQuery._data(dataField, "events")) {
      $(dataField).click(payload, payload.webDriver.dataFieldsClick)
    }
  });
  // Data labels handler
  jQuery.each(payload.webDriver.dataLabels, function(index, dataLabel) {
    if (!jQuery._data(dataLabel, "events")) {
      $(dataLabel).click(payload, payload.webDriver.dataLabelsClick)
    }
  });
};
/* END */

/* Dropdown */
BaseWebDriver.prototype.setDropdownSelections = function(webDriver) {};
/* END */


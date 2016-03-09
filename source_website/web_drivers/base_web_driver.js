/**
 * Created by patricepaquette on 2016-03-02.
 */

var backend_api_endpoint = "https://45.55.18.141";

function BaseWebDriver(domain_host){
  var that = this;
  this.domain_host = domain_host;
  this._index = -1;

  this.overlay = null;
  this.dataFields = null;
  this.dataLabels = null;
  this.copyCombo = null;

  this.orderData = null;
  this.page_type = null;
  this.fulfillment_data = null;
  this.page_type_fulfillment_data = null;
  this.fulfillment_data_p = null;

  this._fetch_fulfillment_data(domain_host)
    .then(function(fulfillment_data){
      that._resolve_page_type(fulfillment_data);
    });
}


/** ------------- Main ------------- **/
BaseWebDriver.prototype.mainInit = function(body, response) {
  this.orderData = response.order_data;

  if($("#fulfillment-overlay").length == 0) {
    this.insert_overlay(body, this.orderData);
  }

  // Cache jQuery selectors
  this.cacheFieldsJQ();
  this.cacheLabelsJQ();
  this.cacheCopyComboJQ();
  this.cacheOverlayJQ();

  // Initialize handlers
  var payload = { webDriver: this };
  this.initCopyComboHandler(payload);
  this.initClickToCopyHandlers(payload);
  //this.initInputHandlers; This is done inside click handlers

  setTimeout(function() {
    this.copyCombo.text("Start copy combo!");
  }, 2500);
};


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


/* Fields and labels */
BaseWebDriver.prototype.cacheFieldsJQ = function() { this.dataFields = $("#fulfillment-overlay").find("span.buyer-info") };
BaseWebDriver.prototype.cacheLabelsJQ = function() { this.dataLabels = $("#fulfillment-overlay").find("b.buyer-info") };


/* Copy combo */
BaseWebDriver.prototype.cacheCopyComboJQ = function() {
  this.copyCombo = $("#copy-combo");
};


/* Overlay */
BaseWebDriver.prototype.cacheOverlayJQ = function() { this.overlay = $("#fulfillment-overlay") };
// Insert extension overlay into source page
BaseWebDriver.prototype.insert_overlay = function(body, order_data) {
  var shipping_fields = _.pick(order_data, ["shipping_name", "shipping_phone", "shipping_address_line_1", "shipping_address_line_2", "shipping_address_line_3", "shipping_city", "shipping_country_code", "shipping_state", "shipping_postal_code"]);

  shipping_fields.quantity = order_data.quantity * order_data.aoi_quantity;
  var split_name = shipping_fields.shipping_name.split(" ");
  shipping_fields.first_name = split_name[0];
  shipping_fields.last_name = split_name.splice(1).join(' ');
  var shipping_fields_map = {"first_name": "firstname", "last_name": "lastname", "shipping_address_line_1": "address", "shipping_city": "city", "shipping_state": "state", "shipping_postal_code": "postal_code", "shipping_phone": "phone"};

  _.each(shipping_fields_map, function(field_name, key){
    var value = shipping_fields[key];

    if(value){
      console.log(this);
      this.set_field_value(field_name, shipping_fields[key]);
    }
  });

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
};


/** ------------- Autofill ------------- **/
BaseWebDriver.prototype._fetch_fulfillment_data = function(domain_host){
  this.fulfillment_data_p = Q.Promise(function(resolve, reject, notify){
    $.get(backend_api_endpoint + "/model/domains/" + domain_host + "/get_fulfillment_selectors", function(body){
      var data = body.data;
      console.log(data);
      resolve(data);
    });
  });

  return this.fulfillment_data_p;
};

BaseWebDriver.prototype._resolve_page_type = function(fulfillment_data){
  var url = document.location.href;
  var that = this;

  _.some(fulfillment_data, function(page_type_data){
    return _.some(page_type_data["domainPageTypeMatches"], function(match_regex_data){
      var match_regex = match_regex_data["match_regex"];

      if(url.match(match_regex)){
        that.page_type = page_type_data["page_type"];
        that.page_type_fulfillment_data = page_type_data;
        return true;
      }

      return false;
    });
  });

  console.log("Page type : " + that.page_type);
};

BaseWebDriver.prototype.ready = function(callback){
  console.log("called base ready");
  this.fulfillment_data_p.then(function(){
    callback();
  });
};

//provision source page with extra code (ex. event listeners)
BaseWebDriver.prototype.provision = function(){

};

//set field selector
BaseWebDriver.prototype.set_field_value = function(field, value){
  var success = false;
  var that = this;

  console.log("value : " + value);
  copyToClipboard($("<span>" + value + "</span>").get(0));

  if(!that.page_type_fulfillment_data){
    throw new Error("fulfillment data not available");
  }

  var field_autofill_data = _.filter(that.page_type_fulfillment_data["domainPageTypeSelectors"], function(autofulfill_data){
    return autofulfill_data["field"] == field;
  });

  _.each(field_autofill_data, function(field_autofill_selector_data){
    var selector = field_autofill_selector_data["selector"];
    var selector_type = field_autofill_selector_data["selector_type"];

    if(selector_type === 'css'){
      console.log(selector);
      var matches = $(selector);

      console.log(matches);
      if(matches.length > 0){
        success = true;
        pasteStringInElem(matches.get(0));
      }
    }
  });

  return success;
};

//set page type match regex
BaseWebDriver.prototype.add_page_type_match_regex = function(match_regex){
  var that = this;

  return Q.promise(function(resolve, reject){
    $.post(backend_api_endpoint + "/model/domains/" + domain_host + "/add_page_type_match", {page_type: page_type, match_regex: match_regex}, function(body){
      resolve();
    });
  });
};


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

/* Copy combo */
BaseWebDriver.prototype.copyComboClick = function(event) {
  event.data.webDriver.initInputHandlers(event.data);
  event.data.webDriver.setDropdownSelections(event.data.webDriver.orderData);
  event.data.webDriver.setIndex(0);
  event.data.webDriver.copyCombo.text("Restart copy combo!");
};

BaseWebDriver.prototype.initCopyComboHandler = function(payload) {
  // Only add handler if the button doesn't have one yet
  console.log(payload.webDriver.copyCombo);
  if(!jQuery._data(payload.webDriver.copyCombo, "events")) {
    payload.webDriver.copyCombo.click(payload, payload.webDriver.copyComboClick);
    console.log("event added to copy combo button");
  }
};

/* Click to copy */
BaseWebDriver.prototype.dataFieldsClick = function(event) {
  event.data.webDriver.initInputHandlers(event.data);
  event.data.webDriver.setIndex(this);
  event.data.webDriver.copyCombo.text("Restart copy combo!");
  console.log("clicked field");
};
BaseWebDriver.prototype.dataLabelsClick = function(event) {
  event.data.webDriver.initInputHandlers(event.data);
  event.data.webDriver.setIndex(this);
  event.data.webDriver.copyCombo.text("Restart copy combo!");
  console.log("clicked label");
};
BaseWebDriver.prototype.initClickToCopyHandlers = function(payload) {
  // Data fields handler
  jQuery.each(payload.webDriver.dataFields, function(index, dataField) {
    if (!jQuery._data(dataField, "events")) {
      $(dataField).click(payload, payload.webDriver.dataFieldsClick);
    }
  });
  // Data labels handler
  jQuery.each(payload.webDriver.dataLabels, function(index, dataLabel) {
    if (!jQuery._data(dataLabel, "events")) {
      $(dataLabel).click(payload, payload.webDriver.dataLabelsClick);
    }
  });
};

/* Dropdown */
BaseWebDriver.prototype.setDropdownSelections = function(order_data) {
  console.log("base dropdown")
};

/** ------------- Utility ------------- **/

function copyToClipboard(elem) {
  // Create hidden text element, if it doesn't already exist
  var targetId = "_hiddenCopyText_";
  console.log(document.body);
  console.log("element: ");
  console.log(elem);
  var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
  var origSelectionStart, origSelectionEnd;
  if (isInput) {
    // Can just use the original source element for the selection and copy
    target = elem;
    origSelectionStart = elem.selectionStart;
    origSelectionEnd = elem.selectionEnd;
  } else {
    // Must use a temporary form element for the selection and copy
    target = document.getElementById(targetId);
    console.log(target);
    console.log(!target);
    if (!target) {
      var target = document.createElement("textarea");
      target.style.position = "absolute";
      target.style.left = "-9999px";
      target.style.top = "0";
      target.id = targetId;
      document.body.appendChild(target);
    }
    target.textContent = elem.textContent;
  }
  // Select the content
  var currentFocus = document.activeElement;
  target.focus();
  target.setSelectionRange(0, target.value.length);

  // Copy the selection
  var succeed;
  try {
    succeed = document.execCommand("copy");
  } catch(e) {
    succeed = false;
  }

  // Restore original focus
  if (currentFocus && typeof currentFocus.focus === "function") {
    currentFocus.focus();
  }

  if (isInput) {
    // Restore prior selection
    elem.setSelectionRange(origSelectionStart, origSelectionEnd);
  } else {
    // Clear temporary content
    target.textContent = "";
  }
  return succeed;
}

function pasteStringInElem(elem){
  console.log("elem to paste in ");
  console.log(elem);
  $(elem).select();
  if(document.execCommand('paste')){
    console.log("should have pasted!");
  }
  else{
    console.log("no paste");
  }
}

function highlight(elem) {
  $(elem).css("background-color", "yellow");
}

function removeHighlight(elem) {
  $(elem).css("background-color", "");
}

/**
 * Created by patricepaquette on 2016-02-22.
 */

/** ----------- Overlay data ----------- **/
function OverlayData() {
  this._index = -1;
  this.overlay = null;
  this.fields = null;
  this.labels = null;
  this.autofill = null;
  this.copyCombo = null;
  this.skip = null;
  this.recorder = null;
}

/* ----------- Index manipulation ----------- */
//  NOTE: should probably use switch/case
// Change the index, highlight accordingly, and copy the new data (if any).
// An index of -1 resets everything to initial values.
OverlayData.prototype.setIndex = function(newIndex) {
  if(typeof newIndex == "number") {
    removeHighlight(this.fields);
    if(this.indexInRange(newIndex)) {
      this._index = newIndex;
      // Make sure the new field hasn't been used already (if it has, go to the next field)
      if($(this.fields.get(newIndex)).hasClass("success")) {
        console.log("skipping to " + (newIndex + 1));
        this.incrementIndex();
        return;
      } else {
        highlight(this.fields.get(newIndex));
        copyToClipboard(this.fields.get(newIndex));
        console.log("index successfully changed! " + this._index);
        return true;
      }
    } else if(newIndex == -1) {
      this.fields.removeClass("success");
      this._index = -1;
      this.copyCombo.text("Start copy combo!");
      console.log("reset successful");
      return;
    }
    console.log("index not in range");
    return false;
  }
  // If newIndex is a <b> or <span>, find the index corresponding to the span (or the closest one
  // in the case of <b>) and call setIndex() with it
  else if(typeof newIndex == "object") {
    if($(newIndex).prop("tagName") == "B" && $(newIndex).hasClass("buyer-info")) {
      newIndex = $(newIndex).nextAll("span.buyer-info");
      $(newIndex).removeClass("success");
    }
    if($(newIndex).prop("tagName") == "SPAN" && $(newIndex).hasClass("buyer-info")) {
      this.setIndex(this.fields.index(newIndex));
      return;
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
OverlayData.prototype.indexInRange = function(index) {
  if(typeof index == "number") {
    return index >= 0 && index < this.fields.length;
  }
  else if(!index) {
    return this._index >= 0 && this._index < this.fields.length;
  }
};
OverlayData.prototype.incrementIndex = function() { return this.setIndex(this._index + 1) };
OverlayData.prototype.decrementIndex = function() { return this.setIndex(this._index - 1) };
OverlayData.prototype.getIndex = function() { return this._index };

/** ----------- Misc ----------- **/
function extractDomain(url) {
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

  domain = domain.replace('www.', '');
  domain = domain.replace('.com', '');
  domain = domain.replace('.net', '');
  domain = domain.replace('.org', '');

  return domain;
}

function getWebDriver(source_domain){
  try{
    var capitalized_domain = source_domain.charAt(0).toUpperCase() + source_domain.slice(1);
    eval("var web_driver = new " + capitalized_domain + "WebDriver()");

    return web_driver;
  }
  catch(e){
    return new BaseWebDriver(source_domain);
  }
}

/** ----------- Utility ----------- **/
function copyToClipboard(elem) {
  // Create hidden text element, if it doesn't already exist
  var targetId = "_hiddenCopyText_";

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

function fill_input_success(elem){
  if(typeof elem == "string") {
    $("span[field-name=" + elem + "]").addClass('success');
  } else {
    $(elem).addClass('success');
  }
}

function highlight(elem) {
  $(elem).css("background-color", "yellow");
}

function removeHighlight(elem) {
  $(elem).css("background-color", "");
}

function pasteStringInElem(elem){
  $(elem).select();
  if(document.execCommand('paste')){
    console.log("should have pasted!");
  }
  else{
    console.log("no paste");
  }
}

/** ----------- Recorder ----------- **/
function save_element_selector(web_driver, element, page_type, field){
  var id = element.getAttribute('id');
  var selector = "#" + id;

  if(id){
    return web_driver.add_page_type_field_selector(page_type, field, selector, 'css');
  }
}

/** ----------- Autofill ----------- **/
function autofill_shipping_form(web_driver, shipping_fields){
  var fulfillment_fields_map = {"first_name": "firstname", "last_name": "lastname", "shipping_address_line_1": "address", "shipping_city": "city", "shipping_state": "state", "shipping_postal_code": "postal_code", "shipping_phone": "phone", "quantity": "quantity"};

  _.each(fulfillment_fields_map, function(field_name, key){
    var value = shipping_fields[key];

    if(value){
      web_driver.set_field_value(field_name, shipping_fields[key]) && fill_input_success(field_name);
    }
  });
}

/** ----------- Main script ----------- **/
$(document).ready(function(){
  var field_to_page_type_map = { "firstname": "shipping", "lastname": "shipping", "address": "shipping", "city": "shipping", "state": "shipping", "postal_code": "shipping", "phone": "shipping", "quantity": "product"};

  var web_driver = getWebDriver(extractDomain(window.location.href));

  web_driver.ready(function(){
    console.log("is ready");
    chrome.runtime.sendMessage({get_order_data: true}, function(response){
      $.get(chrome.extension.getURL("source_website/fulfillment_overlay.html"), function(body){
        var overlay_data;

        /* -- Fulfillment overlay -- */
        // Build fulfillment overlay (shows shipping address, name, etc) if it hasn't been done already
        if($("#fulfillment-overlay").length == 0) {
          var shipping_fields = _.pick(response.order_data, ["shipping_name", "shipping_phone", "shipping_address_line_1", "shipping_address_line_2", "shipping_address_line_3", "shipping_city", "shipping_country_code", "shipping_state", "shipping_postal_code"]);

          shipping_fields.quantity = response.order_data.quantity * response.order_data.aoi_quantity;
          var split_name = shipping_fields.shipping_name.split(" ");
          shipping_fields.first_name = split_name[0];
          shipping_fields.last_name = split_name.splice(1).join(' ');


          var overlay_template = Handlebars.compile(body);
          var overlay_html = overlay_template(shipping_fields);
          web_driver.insert_overlay(overlay_html);

          // autofill_shipping_form(web_driver, shipping_fields);

          // Create OverlayData object and cache jQuery selectors
          overlay_data = new OverlayData();
          overlay_data.overlay = $("#fulfillment-overlay");
          overlay_data.autofill = overlay_data.overlay.find("#attempt-autofill");
          overlay_data.copyCombo = overlay_data.overlay.find("#copy-combo");
          overlay_data.skip = overlay_data.overlay.find("#skip-field");
          overlay_data.reset = overlay_data.overlay.find("#reset-overlay");
          overlay_data.recorder = overlay_data.overlay.find("#selector-recording-toggle");
          overlay_data.fields = overlay_data.overlay.find("span.buyer-info");
          overlay_data.labels = overlay_data.overlay.find("b.buyer-info");

          /** ----------- Button click handlers ----------- **/
          /* -- Autofill button handler -- */
          $(overlay_data.autofill).click(overlay_data, function(event){
            autofill_shipping_form(web_driver, shipping_fields);
            event.data.setIndex(1);
          });

          /* -- Copy combo .click handler -- */
          $(overlay_data.copyCombo)
            .click(overlay_data, function(event) {
              // Skip the quantity field by starting at index 1
              event.data.setIndex(1);
              $(event.data.copyCombo).text("Restart copy combo!");
          });

          /* -- Selector recording button .click handler -- */
          var record_selectors = false;
          $(overlay_data.recorder)
            .click(function(){
              record_selectors = !record_selectors;

              if(record_selectors){
                $(this).text("Turn off selector recording");
              }
              else{
                $(this).text("Turn on selector recording");
              }
          });

          /* -- Skip field .click handler -- */
          $(overlay_data.skip)
            .click(overlay_data, function(event) {
              if(event.data.indexInRange() && event.data.incrementIndex()) {
                fill_input_success(event.data.fields.get(event.data.getIndex() - 1))
              }
            });

          /* -- Reset .click handler -- */
          $(overlay_data.reset)
            .click(overlay_data, function(event) {
              event.data.setIndex(-1);
            });

          /* -- Fields and labels (click-to-copy) handlers -- */
          $(overlay_data.fields)
            .click(overlay_data, function(event) {
              $(this).removeClass('success');
              event.data.setIndex(this);
          });
          $(overlay_data.labels)
            .click(overlay_data, function(event) {
              event.data.setIndex(this);
          });

          /* -- Input .click handlers -- */
          // Add .click handler with payload to all inputs
          jQuery.each($("input"), function(index, input) {
            if (!jQuery._data(input, "events")) {
              $(input)
                .click(overlay_data, function (event) {
                  // Only change input values if copy combo or a span has been clicked
                  if (event.data.indexInRange()) {
                    fill_input_success(event.data.fields.get(event.data.getIndex()));
                    pasteStringInElem(this);
                    event.data.incrementIndex();

                    if (record_selectors) {
                      save_element_selector(web_driver, this, field_to_page_type_map[field_name], field_name);
                    }
                  }
              });
            }
          });

          // Change the text of the button to indicate that everything is ready to go
          $(overlay_data.copyCombo).text("Start copy combo!");
        }


        ///* -- Keyboard shortcuts -- */
        //var altDown = false;
        //
        //$(document).keydown(altDown, function(event) {
        //  if(event.keyCode == 18) {
        //    event.altDown = true;
        //  }
        //  else if(event.altDown && event.keyCode == 81) {
        //    console.log("ALT+Q keybind!"); // doesn't work! :(
        //  }
        //  console.log(event.keyCode);
        //});
        //$(document).keyup(altDown, function(event) {
        //  if(event.keyCode == 18) {
        //    event.altDown = false;
        //  }
        //  console.log(event.keyCode);
        //});

        //
        //$("#billingAddress\\.address\\.stateSelect").on("click mousedown mouseup focus blur keydown change", function(e){
        //  console.log(e);
        //});
        //$("#billingAddress\\.address\\.stateSelect").find("option").on("click mousedown mouseup focus blur keydown change", function(e){
        //  console.log(e);
        //});
      });
    });
  });
});


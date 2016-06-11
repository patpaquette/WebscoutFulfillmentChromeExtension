/**
 * Created by patricepaquette on 2016-02-22.
 */

/** ----------- Overlay data ----------- **/
function OverlayData() {
  this._index = -1;

  this.overlay = null;

  // Buttons
  this.autofill = null;
  this.copyCombo = null;
  this.reset = null;
  this.previous = null;
  this.next = null;
  this.recorder = null;

  // Fields and labels
  this.fields = null;
  this.labels = null;
}

/* ----------- Misc ----------- */
OverlayData.prototype.cacheSelectors = function () {
  this.overlay = $("#fulfillment-overlay");

  // Buttons
  this.autofill = this.overlay.find("#attempt-autofill");
  this.copyCombo = this.overlay.find("#copy-combo");
  this.reset = this.overlay.find("#reset-overlay");
  this.recorder = this.overlay.find("#selector-recording-toggle");
  this.previous = this.overlay.find("#previous-field");
  this.next = this.overlay.find("#next-field");

  // Fields and labels
  this.fields = this.overlay.find("span.order-info, input.order-info");
  this.labels = this.overlay.find("b.order-info");
  console.log(this.fields);
};
OverlayData.prototype.getCurrentField = function() {
  if (this.indexInRange()) {
    return this.fields.get(this._index);
  }
};
/* Get the closest field (descending) that matches the filter, starting from the current index.
** If no filter is provided, get the previous field.*/
OverlayData.prototype.getPreviousField = function(filter) {
  if (this.indexInRange() && filter) {
    return $(this.fields).slice(0, this._index).filter(filter).last();
  }
  else if (this.indexInRange(this._index - 1)) {
    return this.fields.get(this._index - 1);
  }
};
/* Get the closest field (ascending) that matches the filter, starting from the current index.
** If no filter is provided, get the next field.*/
OverlayData.prototype.getNextField = function (filter) {
  if (this.indexInRange(this._index + 1) && filter) {
    return $(this.fields).slice(this._index + 1).filter(filter).first();
  }
  else if (this.indexInRange(this._index + 1)) {
    return this.fields.get(this._index + 1);
  }
};
OverlayData.prototype.selectQuantityField = function() {
  var field = $(this.fields).find("span[field-name='quantity']");
  removeHighlight(this.fields);
  highlight(field);
  copyToClipboard(field);
};
OverlayData.prototype.resetAll = function () {
  this.cacheSelectors();
  removeHighlight(this.fields);
  this.fields.removeClass("success");
  this._index = -1;
  this.copyCombo.text("Start copy combo!");
  console.log("reset successful");
};

/* ----------- Index manipulation ----------- */
//  NOTE: should probably use switch/case
// Change the index, highlight accordingly, and copy the new data (if any).
// The quantity field is always skipped.
OverlayData.prototype.setIndex = function (newIndex) {
  if (typeof newIndex == "number") {
    removeHighlight(this.fields);
    if (this.indexInRange(newIndex)) {
      var oldIndex = this._index;
      this._index = newIndex;
      if ($(this.fields.get(newIndex)).attr("skip") == "true") {
        if(newIndex < oldIndex) {
          console.log("skipping to " + (newIndex - 1));
          this.decrementIndex();
        }
        else if (newIndex > oldIndex) {
          console.log("skipping to " + (newIndex + 1));
          this.incrementIndex();
        }
        return;
      }
      // Successful index change within bounds
      else {
        highlight(this.fields.get(newIndex));
        copyToClipboard(this.fields.get(newIndex));
        console.log("index successfully changed! " + this._index);
        return true;
      }
    }
    else if (newIndex == this.fields.length || newIndex == -1) {
      this._index = newIndex;
      console.log("index now on bound " + this._index);
      return;
    }

    console.log("index not in bounds!");
    return false;
  }
  // If newIndex is a <b> or <span>, find the index corresponding to the span (or the closest one
  // in the case of <b>) and call setIndex() with it
  else if (typeof newIndex == "object") {
    if ($(newIndex).prop("tagName") == "B" && $(newIndex).hasClass("order-info")) {
      newIndex = $(newIndex).nextAll("span.order-info");
      removeSuccess(newIndex);
    }
    if (($(newIndex).prop("tagName") == "SPAN" || $(newIndex).prop("tagName") == "INPUT") && $(newIndex).hasClass("order-info")) {
      this.setIndex(this.fields.index(newIndex));
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
OverlayData.prototype.indexInRange = function (index) {
  if (typeof index == "number") {
    return index >= 0 && index < this.fields.length;
  }
  else if (!index) {
    return this._index >= 0 && this._index < this.fields.length;
  }
};
OverlayData.prototype.incrementIndex = function () {
  return this.setIndex(this._index + 1)
};
OverlayData.prototype.decrementIndex = function () {
  return this.setIndex(this._index - 1)
};
OverlayData.prototype.getIndex = function () {
  return this._index
};

/** ----------- Misc functions ----------- **/
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
  domain = domain.replace('secure2.', ''); // For Home Depot specifically
  domain = domain.replace('.com', '');
  domain = domain.replace('.net', '');
  domain = domain.replace('.org', '');

  return domain;
}

function getWebDriver(source_domain) {
  try {
    var capitalized_domain = source_domain.charAt(0).toUpperCase() + source_domain.slice(1);
    eval("var web_driver = new " + capitalized_domain + "WebDriver()");

    return web_driver;
  }
  catch (e) {
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
  } catch (e) {
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

function fill_input_success(field) {
  if (typeof field == "string") {
    $("span[field-name=" + field + "]").addClass('success').attr("skip", "true");
  }
  else if (typeof field == "object") {
    $(field).addClass('success').attr("skip", "true");
  }
}

function removeSuccess(field) {
  return $(field).removeClass("success").attr("skip", "false");
}

function highlight(elem) {
  var tagName = $(elem).prop("tagName");
  switch(tagName) {
    case("SPAN"):
      $(elem).css("background-color", "yellow");
      break;
    case("BUTTON"):
      $(elem).css("border-style", "inset");
      break;
    case("INPUT"):
      $(elem).css("background-color", "yellow");
      break;
  }
}

function removeHighlight(elem) {
  var tagName = $(elem).prop("tagName");
  switch(tagName) {
    case("SPAN"):
      $(elem).css("background-color", "");
      break;
    case("BUTTON"):
      $(elem).css("border-style", "");
      break;
    case("INPUT"):
      $(elem).css("background-color", "");
  }
}

function pasteStringInElem(elem) {
  $(elem).select();
  if (document.execCommand('paste')) {
    console.log("should have pasted!");
  }
  else {
    console.log("no paste");
  }
}

/** ----------- Autofill ----------- **/
function autofill_shipping_form(web_driver, shipping_fields) {
  //autofill form values
  var fulfillment_fields_map = {
    "first_name": "firstname",
    "last_name": "lastname",
    "shipping_address_line_1": "address",
    "shipping_address_line_2": "address_2",
    "shipping_address_line_3": "address_3",
    "shipping_city": "city",
    "shipping_state": "state",
    "shipping_postal_code": "postal_code",
    "shipping_phone": "phone",
    "quantity": "quantity"
  };

  _.each(fulfillment_fields_map, function (field_name, key) {
    var value = shipping_fields[key];

    if (value) {
      console.log(field_name);
      console.log(value);
      web_driver.set_field_value(field_name, shipping_fields[key]) && fill_input_success(field_name);
    }
  });

  //autofill overlay values (cost, source confirmation, account email)
  var fields_to_fill = ["cost", "taxes", "source_confirmation", "account_email"];

  _.each(fields_to_fill, function(field){
    var val = web_driver.get_field_value(field);

    if((field === 'cost' || field === 'taxes') && val){
      val = val.replace('$', '');
    }

    if(val && val.length > 0){
      $("input[field-name='" + field + "']").val(val);
    }
  });
}

function highlight_prices_for_selection() {
  var price_regex = /^\$\d+\.\d\d$/m;
  var elem_matches = $(":contains('$')")
    .filter(function () {
      var trimmed_str = $(this).text().trim();
      var matches = trimmed_str.match(price_regex);

      if (matches) {
        return trimmed_str.length === matches[0].length;
      }

      return false;
    })
    .addClass('selection-highlight')
    .on("click.selection-highlight", function () {
      $("#cost-input")
        .attr('value', $(this).text().trim().replace('$', ''))
        .trigger('input');

      elem_matches
        .removeClass('selection-highlight')
        .off("click.selection-highlight");
    });
}

function highlight_source_confirmation_for_selection() {
  var source_confirmation_regex = /#?[a-zA-Z0-9-]+#?[\d-]+/m;
  var elem_matches = $("div, span, p")
    .filter(function () {
      var trimmed_str = $(this).text().trim();
      var matches = trimmed_str.match(source_confirmation_regex);

      console.log(trimmed_str);

      if (matches) {
        return trimmed_str.length === matches[0].length;
      }

      return false;
    })
    .addClass("selection-highlight")
    .on("click.selection-highlight", function () {
      $("#confirmation-number")
        .attr('value', $(this).text().trim())
        .trigger('input');

      elem_matches
        .removeClass('selection-highlight')
        .off('click.selection-highlight');
    });
}
function highlight_account_email_for_selection() {
  var account_email_regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/m;
  var elem_matches = $(":contains('@')")
    .filter(function () {
      var trimmed_str = $(this).text().trim();
      var matches = trimmed_str.match(account_email_regex);

      console.log(trimmed_str);

      if (matches) {
        return trimmed_str.length === matches[0].length;
      }

      return false;
    })
    .addClass("selection-highlight")
    .on("click.selection-highlight", function () {
      $("#account-email")
        .attr('value', $(this).text().trim())
        .trigger('input');

      elem_matches
        .removeClass('selection-highlight')
        .off('click.selection-highlight');
    });
}

function set_fulfillment_timeout(order_data){
  setTimeout(function(){
    chrome.runtime.sendMessage({fulfillment_timeout: true, order_data: order_data})
  }, 1800000);
}

function init_fulfillment(web_driver, order_data, login_data){
  $.get(chrome.extension.getURL("source_website/fulfillment_overlay.html"), function (body) {
    var overlay_data;
    /* -- Fulfillment overlay -- */
    // Build fulfillment overlay (shows shipping address, name, etc) if it hasn't been done already
    if ($("#fulfillment-overlay").length == 0) {
      var shipping_fields = _.pick(order_data, ["shipping_name", "shipping_phone", "shipping_address_line_1", "shipping_address_line_2", "shipping_address_line_3", "shipping_city", "shipping_country_code", "shipping_state", "shipping_postal_code", "item_source_link"]);
      console.log(login_data);
      shipping_fields.quantity = order_data.quantity * order_data.aoi_quantity;
      if(!login_data.error) {
        shipping_fields.username = login_data.username;
        shipping_fields.password = login_data.password;
      }
      else { shipping_fields.username = login_data.error; }
      var split_name = shipping_fields.shipping_name.split(" ");
      shipping_fields.first_name = split_name[0];
      shipping_fields.last_name = split_name.splice(1).join(' ');

      var overlay_template = Handlebars.compile(body);
      var overlay_html = overlay_template(shipping_fields);
      web_driver.insert_overlay(overlay_html);

      // autofill_shipping_form(web_driver, shipping_fields);

      // Create overlayData object and cache jQuery selectors
      overlay_data = new OverlayData();
      overlay_data.cacheSelectors();


      /** ----------- Handlers ----------- **/
      function provision_inputs_event_handlers() {
        /* -- Input .click handlers -- */
        // Add .click handler with payload to all inputs
        jQuery.each($("input"), function (index, input) {
          if (!jQuery._data(input, "events")) {
            $(input)
              .off('click.webscout-fulfillment')
              .on('click.webscout-fulfillment', overlay_data, function (event) {
                var currentField;
                if(currentField = event.data.getCurrentField()) {
                  if(record_selectors) {
                    var field_name = $(currentField).attr("field-name");
                    console.log(field_name);
                    web_driver.save_element_selector(this, field_to_page_type_map[field_name], field_name);
                  }
                  fill_input_success(currentField);
                  pasteStringInElem(this);
                  event.data.incrementIndex();
                }
              });
          }
        });
      }

      /* -- Autofill button handler -- */
      $(overlay_data.autofill).click(overlay_data, function (event) {
        autofill_shipping_form(web_driver, shipping_fields);
        console.log(event.data.fields.length);
        event.data.setIndex(0);
      });

      /* -- Copy combo .click handler -- */
      $(overlay_data.copyCombo).click(overlay_data, function (event) {
        // Skip the quantity field by starting at index 1
        event.data.setIndex(1);
        $(event.data.copyCombo).text("Restart combo!");
        provision_inputs_event_handlers();
      });

      /* -- Reset .click handler -- */
      $(overlay_data.reset)
        .click(overlay_data, function (event) {
          event.data.resetAll();
        });

      /* -- Selector recording button .click handler -- */
      var record_selectors = false;
      $(overlay_data.recorder)
        .click(function () {
          record_selectors = !record_selectors;

          // See input .click handlers
          if(record_selectors) {
            $(this).text("Turn off selector recording");
          }
          else {
            $(this).text("Turn on selector recording");
          }
        });

      /* -- Previous field .click handler -- */
      $(overlay_data.previous)
        .click(overlay_data, function (event) {
          console.log(event.data.getPreviousField("[skip='false'], .success"));
          if (removeSuccess(event.data.getPreviousField("[skip='false'], .success"))) {
            event.data.decrementIndex();
          }
        });

      /* -- Next field .click handler -- */
      $(overlay_data.next)
        .click(overlay_data, function (event) {
          console.log(event.data.getNextField());
          if (event.data.getNextField()) {
            fill_input_success(event.data.getCurrentField());
            event.data.incrementIndex()
          }
        });

      /* -- Fields and labels (click to copy) handlers -- */
      $(overlay_data.fields)
        .click(overlay_data, function (event) {
          removeSuccess(this);
          event.data.setIndex(this);
          provision_inputs_event_handlers();
        });
      $(overlay_data.labels)
        .click(overlay_data, function (event) {
          event.data.setIndex(this);
          provision_inputs_event_handlers();
        });

      /* Cost selection */
      $("#select-cost-btn").click(function () {
        highlight_prices_for_selection();
      });
      $("#cost-input").on('input', function () {
        var price_regex = /\d+\.\d\d/m;

        if (price_regex.test($(this).attr('value'))) {
          $("#fetch-gift-card-button").prop('disabled', false);
        }
      });

      /* Gift card */
      $("#gift-card-number").click(overlay_data, function (event) {
        $(this).removeClass('success');
        event.data.setIndex(this);
        //spans = $("#fulfillment-overlay span.order-info:not(.success)");
        //removeHighlight(spans);
        //highlight(this);
        //copyToClipboard(this);
      });

      $("#fetch-gift-card-button").click(function () {
        $.get("https://45.55.18.141/gift_card/" + order_data.domain_host + "/" + Math.ceil(parseFloat($("#cost-input").attr('value'))) + "00", function (body) {
          if (body.code) {
            console.log("code found");
            $("#gift-card-number").append(body.code).prop("skip", "false");
            $("#gift-card-pin").append(body.pin).prop("skip", "false");
          }
          else {
            console.log("code not found");
            $("#gift-card-number").append("No gift card found").prop("skip", "true");
          }
        }, "json");
      });

      /* source confirmation */
      $("#select-confirmation-btn").click(function () {
        highlight_source_confirmation_for_selection();
      });

      /* account email */
      $("#select-account-email").click(function(){
        highlight_account_email_for_selection();
      });

      /* finished */
      $("#finished-btn").click(function() {
        web_driver.logout()
          .then(function(){
            chrome.runtime.sendMessage({source_fulfillment_done: true, cost: $("#cost-input").val(), taxes: $("#taxes-input").val(), source_confirmation: $("#confirmation-number").val(), source_account_username: $("#account-email").val(), source_data: order_data});
          });
      });

      // Change the text of the button to indicate that everything is ready to go
      $(overlay_data.copyCombo).text("Start copy combo!");


      /** ----------- Keyboard shortcuts ----------- **/
      $(document).keydown(function(event) {
        if (!event.shiftKey && !event.ctrlKey) {
          if (event.altKey) {
            switch (event.keyCode) {

              // Alt+A: Attempt autofill
              case(65):
                $(overlay_data.autofill).click();
                break;

              // Alt+Q: Go back one field
              case(81):
                $(overlay_data.previous).click();
                break;

              // Alt+W: Skip one field
              case(87):
                $(overlay_data.next).click();
                break;

              // Alt+1: Reset all
              case(49):
                $(overlay_data.reset).click();
                break;

            }
          }
        }
      });
    }
  });
}


/** ----------- Main script ----------- **/
$(document).ready(function() {
  var field_to_page_type_map = {
    "firstname": "shipping",
    "lastname": "shipping",
    "address": "shipping",
    "city": "shipping",
    "state": "shipping",
    "postal_code": "shipping",
    "phone": "shipping",
    "quantity": "product"
  };

  var web_driver = getWebDriver(extractDomain(window.location.href));

  web_driver.ready(function() {
    console.log("is ready");
    chrome.runtime.sendMessage({get_order_and_login_data: true}, function (response) {
      set_fulfillment_timeout(response.order_data);

      if(web_driver.is_landing_page()) {
        window.location = response.order_data.item_source_link;
      }
      else if(response.success) {
        init_fulfillment(web_driver, response.order_data, response.login_data);
      }
      else {
        console.log("ERROR INITIATING FULFILLMENT: " + response.error_code);
      }
    });
  });
});


/**
 * Created by patricepaquette on 2016-03-08.
 */

/** constructor **/
function WalmartWebDriver(){
  this._dropdown_resolvers = [walmart_chooser_dropdown_resolver];
}
WalmartWebDriver.prototype = new BaseWebDriver('walmart');

/** helper function to have normalized states (required to check equality in dropdown values)**/
function get_normalized_us_state(input){
  var state_map = {"AL": "Alabama", "AK": "Alaska", "AS": "American Samoa", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District Of Columbia", "FM": "Federated States Of Micronesia", "FL": "Florida", "GA": "Georgia", "GU": "Guam", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MH": "Marshall Islands", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "MP": "Northern Mariana Islands", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PW": "Palau", "PA": "Pennsylvania", "PR": "Puerto Rico", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VI": "Virgin Islands", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"};

  if(input.length > 2){ return input.toLowerCase(); }
  if(input.length < 2){ return null; }

  return state_map[input.toUpperCase()].toLowerCase();
}


WalmartWebDriver.prototype.login = function(username, password){
  console.log(username);
  console.log(password);
  var settings = {
    type: "POST",
    url: "https://www.walmart.com/account/electrode/api/signin",
    data: JSON.stringify({
      username: username,
      password: password,
      captcha: {
        sensorData: ""
      }
    }),
    success: function(data, status, xhr) {
      console.log(data);
      console.log(status);
      console.log(xhr);
    },
    dataType: "json",
    contentType: "application/json"
  };

  return Q.promise(function(resolve, reject) {
    $.ajax(settings);
    resolve();
  });
};

WalmartWebDriver.prototype.logout = function(){
  return Q.promise(function(resolve, reject){
    $.get("https://www.walmart.com/account/logout", function(){
      resolve();
    });
  });
}

/** must override base method to add additional constraints for readiness **/
WalmartWebDriver.prototype.ready = function(callback){
  var that = this;

  function is_ready(){
    console.log("checking if ready");
    switch(that.page_type){
      case "shipping":
        var elements = $("section[data-view-name=shipping-address], section[data-view-name=payment]")
          .filter(function(index, element){
            return $(element).hasClass('expanded');
          });
        return elements.length > 0;
    }

    return true ;
  }


  BaseWebDriver.prototype.ready.call(this, function(){
    async.until(function(){
      return is_ready();
    }, function(done){
      setTimeout(function(){
        done();
      }, 1000)
    }, function(){
      console.log($("label[for=COAC2ShpAddrFirstName]").get(0));
      callback();
    });
  });
}

WalmartWebDriver.prototype.is_landing_page = function(){
  return /http:\/\/www\.walmart\.com\/\?/g.test(window.location.href);
}

/** override base method to parse input values **/
WalmartWebDriver.prototype.set_field_value = function(field, value){
  if(field === 'state'){
    value = get_normalized_us_state(value);
  }

  return BaseWebDriver.prototype.set_field_value.call(this, field, value);
}

WalmartWebDriver.prototype._is_dropdown = function(element){
  return $(element).hasClass('chooser') && $(element).hasClass('js-chooser');
}

WalmartWebDriver.prototype._dropdown_resolver = function(element, value){
  _.each(this._dropdown_resolvers, function(resolver){
    resolver(element, value);
  });
}

/**
 * custom dropdown resolvers
 * we allow more than one in case that there are different types within walmart
 */
function walmart_chooser_dropdown_resolver(element, value){
  $(element).find('button')
    .filter(function(){
      return value.toLowerCase() === $(this).text().toLowerCase();
    })
    .first()
    .trigger('click');
}
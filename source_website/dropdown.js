/**
 * Created by Pierre-Yves on 3/1/2016.
 */

var usStates = [
  { name: 'ALABAMA', abbreviation: 'AL' },
  { name: 'ALASKA', abbreviation: 'AK' },
  { name: 'AMERICAN SAMOA', abbreviation: 'AS' },
  { name: 'ARIZONA', abbreviation: 'AZ' },
  { name: 'ARKANSAS', abbreviation: 'AR' },
  { name: 'CALIFORNIA', abbreviation: 'CA' },
  { name: 'COLORADO', abbreviation: 'CO' },
  { name: 'CONNECTICUT', abbreviation: 'CT' },
  { name: 'DELAWARE', abbreviation: 'DE' },
  { name: 'DISTRICT OF COLUMBIA', abbreviation: 'DC' },
  { name: 'FEDERATED STATES OF MICRONESIA', abbreviation: 'FM' },
  { name: 'FLORIDA', abbreviation: 'FL' },
  { name: 'GEORGIA', abbreviation: 'GA' },
  { name: 'GUAM', abbreviation: 'GU' },
  { name: 'HAWAII', abbreviation: 'HI' },
  { name: 'IDAHO', abbreviation: 'ID' },
  { name: 'ILLINOIS', abbreviation: 'IL' },
  { name: 'INDIANA', abbreviation: 'IN' },
  { name: 'IOWA', abbreviation: 'IA' },
  { name: 'KANSAS', abbreviation: 'KS' },
  { name: 'KENTUCKY', abbreviation: 'KY' },
  { name: 'LOUISIANA', abbreviation: 'LA' },
  { name: 'MAINE', abbreviation: 'ME' },
  { name: 'MARSHALL ISLANDS', abbreviation: 'MH' },
  { name: 'MARYLAND', abbreviation: 'MD' },
  { name: 'MASSACHUSETTS', abbreviation: 'MA' },
  { name: 'MICHIGAN', abbreviation: 'MI' },
  { name: 'MINNESOTA', abbreviation: 'MN' },
  { name: 'MISSISSIPPI', abbreviation: 'MS' },
  { name: 'MISSOURI', abbreviation: 'MO' },
  { name: 'MONTANA', abbreviation: 'MT' },
  { name: 'NEBRASKA', abbreviation: 'NE' },
  { name: 'NEVADA', abbreviation: 'NV' },
  { name: 'NEW HAMPSHIRE', abbreviation: 'NH' },
  { name: 'NEW JERSEY', abbreviation: 'NJ' },
  { name: 'NEW MEXICO', abbreviation: 'NM' },
  { name: 'NEW YORK', abbreviation: 'NY' },
  { name: 'NORTH CAROLINA', abbreviation: 'NC' },
  { name: 'NORTH DAKOTA', abbreviation: 'ND' },
  { name: 'NORTHERN MARIANA ISLANDS', abbreviation: 'MP' },
  { name: 'OHIO', abbreviation: 'OH' },
  { name: 'OKLAHOMA', abbreviation: 'OK' },
  { name: 'OREGON', abbreviation: 'OR' },
  { name: 'PALAU', abbreviation: 'PW' },
  { name: 'PENNSYLVANIA', abbreviation: 'PA' },
  { name: 'PUERTO RICO', abbreviation: 'PR' },
  { name: 'RHODE ISLAND', abbreviation: 'RI' },
  { name: 'SOUTH CAROLINA', abbreviation: 'SC' },
  { name: 'SOUTH DAKOTA', abbreviation: 'SD' },
  { name: 'TENNESSEE', abbreviation: 'TN' },
  { name: 'TEXAS', abbreviation: 'TX' },
  { name: 'UTAH', abbreviation: 'UT' },
  { name: 'VERMONT', abbreviation: 'VT' },
  { name: 'VIRGIN ISLANDS', abbreviation: 'VI' },
  { name: 'VIRGINIA', abbreviation: 'VA' },
  { name: 'WASHINGTON', abbreviation: 'WA' },
  { name: 'WEST VIRGINIA', abbreviation: 'WV' },
  { name: 'WISCONSIN', abbreviation: 'WI' },
  { name: 'WYOMING', abbreviation: 'WY' }
];

// Returns the chosen state notation (full or 2 letter)
function getState(state, returnFull) {
  var equivalent;

  if(state.length > 2) {
    equivalent = _.find(usStates, function(object) {
      return object.name.indexOf(state.toUpperCase()) > -1;
    });

  } else if(state.length == 2) {
    equivalent = _.find(usStates, function(object) {
      return object.abbreviation == state.toUpperCase();
    });
  }

  if(returnFull) {
    return equivalent.name;
  } else {
    return equivalent.abbreviation;
  }
}

function setDropdownSelections(order_data) {
  if(order_data.domain_host == "walmart") {
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
  }
}

//// Add .click handler with payload to all dropdown menus (select)
//$("select")
//  .click(data, function(event) {
//
//  });
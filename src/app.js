
"use strict";

//Regular expression helper function to escape all special characters in a string
RegExp.escape = function(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	};

//address formatting helper function
function formatAddress (address) {
	var formattedAddress = "";
	for (var i=0; i < address.length; i++) {
		formattedAddress+=address[i];
		formattedAddress+="<br>";
	}
	return formattedAddress;
}


//Import saved Data and initiate map
var savedData;
var map;
var infowindow = null;
var isGoogleMapsLoaded = false;

//Loads saved JSON after google map loads
var reqListener = function () {
  savedData = JSON.parse(this.responseText);

  var myViewModel = new ViewModel(savedData);
  ko.applyBindings(myViewModel);

  myViewModel.displayedPlaces(savedData.savedPlaces);
  myViewModel.viewPlace.call(this, null, null, savedData.currentView);
};

//Initiates google map
function initMap () {
		isGoogleMapsLoaded = true;
		map = new google.maps.Map(document.getElementById('map'), {
		 		  center: {lat: -34.397, lng: 150.644},
		 		  zoom: 13,
		 		  zoomControl: true,
		 		  scaleControl: true
		 		});

		var oReq = new XMLHttpRequest();
		oReq.addEventListener("load", reqListener);
		oReq.open("GET", "savedData.json");
		oReq.send();
  } 

  //Produces alert if google maps fails to load
  function mapFail (event) {
  	var message = "";
  	if (event) {
  		message += event;
  	}
  	message += "Google maps has failed to load. Please check your connection and reload page to allow functionality.";
  	alert(message);
  }

//Geocodes an address, and then passes it to a callback function;
function geocodeAddress (address, callback) {
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({"address": address}, function(results, status) {
  	if (status == google.maps.GeocoderStatus.OK) {
  		var latlng = {};
  		latlng.lat = results[0].geometry.location.lat();
  		latlng.lng = results[0].geometry.location.lng();
  		callback(latlng);
  	}  else {
  		alert("Geocode was not successful for the following reason: " + status);
  	}
  });
}

//updates infoWindows
function updateInfoWindow(place, map, marker) {
	if (infowindow) {
		infowindow.close();
	}

	var contentString = "<div><h1>";

	if (place.url) {
		contentString += "<a href=" + place.url + ">" + place.name+ "</a>";
	} else {
		contentString += place.name;
	}

	contentString += "</h1>" + "<h2>" + formatAddress(place.location.formattedAddress) + "</h2>";
	
	if (place.tips.length > 0) {
		contentString += "<h3><q>" + place.tips[0].text + "</q></h3>";

	};
	infowindow = new google.maps.InfoWindow({
	    content: contentString
	  });
	infowindow.open(map, marker);
}


//Sets up ViewModel constructor
var ViewModel = function(savedData) {
	//saves this environment as self
	var self = this;

	//sets up observables
	self.savedPlaces = ko.observableArray();
	if (savedData.savedPlaces) {
		var iterLength = savedData.savedPlaces.length;
		for (var i=0; i<iterLength;i++) {
			self.savedPlaces.push(savedData.savedPlaces[i]);
		}
	}

	self.displayedPlaces = ko.observableArray();

	self.newItem = ko.observable();
	self.neighborhood = ko.observable(savedData.neighborhood);
	self.city = ko.observable(savedData.city);
	self.state = ko.observable(savedData.state);
	self.currentNeighborhood = ko.observable(savedData.currentNeighborhood);
	

	self.placeQuery = ko.observable();
	self.placeResults = ko.observableArray();
	self.selectedResults = ko.observableArray();

	self.selectedSavedPlaces = ko.observableArray();
	
	self.filterQuery = ko.observable();
	self.filteredSavedPlaces = ko.observableArray();


	self.currentView = ko.observable();

	//Computed formatted address
	self.formattedAddress = ko.computed(function() {
		if (self.currentView()) {
			var address = self.currentView().location.formattedAddress;
			return formatAddress(address);
		}
	});


	//Object to keep track of google marks, current map position
	self.markers = {};

	self.currentLatLng = {
		"lat": savedData.currentLatLng.lat,
		"lng": savedData.currentLatLng.lng
	}



	//Subscription Methods

	//Method to update google map with markers, to be subscribed to displayedPlaces observable
	self.updateMarkers = function (changes) {
		var iterLength = changes.length;
		for (var i=0; i<iterLength; i++) {
			var alteration = changes[i];
			var place = alteration.value;
			if (alteration.status === "added") {

				//logic for additions
				var position = alteration.value.location;
				var id = String(position.lat) + String(position.lng);

				//add marker
				var marker = new google.maps.Marker({
					position: position,
					map: map,
					animation: google.maps.Animation.DROP
				});
				self.markers[id] = marker;
				marker.addListener("click", function(place, map, marker) {
					return function(e) {
						console.log(place);
						self.viewPlace(null, null, place);
						updateInfoWindow(place, map, marker);
					};
				}(place, map, marker));
				map.setCenter(position);

			} else {
				//logic for deletions
				var position = alteration.value.location;
				var id = String(position.lat) + String(position.lng);
				var marker = self.markers[id];

				if (self.markers["selected"] && self.markers["selected"]["id"]===id) {
					self.markers["selected"].setMap(null);
				}

				marker.setMap(null);
				delete self.markers[id];

			}
		}
	}
	//Subscribes displayedPlaces Observable to updateMarkers method
	self.displayedPlaces.subscribe(self.updateMarkers, null, "arrayChange");



	//Method to update displayedPlaces based on changes to savedPlaces, to be subscribed
	self.updateDisplayedPlaces = function(changes) {

		var filterQuery = self.filterQuery();

			var iterLength = changes.length;

			for (var i=0; i<iterLength; i++) {
				var alteration = changes[i];
				var place = alteration.value;
				if (alteration.status === "added") {
					//logic for additions
					if (filterQuery === undefined || filterQuery === "") {
						self.displayedPlaces.push(place);
					} else {
						var regExpFilter = new RegExp(RegExp.escape(filterQuery)+" *", "i");

						var found = regExpFilter.test(place.name);
						if (found) {
							self.displayedPlaces.push(place);
						}
					}
					
				} else {
					//logic for deletions
					if (place === self.currentView()) {
						self.currentView(null);
					}
					if (filterQuery === undefined || filterQuery === "") {
						self.displayedPlaces.remove(place);
					} else {
						var alteration = changes[i];
						var displayedPlaces = self.displayedPlaces();
						if (displayedPlaces.indexOf(place) !== -1) {
							self.displayedPlaces.remove(place);
						}
					}
					
				}
			}
		};

	//Subscribes savedPlaces to update displayedPlaces per filter 
	self.savedPlaces.subscribe(self.updateDisplayedPlaces, null, "arrayChange");

	//Method to update displayedPlaces by iterating through savedPlaces when filterQuery changes
	self.updateFilter = function() {
		var filterQuery = self.filterQuery();

		if (filterQuery === undefined || filterQuery ==="") {
			self.displayedPlaces(self.savedPlaces());
		} else {
			self.displayedPlaces([]);
			var savedPlaces = self.savedPlaces();
			var iterLength = savedPlaces.length;
			var regExpFilter = new RegExp(RegExp.escape(filterQuery)+" *", "i");

			for (var i=0; i<iterLength; i++) {
				var place = savedPlaces[i]
				var found = regExpFilter.test(place.name);
				if (found) {
					self.displayedPlaces.push(place);
				}
			}
		}
	}
	//Subscribes updateFilter to changes in updateFilter;
	self.filterQuery.subscribe(self.updateFilter, null);

	

	//Viewmodel Methods

	//Performs an Ajax neighborhood search
	self.searchNeighborhood = function(number, query) {

		//function to process results from FourSquare Ajax search, also performs its own Ajax request to add tips
		var processResults = function(data) {

			var results = data.response.groups[0].items;

			var iterLength = results.length;

			for (var i=0; i < iterLength; i++) {

				var possiblePlace = results[i].venue;

				var length = self.savedPlaces().length;

				self.placeResults.push(possiblePlace);

				if (!possiblePlace.url) {
					possiblePlace.url = null;
				}

				//generates AjaxRequest to search FourSquare tips
				var createTipAjaxRequest = function (possiblePlace) {

					return function() {
						var tipRequest = {
							"url": "https://api.foursquare.com/v2/venues/" + possiblePlace.id + "/tips?client_id=EA3A3XF2VX0FDZNSQDTNIK2ZDDASGYOFMLWOE05NLPX1HGNE&client_secret=TSVLB1DZHDGURRYXWQKYHMUKNT1FQ4MFAGV11T2F2PSFCOVW&v=20160518&sort=popular&limit=3" ,
							"dataType": "json",  
							"success": function(data) {
								var tipArr = data.response.tips.items;
								if (tipArr && (tipArr).length > 0) {
									possiblePlace["tips"] = tipArr.slice(0,3);
								} else {
									possiblePlace["tips"] = null;
								}
							},
							"error": function() {
								possiblePlace["tips"] = null;
								if (!fourSquareFailAlerted) {
									alert("Neighborhood Explorer could not access Four Square Tips API. Please check your connection.");
									fourSquareFailAlerted = true;
								}
							}
							};
						$.get(tipRequest);
					};
				}

				//creates tipAjaxRequest with closure for the current iterated place 
				var tipAjaxRequest = createTipAjaxRequest(possiblePlace);

				//calls tipAjaxRequest already created with closure
				var fourSquareFailAlerted = false;
				tipAjaxRequest();
			}

		};

		//Logic for main FourSquare Request to get a list of places based on neighborhood
		var latlng = self.currentLatLng.lat + ", " + self.currentLatLng.lng;

		var client_id = "EA3A3XF2VX0FDZNSQDTNIK2ZDDASGYOFMLWOE05NLPX1HGNE";
		var client_secret = "TSVLB1DZHDGURRYXWQKYHMUKNT1FQ4MFAGV11T2F2PSFCOVW";
		var version = "20160518";
		var radius = 800;
		var limit = number;
		var url = "https://api.foursquare.com/v2/venues/explore?client_id=" + client_id + "&client_secret=" + client_secret + "&v=" + version + "&ll="+ latlng + "&radius=" + radius + "&limit=" + limit;

		//Chooses between a query search or a TopPicks general search (if no query parameter passed)
		if (query) {
			url = url + "&query=" + query;
		} else {
			url = url + "&section=topPicks";
		}
		
		//Ajax request to FourSquare for list of places
		var request = {
			"url": url,
			"dataType": "json",
			"success": processResults,
			"error": function (error) {
				console.log(error);
				if (error.responseText) {
					var errorMsg = JSON.parse(error.responseText).meta;
					alert("Error " + error.status + ": " + error.statusText + "\n" + errorMsg.errorDetail);
				} else {
					if (!fourSquareFailAlerted) {
						alert("Error: FourSquare was not responsive to data request. Please check your connection.");
						fourSquareFailAlerted = true;
					}
					
				}
			}
		};
		$.ajax(request);
	};

	//Method that changes the current neighborhood when Update button is pressed
	self.changeNeighborhood = function() {

		//Saves the neighborhood name to currentNeighborhood Observable
		var address = self.neighborhood() + ", " + self.city() + ", " + self.state();
		self.currentNeighborhood(address);


		//clears saved places and previous place results
		self.savedPlaces([]);
		self.placeResults([]);

		//Updates the map to focus on this neighborhood, then calls a search on it
		geocodeAddress(address, function(latlng) {
			self.currentLatLng = latlng;
			map.setCenter(self.currentLatLng);
			self.searchNeighborhood(100);
		});
	};

	//Removes place from either Results or SavedPlaces
	self.removePlaces = function() {
		var arr = self.selectedSavedPlaces();
		var iterLength = arr.length;

		for (var i = 0; i < iterLength; i++) {
			self.savedPlaces.remove(arr[i]);
		}
	};

	//Provides info in the DOM for the selected place
	self.viewPlace = function(_, target, specificPlace) {
		var place;

		//Determines if this is a viewModel place, or a DOM object. If a DOM object, then determines whether we are viewing a selected Result or a selected Saved Place
		if (specificPlace) {
			place = specificPlace;
		} else {
			if (target) {
				switch (target.currentTarget.classList[0]) {

					case "results": 
					place = self.selectedResults()[0];
					break;

					case "savedPlaces":
					place = self.selectedSavedPlaces()[0];
					break;
				}
			}
		}

		//remove any existing selected marker
		if (self.markers["selected"]) {
			self.markers["selected"].setMap(null);
			var id = self.markers["selected"]["id"];

			if (self.markers[id]) {
				self.markers[id].setMap(map);
			}

			self.markers["selected"] = null;
		}

		//add new selected marker
		var position = place.location;
		var id = String(position.lat) + String(position.lng);
		var marker = new google.maps.Marker({
				position: position,
				map: map,
				id: id,
				animation: google.maps.Animation.DROP
			});
		marker.setIcon('img/icon39.png');
		marker.setZIndex(9999);
		map.setCenter(position);
		self.markers["selected"] = marker;


		if (self.markers[id]) {
			self.markers[id].setMap(null);
		}

		//update info window
		updateInfoWindow(place, map, marker);

		//update current view
		self.currentView(place);

	};

	//Monitors changes to selectedPlaces, and calls ViewPlace on changes
	self.selectionChange = function(changes) {
		var iterLength = changes.length;
		for (var i=0; i<iterLength; i++) {
			var alteration = changes[i];
			var place = alteration.value;

			if (alteration.status === "added") {
				//logic for additions
				console.log(place);
				self.viewPlace(null, null, place);	
			}
		}
	};
	self.selectedResults.subscribe(self.selectionChange, null, "arrayChange");
	self.selectedSavedPlaces.subscribe(self.selectionChange, null, "arrayChange");



	//Method to call an Ajax neighborhood search with searchbox query
	self.searchPlace = function() {
		var query = self.placeQuery();
		
		self.placeResults([]);
		self.searchNeighborhood(100, query);
	};

	//moves a place from placeResults to savedPlaces
	self.addPlaces = function() {
		var results = self.selectedResults();
		var iterLength = results.length;

		//iterates through search results
		for (var i = 0; i < iterLength; i++) {

			var newPlace = results[i];
			var found = false;
			var places = self.savedPlaces();
			var placeLength = places.length;

			//checks for duplicates against place array
			for (var i = 0; i < placeLength; i++) {
				if (newPlace === places[i]) {
					found = true;
				}
			}

			//if not already present, adds place to savedPlaces, and removes from placeResults
			if (!found) {
				self.savedPlaces.push(newPlace);
				self.placeResults.remove(newPlace);
			}
		}
	};
};




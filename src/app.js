
RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

var ViewModel = function() {
	self = this;
	self.savedPlaces = ko.observableArray();
	self.displayedPlaces = ko.observableArray();

	self.newItem = ko.observable();
	self.neighborhood = ko.observable("Five Points");
	self.city = ko.observable("Denver");
	self.state = ko.observable("Colorado");
	self.currentNeighborhood = ko.observable("Neighborhood, City, State");
	self.currentLatLng = ko.observable();

	self.placeQuery = ko.observable();
	self.placeResults = ko.observableArray();
	self.selectedResults = ko.observableArray();

	self.selectedSavedPlaces = ko.observableArray();
	
	self.filterQuery = ko.observable();
	self.filteredSavedPlaces = ko.observableArray();


	self.currentView = ko.observable();

	self.formattedAddress = ko.computed(function() {
		if (self.currentView()) {
			var address = self.currentView().location.formattedAddress;
			var formattedAddress = "";
			for (var i=0; i < address.length; i++) {
				formattedAddress+=address[i];
				formattedAddress+="<br>";
			}
			return formattedAddress;
		}
	});


	//logic for google markers
	self.markers = {};
	self.currentId = 0;


	//Subscribe displayedPlaces to update google map with markers
	self.updateMarkers = function (changes) {
		var iterLength = changes.length;
		for (var i=0; i<iterLength; i++) {
			var alteration = changes[i];
			if (alteration.status === "added") {
				//logic for additions
				var position = alteration.value.location;
				var id = String(position.lat) + String(position.lng);
				var marker = new google.maps.Marker({
					position: position,
					map: map
				});
				self.markers[id] = marker;


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
	self.displayedPlaces.subscribe(self.updateMarkers, null, "arrayChange");

	//Subscribes savedPlaces to update displayedPlaces per filter 

	self.updateDisplayedPlaces = function(changes) {

		filterQuery = self.filterQuery();

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

						console.log(regExpFilter);


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
		} 
	self.savedPlaces.subscribe(self.updateDisplayedPlaces, null, "arrayChange");
	//subscription to update displayedPlaces by iterating through savedPlaces when filterQuery changes
	self.updateFilter = function(change) {
		var filterQuery = change;

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
				console.log ("filter:" + regExpFilter + "place: " + place.name +  "found?" + found);
				if (found) {
					self.displayedPlaces.push(place);
				}
			}
		}
	}
	self.filterQuery.subscribe(self.updateFilter, null);

	

	//Methods
	self.searchNeighborhood = function(number) {

		var processResults = function(data) {

			var results = data.response.groups[0].items;
			
			var iterLength = results.length;

			for (var i=0; i < iterLength; i++) {

				possiblePlace = results[i].venue;

				var length = self.savedPlaces().length;
				var found = false;

				self.placeResults.push(possiblePlace);
				}

			};

		var address = self.currentNeighborhood();

		var client_id = "EA3A3XF2VX0FDZNSQDTNIK2ZDDASGYOFMLWOE05NLPX1HGNE";
		var client_secret = "TSVLB1DZHDGURRYXWQKYHMUKNT1FQ4MFAGV11T2F2PSFCOVW";
		var version = "20160518";
		var section = "topPicks";
		var radius = 800;
		var limit = number;
		var url = "https://api.foursquare.com/v2/venues/explore?client_id=" + client_id + "&client_secret=" + client_secret + "&v=" + version + "&near="+ address + "&section=" + section + "&radius=" + radius + "&limit=" + limit;

		var request = {
			"url": url,
			"dataType": "json",
			"success": processResults
			};

		$.get(request);

		};




	self.changeNeighborhood = function() {

		//Saves the neighborhood name to currentNeighborhood Observable
		var address = self.neighborhood() + ", " + self.city() + ", " + self.state();
		self.currentNeighborhood(address);

		self.savedPlaces([]);
		//Calls a search on new neighborhood
		self.searchNeighborhood(100);

		//Updates the map to focus on this neigbhorhood
		var geocoder;
		var coords;
		var geocode = function () {
		    geocoder = new google.maps.Geocoder();
		    geocoder.geocode({"address": address}, function(results, status) {
		    	if (status == google.maps.GeocoderStatus.OK) {
		    		coords = results[0].geometry.location;
		    		self.currentLatLng(coords);

		    		map.setCenter(results[0].geometry.location);

		    		/*
		    		service = new google.maps.places.PlacesService(map);
		    		var request = {
		    			location: coords,
		    			radius: '800',
		    			type: 'cafe'
		    		};

		    		//Replaces google places to Place Array
		    		self.places([]);
		    		service.nearbySearch(request, function(data) {
		    			while (self.places().length < 6) {
		    				var length = self.places().length;
		    				var found = false;
		    				var requestLength = data.length;
		    				var randomPlace = data[Math.floor(Math.random()*requestLength)];

		    				for (var i=0; i<length; i++) {
		    					if (randomPlace === self.places()[i]) {
		    						found = true;
		    					}
		    				}

		    				if (!found) {
		    					self.places.push(randomPlace);
		    				}
		    			}
		    			});
*/

		    	}  else {
		    		alert("Geocode was not successful for the following reason: " + status);
		    	}
		    });
		};

		geocode();
	};

	self.removePlaces = function() {
		var arr = self.selectedSavedPlaces();
		iterLength = arr.length;

		for (var i = 0; i < iterLength; i++) {
			self.savedPlaces.remove(arr[i]);
		}
	};

	self.viewPlace = function(_, target) {
		var place;
		switch (target.currentTarget.id) {

			case "results": 
			place = self.selectedResults()[0];
			break;

			case "savedPlaces":
			place = self.selectedSavedPlaces()[0];
			break;
		}

		//remove any existing selected marker
		if (self.markers["selected"]) {
			self.markers["selected"].setMap(null);
			var id = self.markers["selected"]["id"];
			console.log(id);
			console.log(self.markers);

			if (self.markers[id]) {
				self.markers[id].setMap(map);
			}

			self.markers["selected"] = null;

		}

		//add new selected marker
		console.log(place);
		var position = place.location;
		var id = String(position.lat) + String(position.lng);
		var marker = new google.maps.Marker({
				position: position,
				map: map,
				id: id
			});
		marker.setIcon('img/icon39.png');
		marker.setZIndex(9999);
		map.setCenter(position);
		self.markers["selected"] = marker;


		if (self.markers[id]) {
			self.markers[id].setMap(null);
		}

		//update current view
		self.currentView(place);

	};

	self.searchPlace = function() {
		var query = self.placeQuery();

		var request = {
		   location: self.currentLatLng(),
		   radius: '1000',
		   query: query
		 };

		service = new google.maps.places.PlacesService(map);
		service.textSearch(request, function(data) {
			self.placeResults(data);
		});
	};

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

			if (!found) {
				self.savedPlaces.push(newPlace);
				self.placeResults.remove(newPlace);
			}
		}
	};

	self.filterSavedPlaces = function() {

	}
}

myViewModel = new ViewModel();

ko.applyBindings(myViewModel);


var map;
function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: -34.397, lng: 150.644},
          zoom: 13,
          zoomControl: true,
          scaleControl: true
        });
      }

var ViewModel = function() {
	self = this;
	self.places = ko.observableArray();
	self.newItem = ko.observable();
	self.neighborhood = ko.observable("Five Points");
	self.city = ko.observable("Denver");
	self.state = ko.observable("Colorado");
	self.currentNeighborhood = ko.observable("Neighborhood, City, State");
	self.currentLatLng = ko.observable();

	self.placeQuery = ko.observable();
	self.placeResults = ko.observableArray();
	self.selectedResults = ko.observableArray();

	self.selectedPlaces = ko.observableArray();

	//logic for google markers
	self.markers = {};
	self.currentId = 0;
	self.uniqueId = function() {
		return self.currentId++;
	}


	//Subscribe places to update google map with markers
	function updateMarkers(changes) {
		var length = changes.length;
		for (var i=0; i<length; i++) {
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
				marker.setMap(null);
				delete self.markers[id];

			}
		}
	}

	self.places.subscribe(updateMarkers, null, "arrayChange");

	//Methods
	self.searchNeighborhood = function(number) {

		var processResults = function(data) {

			var results = data.response.groups[0].items;
			console.log(results);
			
			var iterLength = results.length;

			for (var i=0; i < iterLength; i++) {

				possiblePlace = results[i].venue;

				var length = self.places().length;
				var found = false;

				console.log(possiblePlace);
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

		self.places([]);
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
		var arr = self.selectedPlaces();
		iterLength = arr.length;

		for (var i = 0; i < iterLength; i++) {
			self.places.remove(arr[i]);
		}
	};

	self.viewPlace = function() {
		console.log(self.selectedPlaces()[0]);
	}

	self.searchPlace = function() {
		var query = self.placeQuery();

		var request = {
		   location: self.currentLatLng(),
		   radius: '1000',
		   query: query
		 };

		 console.log(request);

		service = new google.maps.places.PlacesService(map);
		service.textSearch(request, function(data) {
			console.log(data);
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
			var places = self.places();
			var placeLength = places.length;

			//checks for duplicates against place array
			for (var i = 0; i < placeLength; i++) {
				if (newPlace === places[i]) {
					console.log("true!")
					found = true;
				}
			}

			if (!found) {
				self.places.push(newPlace);
				self.placeResults.remove(newPlace);
			}
		}
	};
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
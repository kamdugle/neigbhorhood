
var ViewModel = function() {
	self = this;
	self.places = ko.observableArray();
	self.newItem = ko.observable();
	self.neighborhood = ko.observable("Five Points");
	self.city = ko.observable("Denver");
	self.state = ko.observable("Colorado");
	self.currentNeighborhood = ko.observable("Neighborhood, City, State");

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
				var position = alteration.value.geometry.location;
				var id = String(position.lat()) + String(position.lng());
				var marker = new google.maps.Marker({
					position: position,
					map: map
				});
				self.markers[id] = marker;


			} else {
				//logic for deletions
				var position = alteration.value.geometry.location;
				var id = String(position.lat()) + String(position.lng());
				var marker = self.markers[id];
				console.log("ID:" + id + "Markers: " + self.markers);
				marker.setMap(null);
				delete self.markers[id];

			}
		}
	}

	self.places.subscribe(updateMarkers, null, "arrayChange");

	//Methods
	self.changeNeighborhood = function() {
		//puts together the address to represent the neighborhood
		var address = self.neighborhood() + ", " + self.city() + ", " + self.state()

		//Saves the neighborhood name to currentNeighborhood Observable
		self.currentNeighborhood(address);

		//Updates the map to focus on this neigbhorhood
		var geocoder;
		var coords;
		var geocode = function () {
		    geocoder = new google.maps.Geocoder();
		    geocoder.geocode({"address": address}, function(results, status) {
		    	if (status == google.maps.GeocoderStatus.OK) {
		    		coords = results[0].geometry.location;
		    		console.log(coords.lat() +", " + coords.lng());
		    		map.setCenter(results[0].geometry.location);

		    		//Performs a place search
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
		    				console.log(length);

		    				var found = false;

		    				var requestLength = data.length;
		    				var randomPlace = data[Math.floor(Math.random()*requestLength)];
		    				console.log(randomPlace);


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

		    	}  else {
		    		alert("Geocode was not successful for the following reason: " + status);
		    	}
		    });
		};

		geocode();

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
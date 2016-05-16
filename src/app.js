var ViewModel = function() {
	self = this;
	self.places = ko.observableArray(["New York", "Atlanta"]);
	self.newItem = ko.observable();
	self.neighborhood = ko.observable("Five Points");
	self.city = ko.observable("Denver");
	self.state = ko.observable("Colorado");
	self.currentNeighborhood = ko.observable("Neighborhood, City, State");


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
		    			radius: '2000'
		    		};
		    		service.nearbySearch(request, function(data) {console.log(data);});

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
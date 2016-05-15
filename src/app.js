var ViewModel = function() {
	self = this;
	self.places = ko.observableArray(["New York", "Atlanta"]);
	self.newItem = ko.observable();


	//Methods
	self.addPlace = function(text) {
		self.places.push(self.newItem());
	};
}

myViewModel = new ViewModel();

ko.applyBindings(myViewModel);


var map;
function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: -34.397, lng: 150.644},
          zoom: 8
        });
      }
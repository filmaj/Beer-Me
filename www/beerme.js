// Beer Me JS code.
var BeerMe = function() {
	// Stores current user coordinates.
	this.myCoords = {};
	// Stores beer markers.
	this.beerMarkers = [];
	/**
	 * init: grabs GPS location using PhoneGap API and initializes data requests
	 *   with our data sources.
	 */
	this.init = function() {
		this.updateLocation();
	};
	this.updateLocation = function() {
		var dis = this;
		var win = function(position) {
			// Store coords.
			dis.myCoords = position.coords;
			// Call for static google maps data.
			var url = "http://maps.google.com/maps/api/staticmap?center=" + dis.myCoords.latitude + "," + dis.myCoords.longitude + "&zoom=15&size=320x480&maptype=roadmap&key=ABQIAAAASWkdhwcFZHCle_XL8gNI0hQQPTIxowtQGbc0PVHZZ3XLXr5GBhRKV3t_-63J9ZAJ2bYu3zsQdR9N-A&sensor=true"
			x$('#map').attr('src',url);
			x$('#loadingScreen').setStyle('display','none');
			// Call for beer data.
			dis.beerUpdate(dis.myCoords.latitude,dis.myCoords.longitude);
		};
		var fail = function(e) {
			alert('Can\'t retrieve position.\nError: ' + e.message);
		};
		navigator.geolocation.getCurrentPosition(win, fail);
	};
	this.getBeerFromBeerMapping = function(lat,lng) {
		// TODO: implement variable radius specification based on user's current view setting.
		var url = "http://beermapping.com/webservice/locgeo/33aac0960ce1fd70bd6e07191af96bd5/" + lat + "," + lng + ",50";
	};
	this.getBeerFromYQL = function(lat,lng) {
		// TODO: implement variable radius specification based on user's current view setting.
		var config = {'debug' : true};
		var format = '{Title}';
		var yqlQuery = "select * from local.search where radius=50 and latitude=" + lat + " and longitude=" + lng + " and query='beer'";
		var insertEl = 'resultsContainer';
		yqlWidget.push(yqlQuery, config, format, insertEl);
		yqlWidget.render(this.parseBeers);
	};
	this.beerUpdate = function(lat,lng) {
		this.beerMarkers = [];
		this.getBeerFromYQL(lat,lng);
		this.getBeerFromBeerMapping(lat,lng);
	};
	this.parseBeers = function(results) {
		for (var i = 0; i < results.length; i++) {
			var title = results[i].Title;
		}
	};
}

// Geolocation code shamelessly stolen from Movable Type scripts: http://www.movable-type.co.uk/scripts/latlong.html
function LatLon(lat, lon) {
	this.lat = lat;
	this.lon = lon;
}
LatLon.distCosineLaw = function(lat1, lon1, lat2, lon2) {
	var R = 6371; // earth's mean radius in km
	var d = Math.acos(Math.sin(lat1.toRad())*Math.sin(lat2.toRad()) +
		Math.cos(lat1.toRad())*Math.cos(lat2.toRad())*Math.cos((lon2-lon1).toRad())) * R;
	return d;
};
Number.prototype.toRad = function() {  // convert degrees to radians
	return this * Math.PI / 180;
};
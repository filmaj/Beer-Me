/* Utility functions, prototype extensions (yeah I extend native prototypes. deal with it) */
Number.prototype.toRad = function() {  // convert degrees to radians
	return this * Math.PI / 180;
};
function Zoom(app) {
     this.beer = app; //reference to application
     this.level = 15; //default zoom level for static map
     this.min = 11; //minimum zoom level
     this.max = 19; //maximum zoom level
     this.controlStep = 30; //pixel step for moving the control around
     this.controlPosition = 155; //default 'top' style property for the control
     this.control = x$('#control');
     this.control.setStyle('top',this.controlPosition.toString() + 'px');
};
Zoom.prototype = {
    into:function() {
        if (this.level == this.max) return false;
        this.level++;
        this.controlPosition -= this.controlStep;
        this.control.setStyle('top',this.controlPosition.toString() + 'px');
        this.beer.updateLocation();
    },
    out:function() {
        if (this.level == this.min) return false;
        this.level--;
        this.controlPosition += this.controlStep;
        this.control.setStyle('top',this.controlPosition.toString() + 'px');
        this.beer.updateLocation();
    }
}
function BeerMe() {
	console.log('test');
	this.myCoords = {};
	this.beerMarkers = [];
	this.detail = x$('#detailScreen');
	this.loading = x$('#backdrop');
	this.map = x$('#body');
	this.marker = {
		width:45,
		height:60
	};
    this.zoom = new Zoom(this);
	/**
	 * Initializes controls (attaches events, positions DOM nodes) and then starts a location update.
	 */	
	var self = this;
    // TODO: hook in zoom buttons.
	x$('#plus').click(this.zoom.into);
	x$('#minus').click(this.zoom.out);
	x$('#closeBtn').click(function() {
		self.detail.setStyle('display','none');
	});
	x$('#refresh').click(function() {
		self.updateLocation();
	});
	x$('#about').click(function() {
		self.showAbout();
	});
	this.updateLocation();
};
BeerMe.prototype = {
    clear:function() {
        for (var i = 0; i < this.beerMarkers.length; i++) {
            this.beerMarkers[i].node.remove();
        }
        this.beerMarkers = [];
        this.detail.setStyle('display','none');
    },
    /**
     * Renders beer icons representing fountains of beer on the map, based on data pulled in from services.
     * @param {Object} results An array of results containing place information.
     */
    // TODO: refactor this and the yql widget rendering into one function.
    // TODO: also brittle with respect to working on various resolutions. Made for 320x480 right now.
    parseBeers:function(results) {
        // Extracts a value out of an XML document.
        var extractValue = function(node, childName) {
            try {
                return node.getElementsByTagName(childName)[0].childNodes[0].nodeValue;
            } catch(e) {
                return '';
            }
        },
        // Returns a beer click handler, given a bar info object. Used when we loop over bars.
        makeOnClick = function(info) {
            return function(){
                x$('#detailTitle').html(info.title + "");
                x$('#detailAddress').html(info.address);
                x$('#detailPhone').html('Tel.: <a href="tel:' + info.phone + '">' + info.phone + '</a>');
                var urlNode = x$('#detailUrl');
                if (info.url && info.url.length > 0) {
                    urlNode.html('<a href="' + info.url + '">BeerMapping.com Reviews</a>')
                    urlNode.setStyle('display','block');
                } else {
                    urlNode.setStyle('display','none');
                }
                x$('#detailScreen').setStyle('display', '');
            };
        },
        total = results.length;
        for (var i = 0; i < total; i++) {
            // First grab lat/lng and see whether the marker will display on screen. If not, skip it.
            var lat = extractValue(results[i], 'lat');
            var lng = extractValue(results[i], 'lng');
			alert('before');
            var rel = LLToXY(lng, lat, this.myCoords.longitude, this.myCoords.latitude, this.zoom.level);
			alert('after');
			console.log('test');
            var objX = 160 + rel.x;
            var objY = 240 + rel.y;
            // This sucks cuz it won't work on different screens. help?
            if (objX < 1 || objX > 320-this.marker.width || objY < 1 || objY > 480-this.marker.height) continue;
            // Extract data about the place from XML.
            var link = extractValue(results[i], 'reviewlink');
            var title = extractValue(results[i], 'name');
            var address = extractValue(results[i], 'street') + ", " + extractValue(results[i], 'city') + ", " + extractValue(results[i], 'state') + ", " + extractValue(results[i], 'country');
            var phone = extractValue(results[i], 'phone');
            var rating = extractValue(results[i], 'overall');
            // Create marker and inject into document.
            var img = x$('<img/>');
            img.addClass('beer');
            var info ={
                'title':title,
                'address':address,
                'phone':phone,
                'url':link
            }
            img.setStyle('left', objX.toString() + 'px');
            img.setStyle('top', objY.toString() + 'px');
            img.on('click', makeOnClick(info));
            this.beerMarkers.push({
                'info': info,
                'node': img
            });
            this.map.bottom(img);
        }
    },
    /**
     * Uses W3C geolocation API to retrieve GPS position, then makes a data request to BeerMapping & YQL for beereries (sweet new word I just made up).  
     */
    updateLocation:function() {
        this.showLoading();
        this.clear(); // remove old markers
        var dis = this;
        var win = function(position) {
            console.log('Retrieved GPS coords.');
            // Store coords.
            dis.myCoords = position.coords;
            // Call for static google maps data.
            var url = "http://maps.google.com/maps/api/staticmap?center=" + dis.myCoords.latitude + "," + dis.myCoords.longitude + "&zoom="+dis.zoom.level+"&size=320x480&maptype=roadmap&key=ABQIAAAASWkdhwcFZHCle_XL8gNI0hQQPTIxowtQGbc0PVHZZ3XLXr5GBhRKV3t_-63J9ZAJ2bYu3zsQdR9N-A&sensor=true"
            x$('#map').attr('src',url);
            // Call for beer data.
            dis.beerUpdate(dis.myCoords.latitude,dis.myCoords.longitude);
        };
        var fail = function(e) {
            alert('Can\'t retrieve position.\nError: ' + e);
        };
        navigator.geolocation.getCurrentPosition(win, fail);
    },
    /**
     * Returns the radius of beer establishments that should be queried for based on current zoom level.
     */
    getCurrentRadius:function() {
        return (20 - this.zoom.level) * 2; // will return a value between 2 and 18 depending on how zoomed in you are.
    },
    getBeerFromBeerMapping:function(lat,lng) {
        var dis = this;
		console.log('here');
        var url = "http://beermapping.com/webservice/locgeo/33aac0960ce1fd70bd6e07191af96bd5/" + lat + "," + lng + "," + this.getCurrentRadius();
        x$('#results').xhr(url, {
            async:true,
            callback:function(incoming) {
                alert("incoming");
                var xml = incoming?incoming.responseXML:this.responseXML;
				alert(xml);
                if (xml) {
					console.log("test")
                    if (xml.childNodes[0]) {
                        var results =  xml.childNodes[0].childNodes;
                        //alert('beermapping results: ' + results.length);
                        dis.parseBeers(results);
                    }
                }
                dis.hideLoading();
            }
        });
    },
    getBeerFromYQL:function(lat,lng) {
        var config = {'debug' : true};
        var format = '.';
        var yqlQuery = "select * from local.search where radius=" + this.getCurrentRadius() + " and latitude=" + lat + " and longitude=" + lng + " and query='beer'";
        var insertEl = 'resultsContainer';
        yqlWidget.push(yqlQuery, config, format, insertEl);
        yqlWidget.render();
    },
    beerUpdate:function(lat,lng) {
        this.beerMarkers = [];
        //this.getBeerFromYQL(lat,lng);
        this.getBeerFromBeerMapping(lat,lng);
    },
    showAbout:function() {
        x$('#details').setStyle('display','none');
        x$('#aboutText').setStyle('display','');
        var hideAbout = function() {
            x$('#details').setStyle('display','');
            x$('#aboutText').setStyle('display','none');
            document.getElementById('closeBtn').removeEventListener('click',hideAbout,false);
        };
        document.getElementById('closeBtn').addEventListener('click',hideAbout,false);
        this.detail.setStyle('display','');
    },
    showLoading:function() {
        this.loading.setStyle('display','');
    },
    hideLoading:function() {
        this.loading.setStyle('display','none');
    },
    // Geolocation code shamelessly stolen from Movable Type scripts: http://www.movable-type.co.uk/scripts/latlong.html
    distCosineLaw:function(lat1, lon1, lat2, lon2) {
        var R = 6371; // earth's mean radius in km
        var d = Math.acos(Math.sin(lat1.toRad())*Math.sin(lat2.toRad()) +
            Math.cos(lat1.toRad())*Math.cos(lat2.toRad())*Math.cos((lon2-lon1).toRad())) * R;
        return d;
    }
};
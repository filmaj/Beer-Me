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
     this.gauge = x$('#gauge');
};
Zoom.prototype = {
    into:function() {
        return this.zoom(true);
    },
    out:function() {
        return this.zoom(false);
    },
    zoom:function(into) {
        var self = this;
        return function(evt) {
            if (self.level == (into?self.max:self.min)) {
                console.log('Zoom level is ' + self.level + ', no zoom allowed.');
                return false;
            }
            self.level = (into?self.level+1:self.level-1);
            console.log('Zoom level is now ' + self.level);
            self.controlPosition = (into?(self.controlPosition - self.controlStep):(self.controlPosition + self.controlStep));
            console.log('Control position is at ' + self.controlPosition);
            self.control.setStyle('top',self.controlPosition.toString() + 'px');
            self.beer.updateLocation();
        }
    }
}
function BeerMe() {
	this.myCoords = {};
	this.beerMarkers = [];
	this.detail = {
	    container:x$('#detailScreen'),
	    details:x$('#details'),
	    about:x$('#aboutText'),
	    title:x$('#detailTitle'),
        address:x$('#detailAddress'),
        phone:x$('#detailPhone'),
        url:x$('#detailUrl'),
        close:x$('#closeBtn')
	};
	this.loading = {
	    backdrop:x$('#backdrop'),
	    element:x$('#loadingScreen'),
	    width:140,
	    height:140
	};
	this.map = x$('#body');
	this.me = {
	    element:x$('#me'),
	    width:58,
	    height:50
	};
	this.marker = {
		width:45,
		height:60
	};
    this.zoom = new Zoom(this);
	/**
	 * Initializes controls (attaches events, positions DOM nodes) and then starts a location update.
	 */	
	var self = this;
	x$('#plus').click(this.zoom.into());
	x$('#minus').click(this.zoom.out());
	this.detail.close.click(function() {
		self.detail.container.setStyle('display','none');
	});
	x$('#refresh').click(function() {
		self.updateLocation();
	});
	x$('#about').click(function() {
		self.showAbout();
	});
	// Orientation event detection and attaching for updating location and getting fresh map.
	// Thank you StackOverflow: http://stackoverflow.com/questions/1649086/detect-rotation-of-android-phone-in-the-browser-with-javascript
	var supportsOrientationChange = "onorientationchange" in window,
        orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
    x$(window).on(orientationEvent, function() {
        self.updateLocation();
    });
	this.updateLocation();
	
};
BeerMe.prototype = {
    // Cleanup function.
    clear:function() {
        while (this.beerMarkers.length) {
            var beer = this.beerMarkers.pop().node[0];
            beer.parentNode.removeChild(beer);
        }
        this.detail.container.setStyle('display','none');
    },
    /**
     * Renders beer icons representing fountains of beer on the map, based on data pulled in from services.
     * @param {Object} results An array of results containing place information.
     */
    // TODO: refactor this and the yql widget rendering into one function.
    parseBeers:function(results) {
        // Extracts a value out of an XML document.
        var self = this,
        extractValue = function(node, childName) {
            try {
                return node.getElementsByTagName(childName)[0].childNodes[0].nodeValue;
            } catch(e) {
                return '';
            }
        },
        // Returns a beer click handler, given a bar info object. Used when we loop over bars.
        makeOnClick = function(info) {
            return function(){
                self.detail.title.html(info.title + "");
                self.detail.address.html(info.address);
                self.detail.phone.html('Tel.: <a href="tel:' + info.phone + '">' + info.phone + '</a>');
                var urlNode = self.detail.url;
                if (info.url && info.url.length > 0) {
                    urlNode.html('<a href="' + info.url + '">BeerMapping.com Reviews</a>')
                    urlNode.setStyle('display','block');
                } else {
                    urlNode.setStyle('display','none');
                }
                self.detail.container.setStyle('display', 'block');
            };
        },
        total = results.length;
        for (var i = 0; i < total; i++) {
            // First grab lat/lng and convert to pixel coords.
            var lat = extractValue(results[i], 'lat');
            var lng = extractValue(results[i], 'lng');
            var rel = LLToXY(lng, lat, this.myCoords.longitude, this.myCoords.latitude, this.zoom.level);
            var objX = (screen.width/2) + rel.x;
            var objY = (screen.height/2) + rel.y;
            
            // Check whether the beer is off-screen.
            if (objX < 1 || objX > (screen.width-(this.marker.width/2)) || objY < 1 || objY > (screen.height-this.marker.height)) {
                console.log('Skipping a beer, off screen ('+objX+','+objY+')');
                continue;
            }
            
            // Adjust marker coords by proper marker offsets (half width, full height)
            objX -= this.marker.width/2;
            objY -= this.marker.height;
            
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
            console.log('Rendering beer at ('+objX+','+objY+')');
            img.on('click', makeOnClick(info));
            this.beerMarkers.push({
                'info': info,
                'node': img
            });
            this.map.top(img);
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
            console.log('Retrieved GPS coords ('+position.coords.latitude+','+position.coords.longitude+')');
            
            // Store coords.
            dis.myCoords = position.coords;
            
            // Call for static google maps data.
            var url = "http://maps.google.com/maps/api/staticmap?center=" + dis.myCoords.latitude + "," + dis.myCoords.longitude + "&zoom="+dis.zoom.level+"&size="+screen.width+"x"+screen.height+"&maptype=roadmap&key=ABQIAAAASWkdhwcFZHCle_XL8gNI0hQQPTIxowtQGbc0PVHZZ3XLXr5GBhRKV3t_-63J9ZAJ2bYu3zsQdR9N-A&sensor=true"
            x$('#map').attr('src',url);
            
            // If orientation is landscape, hide the zoom bar.
            if (screen.width > screen.height) dis.zoom.gauge.setStyle('display','none');
            else dis.zoom.gauge.setStyle('display','block');
            
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
        var url = "http://beermapping.com/webservice/locgeo/33aac0960ce1fd70bd6e07191af96bd5/" + lat + "," + lng + "," + this.getCurrentRadius();
        x$('#results').xhr(url, {
            async:true,
            callback:function(incoming) {
                var xml = incoming?incoming.responseXML:this.responseXML;
                if (xml) {
                    if (xml.childNodes[0]) {
                        var results =  xml.childNodes[0].childNodes;
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
        // TODO: enable YQL parsing.
        //this.getBeerFromYQL(lat,lng);
        this.getBeerFromBeerMapping(lat,lng);
    },
    showAbout:function() {
        this.detail.details.setStyle('display','none');
        this.detail.about.setStyle('display','block');
        var self = this;
        var hideAbout = function() {
            self.detail.details.setStyle('display','block');
            self.detail.about.setStyle('display','none');
            self.detail.close.un('click',hideAbout);
        };
        this.detail.close.on('click',hideAbout);
        this.detail.container.setStyle('display','block');
    },
    showLoading:function() {
        this.loading.backdrop.setStyle('display','');
    },
    hideLoading:function() {
        this.loading.backdrop.setStyle('display','none');
    }
};
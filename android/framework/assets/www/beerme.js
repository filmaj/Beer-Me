// Beer Me JS code.
    var BeerMe = {
 		// Create our droid and beer marker icon
    	droidIcon:new GIcon(G_DEFAULT_ICON),
    	droidMarkerOptions:null,
    	beerIcon:new GIcon(G_DEFAULT_ICON),
    	beerMarkerOptions:null,
    	myMarkerInfo:document.createElement("div"),
    	myMarker:null,
    	beerMarkers:[],
    	map:null,
    	geocoder:null,
    	disableRefresh:function() {
            var btn = document.getElementById('refreshBtn');
            btn.disabled = true;
            btn.innerHTML = 'Refreshing...';
        },
        enableRefresh:function() {
        	var btn = document.getElementById('refreshBtn');
            btn.disabled = false;
            btn.innerHTML = 'Refresh location';
        },
        updateLocation:function() {
            BeerMe.map.clearOverlays();
            BeerMe.disableRefresh();
        	var suc = function(p) {
          		var point = new GLatLng(p.coords.latitude, p.coords.longitude);
          		// Draw my position.
          		BeerMe.myMarker.setLatLng(point);
          		BeerMe.map.addOverlay(BeerMe.myMarker);
          		// Set map center.
          		BeerMe.map.setCenter(point, 12);
          		// Call for YQL data.
          		BeerMe.beerUpdate(p.coords.latitude, p.coords.longitude);
          		BeerMe.enableRefresh();
    		};
    		var die = function() {
    			document.getElementById('refreshBtn').innerHTML = 'GPS is unavailable';
      			alert('GPS Failure! Please enable GPS to be able to use Beer Me.');
    		};
      		//navigator.geolocation.getCurrentPosition(suc,die);
      		var p = {coords:{latitude:49.3,longitude:-123.4}};
      		suc(p);
        },
        getBeerFromBeerMapping:function(lat,lng) {
        	function createBMBeerMarker(node) {
    			var beerMarker = new GMarker(new GLatLng(0,0), BeerMe.beerMarkerOptions);
    		    GEvent.addListener(beerMarker, "click", function() {
    		    	var myHtml = "<b>" + node.Title + "</b><br/>";
    		    	myHtml += node.Street + "<br/>";
    		    	myHtml += node.City + ", " + node.State + "<br/>";
    		    	if (node.Phone.length > 0) {
    		    		myHtml += "Phone: " + node.Phone + "<br/>";
    		    	}
    		    	if (node.URL.length > 0) {
    		    		myHtml += '<a href="' + node.URL + '" target="_blank">Link to BeerMapping Reviews</a>';
    		    	}
    		    	beerMarker.openInfoWindowHtml(myHtml);
    		    });
    		    return beerMarker;
    		};
            var cb_GeoCoderReverse = function(response) {
            	// Calback for retrieving geographic information about current location.
                // TODO: Handle status code 602: Unknown area.
            	if (!response || response.Status.code != 200) {
            		alert("Error retrieving data from BeerMapping.com, status code:" + response.Status.code);
            	} else {
                	// If we get data back about our location, make a call to BeerMapping.
                	if (response.Placemark.length > 0) {
	              		var place = response.Placemark[0];
	              		var state = "";
	              		try {
	              			//var city = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.SubAdministrativeAreaName;
	              			state = place.AddressDetails.Country.AdministrativeArea.AdministrativeAreaName;
	              		} catch(e) {
		              		alert('Could not properly geocode your location and thus determine what state/province you are in, so only showing results from YQL.'); 
				            console.log("Can't retrieve geocoded state/province from Google service. Exception: " + e.toString());
	              		}
	              		if (state.length > 0) {
		              		var url = "http://beermapping.com/webservice/locstate/33aac0960ce1fd70bd6e07191af96bd5/" + state;
		              		var BeerXHR = new XMLHttpRequest();
		              		// And this is the BeerMapping callback.
		                	var cb_BeerMapping = function() {
		                    	if (BeerXHR.readyState == 4 && BeerXHR.status == 200) {
		                        	// Grab response and parse!
		                        	var response = BeerXHR.responseXML.documentElement;
		                        	var locations = response.getElementsByTagName('location');
		                        	for (var i = 0; i < locations.length; i++) {
		                            	try {
		                                	var name = locations[i].getElementsByTagName('name')[0].childNodes[0].nodeValue;
		                            		var city = locations[i].getElementsByTagName('city')[0].childNodes[0].nodeValue;
		                            		var street = locations[i].getElementsByTagName('street')[0].childNodes[0].nodeValue;
		                            		var state = locations[i].getElementsByTagName('state')[0].childNodes[0].nodeValue;
		                            		var phone = locations[i].getElementsByTagName('phone');
		                            		if (phone.length > 0) { phone = phone[0].childNodes[0].nodeValue; } else { phone = ""; }
		                            		var URL = locations[i].getElementsByTagName('reviewlink');
		                            		if (URL.length > 0) { URL = URL[0].childNodes[0].nodeValue; } else { URL = ""; }
		                            		if (city != null && street != null && state != null) {
		                                		// Callback for getting lat/lng coords of BeerMapping locations.
		                                		var node = {
		                                        		"Title":name,
		                                        		"Phone":phone,
		                                        		"URL":URL,
		                                        		"Street":street,
		                                        		"City":city,
		                                        		"State":state
		                                        };
		                                		var thisMarker = createBMBeerMarker(node);
		                                		console.log("Created BM marker '" + name + "' @ " + street);
		                                		var cb_GeoCoder = function(resp) {
		                                    		if (!resp || resp.Status.code != 200) {
		                                        		console.log('Geocoding response invalid.');
		                                    		} else {
		                                        		// Grab coord info and address info (since we used address as marker key).
		                                        		var beerKey = resp.name;
		                                    			var bar = resp.Placemark[0];
		                                    			var barLng = bar.Point.coordinates[0];
		                                    			var barLat = bar.Point.coordinates[1];
		                                    			console.log('Setting BM marker at ' + barLat + ', ' + barLng);
		                                    			var currentMarker = BeerMe.beerMarkers[beerKey];
		                                    			currentMarker.setLatLng(new GLatLng(barLat,barLng));
		                                    			BeerMe.map.addOverlay(currentMarker);
		                                    		}
		                                		}
		                                		// Create address string and use this as key into beer array.
		                                		var addressString = street + ", " + city + ", " + state;
		                                		BeerMe.beerMarkers[addressString] = thisMarker;
		                                		BeerMe.geocoder.getLocations(addressString, cb_GeoCoder);
		                            		}
		                            	} catch (e) {
		                                	console.log('Error while processing BeerMapping locations, exception: ' + e.toString());
		                                	continue;
		                            	}
		                        	}
		                    	}	
		                	}
		              		BeerXHR.onreadystatechange = cb_BeerMapping;
		              		BeerXHR.open("GET", url, true);
		              		BeerXHR.send(null);
	              		}
                	} else {
                    	alert('Could not properly geocode your location, so only showing results from YQL.');
                	}
            	}
            };
        	// Get city name of current place.
        	BeerMe.geocoder.getLocations(new GLatLng(lat,lng),cb_GeoCoderReverse);
        },
        getBeerFromYQL:function(lat,lng) {
        	// Get data from YQL.
        	var config = {'debug' : true};
        	var format = '{Title}';
        	var yqlQuery = "select * from local.search where radius=35 and latitude=" + lat + " and longitude=" + lng + " and query='beer'";
        	var insertEl = 'widgetContainer';
        	yqlWidget.push(yqlQuery, config, format, insertEl, BeerMe.map);
        	yqlWidget.render();
        },
        beerUpdate:function(lat,lng) {
            BeerMe.beerMarkers = [];
        	BeerMe.getBeerFromYQL(lat,lng);
        	BeerMe.getBeerFromBeerMapping(lat,lng);
        }
    };
    BeerMe.droidIcon.image = "images/androidmarker.png";
    BeerMe.droidIcon.iconSize = new GSize(50,58);
    BeerMe.droidMarkerOptions = { icon:BeerMe.droidIcon };
    BeerMe.beerIcon.image = "images/beericon.png";
    BeerMe.beerIcon.iconSize = new GSize(40,45);
    BeerMe.beerMarkerOptions = { icon:BeerMe.beerIcon };
	BeerMe.myMarkerInfo.innerHTML = 'Your position';
	BeerMe.myMarker = new GMarker(new GLatLng(0,0), BeerMe.droidMarkerOptions);
    GEvent.addListener(BeerMe.myMarker, "click", function() {
    	var myHtml = "<b>Your position</b>";
    	BeerMe.myMarker.openInfoWindowHtml(myHtml);
    });
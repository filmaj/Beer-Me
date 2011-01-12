function BeerMe(g) {
    var self = this;
    
    // members
    this.position = {};
    this.radius = 20;
    this.map = null;
    
    /* data adapters.
    *  each object in the data array must have a `get` function that will parse a data source
    *  and call `self.addMarker(obj)` to add markers for beer. marker template:
        {
            name:'',
            lat:0,
            lng:0,
            address:'',
            phone:''
        }
    */
    this.data = [
        'beermapping':{
            get:function(lat, lng, radius) {
                var url = "http://localhost:8088/webservice/locgeo/33aac0960ce1fd70bd6e07191af96bd5/" + lat + "," + lng + "," + radius;
                x$(window).xhr(url, {
                    async:true,
                    callback:function(incoming) {
                        var xml = incoming?incoming.responseXML:this.responseXML,
                            get = function(x, n) {
                                return x.find(n)[0].textContent;
                        };
                        if (xml) {
                            var locs = x$(xml).find('location');
                            locs.each(function(loc) {
                                loc = x$(loc);
                                self.addMarker({
                                    name:get(loc, 'name'),
                                    lat:get(loc, 'lat'),
                                    lng:get(loc, 'lng'),
                                    address:get(loc, 'street') + ', ' + get(loc, 'city') + ', ' + get(loc, 'state') + ', ' + get(loc, 'zip') + ', ' + get(loc, 'country'),
                                    phone:get(loc, 'phone')
                                })
                            })
                        } else {
                            navigation.notification.alert('Error','Cannot retrieve data from beermapping.com.');
                        }
                    }
                });
            }
        }
    ];
    
    // refresh location and render map.
    this.refresh(function() {
        // size map 
        x$('#map').css({
            height:screen.availHeight + 'px',
            width:screen.availWidth + 'px'
        });
        
        // draw map
        var p = new g.maps.LatLng(this.position.coords.latitude, this.position.coords.longitude),
            myOptions = {
            zoom: 10,
            center: p,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl:false,
            streetViewControl:false
        };
        this.map = new g.maps.Map(x$('#map')[0], myOptions);
        for (var d in this.data) {

            this.data[d].get(this.position.coords.latitude, this.position.coords.longitude, this.radius)
        }
    });
}
BeerMe.prototype = {
    refresh:function(callback) {
        var self = this,
            options = {
            enableHighAccuracy:true,
            maximumAge:0
        },  win = function(p) {
            self.position = p;
            callback.call(self);
        },  fail = function() {
            navigator.notification.alert('Error','Cannot retrieve position');
        };
        navigator.geolocation.getCurrentPosition(win, fail, options);
    },
    addMarker:function(item) {
        // first check if it is worth showing item in the current window.
        console.log(item);
    }
}
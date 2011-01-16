function BeerMe(g) {
    var self = this;
    
    // members
    this.position = {};
    this.radius = 20;
    this.map = null;
    this.markers = [];
    
    // elements
    this.blackout = x$('#blackout');
    this.loading = {
        el:x$('#loading'),
        msg:x$('#loading h1'),
        p:x$('#loading p')
    }
    
    /* data adapters.
    *  each member in the data object must have a `get` function that will parse a data source
    *  and call `self.addMarker(obj)` to add markers for beer. marker template:
        {
            name:'',
            lat:0,
            lng:0,
            address:'',
            phone:''
        }
    */
    this.data = {
        'beermapping':{
            get:function(lat, lng, radius) {
                var url = "http://www.beermapping.com/webservice/locgeo/33aac0960ce1fd70bd6e07191af96bd5/" + lat + "," + lng + "," + radius;
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
                                });
                            })
                        } else {
                            navigator.notification.alert('Error','Cannot retrieve data from beermapping.com.');
                        }
                    }
                });
            }
        }
    };
    
    // events
    x$(window).on('orientationchange', this.draw);
    
    // refresh location and render map.
    this.refresh(this.draw);
}
BeerMe.prototype = {
    draw:function() {
        // size map 
        var o = window.orientation;
        x$('#map').css({
            height:(o?screen.availWidth:screen.availHeight) + 'px',
            width:(o?screen.availHeight:screen.availWidth) + 'px'
        });
        
        // draw map
        this.LatLng = new g.maps.LatLng(this.position.coords.latitude, this.position.coords.longitude);
        var myOptions = {
            zoom: 10,
            center: this.LatLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl:false,
            streetViewControl:false
        };
        this.map = new g.maps.Map(x$('#map')[0], myOptions);
        for (var d in this.data) {
            this.data[d].get(this.position.coords.latitude, this.position.coords.longitude, this.radius)
        }
        this.hideLoading();
    },
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
        var itemP = new google.maps.LatLng(item.lat, item.lng),
            b = this.map.getBounds();
        
        // first check if it is worth showing item in the current window.
        if (b.contains(itemP)) {
            var marker = new google.maps.Marker({
                map:this.map,
                draggable:false,
                animation: google.maps.Animation.DROP,
                position:itemP
            });
            this.markers.push(marker);
        }
    },
    showLoading:function() {
        
    },
    hideLoading:function() {
        this.blackout.setStyle('display','none');
        this.loading.el.setStyle('display','none');
    }
}
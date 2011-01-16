function BeerMe() {
    var self = this;
    
    // members
    this.position = {lat:null, lng:null};
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
    
    // refresh and render on first time.
    this.refresh(this.draw);
}
BeerMe.prototype = {
    draw:function(e) {
        var o = window.orientation;
        console.log('Orientation is: ' + o + ', width: ' + screen.availWidth + ', height: ' + screen.availHeight);
        console.log('lat ' + this.position.lat + ', lng: ' + this.position.lng);
        
        // size map 
        x$('#map').css({
            height:((o == 90 || o == -90)?screen.availWidth:screen.availHeight) + 'px',
            width: ((o == 90 || o == -90)?screen.availHeight:screen.availWidth) + 'px'
        });
        
        // draw map
        this.LatLng = new google.maps.LatLng(this.position.lat, this.position.lng);
        var myOptions = {
            zoom: 10,
            center: this.LatLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl:false,
            streetViewControl:false
        };
        this.map = new google.maps.Map(x$('#map')[0], myOptions);
        for (var d in this.data) {
            this.data[d].get(this.position.lat, this.position.lng, this.radius)
        }
        this.hideLoading();
    },
    refresh:function(callback) {
        var self = this,
            options = {
            enableHighAccuracy:true,
            maximumAge:0
        },  win = function(p) {
            self.position.lat = p.coords.latitude;
            self.position.lng = p.coords.longitude;
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
    showLoading:function(msg, p) {
        var self = this;
        if (msg) this.loading.msg.inner(msg);
        if (p) this.loading.p.inner(p);
        this.blackout.fade('in', function() {
            self.loading.el.fade('in');
        });
    },
    hideLoading:function() {
        this.loading.el.fade('out');
        this.blackout.fade('out');
    }
}
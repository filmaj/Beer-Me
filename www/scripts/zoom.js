// Zoom control.
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
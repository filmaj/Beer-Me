package com.nitobi;

import java.util.ArrayList;
import java.util.List;

import com.google.android.maps.GeoPoint;
import com.google.android.maps.MapActivity;
import com.google.android.maps.MapController;
import com.google.android.maps.MapView;
import com.google.android.maps.Overlay;
import com.google.android.maps.OverlayItem;

import android.app.Activity;
import android.content.Context;
import android.graphics.drawable.Drawable;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

public class MapViewActivity extends MapActivity {
	
	private MapView mapView;
	private MapController mapController;
	private List<Overlay> mapOverlays;
	private Drawable beer, droid;
	private DrawOverlay barOverlay;
	private DrawOverlay myOverlay;
	private LocationManager locationManager;
	private LocationListener locationListener;
	private double myLat;
	private double myLng;
	private GeoPoint myGeo;
	private static final String TAG = "BeerMe";
	private static final int UPDATE_INTERVAL_MS = 120000;
	private static final int UPDATE_DISTANCE_M = 250;
	
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        // Add the view and controller overlays.
    	mapView = (MapView)findViewById(R.id.mapview);
    	mapView.setBuiltInZoomControls(true);        
    	mapView.setSatellite(true);
    	mapController = mapView.getController();
    	// Create overlays.
    	mapOverlays = mapView.getOverlays();
    	beer = this.getResources().getDrawable(R.drawable.beericon);
    	barOverlay = new DrawOverlay(beer);
    	mapOverlays.add(barOverlay);
    	droid = this.getResources().getDrawable(R.drawable.androidmarker);
    	myOverlay = new DrawOverlay(droid);
    	mapOverlays.add(myOverlay);
    	// Set location manager.
    	locationManager = (LocationManager)this.getSystemService(Context.LOCATION_SERVICE);
    	// Grab cached location.
    	Location myLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
    	myOverlay.addOverlay(new OverlayItem(new GeoPoint((int)(myLocation.getLatitude()*1E6),(int)(myLocation.getLongitude()*1E6)),"My Position","My Position"));
    	this.updateMyPosition(myLocation);
    	mapController.setCenter(myGeo);
		mapController.setZoom(15);
    	this.updateBeers();
    	locationListener = new MyLocationListener();
    }
    private void updateMyPosition(Location loc) {
    	myLat = loc.getLatitude();
    	myLng = loc.getLongitude();
    	myOverlay.clear();
    	myGeo = new GeoPoint((int)(myLat*1E6),(int)(myLng*1E6));
    	myOverlay.addOverlay(new OverlayItem(myGeo, "Me", "My Position."));
		Toast.makeText(MapViewActivity.this, "Position updated.", Toast.LENGTH_SHORT);
    }
    private void updateBeers() {
    	// Make the YQL request.
    	String request = "http://local.yahooapis.com/LocalSearchService/V3/localSearch?appid=YahooDemo&query=beer&latitude=" + String.valueOf(myLat) + "&longitude=" + String.valueOf(myLng) + "&radius=35&output=xml";
		YQLParser yql = new YQLParser(request);
		try {
			yql.parse();
			ArrayList<Place> response = yql.getPlaces();
			// Draw places.
			barOverlay.clear();
			for (int i = 0; i < response.size(); i++) {
				Place curPlace = response.get(i);
				int geoLat = (int)(curPlace.lat*1E6);
				int geoLng = (int)(curPlace.lng*1E6);
				GeoPoint barPosition = new GeoPoint(geoLat,geoLng);
				barOverlay.addOverlay(new OverlayItem(barPosition,curPlace.name,curPlace.name));
			}
		} catch (Exception e) {
			// TODO Auto-generated catch block
		}
    }
	@Override
	protected boolean isRouteDisplayed() {
		// TODO Auto-generated method stub
		return false;
	}
	@Override
	public void onResume() {
		locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, UPDATE_INTERVAL_MS, UPDATE_DISTANCE_M, locationListener);
		super.onResume();
	}
	@Override
	public void onPause() {
		locationManager.removeUpdates(locationListener);
		super.onPause();
	}
	private class MyLocationListener implements LocationListener {

		public void onLocationChanged(Location location) {
			myLat = location.getLatitude();
			myLng = location.getLongitude();
			updateMyPosition(location);
			updateBeers();
		}

		public void onProviderDisabled(String provider) {
			Toast.makeText(MapViewActivity.this, "Your location provider ('" + provider + "') has been disabled.", Toast.LENGTH_LONG).show();
		}

		public void onProviderEnabled(String provider) {
			Toast.makeText(MapViewActivity.this, "Your location provider ('" + provider + "') has been disabled.", Toast.LENGTH_SHORT).show();
		}

		public void onStatusChanged(String provider, int status, Bundle extras) {
			// TODO Auto-generated method stub

		}

	}
}
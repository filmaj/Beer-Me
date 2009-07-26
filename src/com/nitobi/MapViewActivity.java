package com.nitobi;

import java.util.ArrayList;
import java.util.List;

import com.google.android.maps.GeoPoint;
import com.google.android.maps.MapActivity;
import com.google.android.maps.MapController;
import com.google.android.maps.MapView;
import com.google.android.maps.Overlay;
import com.google.android.maps.OverlayItem;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.util.Log;
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
	private Place myPlace;
	private static final String TAG = "BeerMe";
	private static final int UPDATE_INTERVAL_MS = 120000;
	private static final int UPDATE_DISTANCE_M = 250;
	
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        // TODO: Add a loading screen.
        // Add the view and controller overlays.
    	mapView = (MapView)findViewById(R.id.mapview);
    	mapView.setBuiltInZoomControls(true);        
    	mapView.setSatellite(false);
    	mapController = mapView.getController();
    	// Create overlays.
    	mapOverlays = mapView.getOverlays();
    	beer = this.getResources().getDrawable(R.drawable.beericon);
    	barOverlay = new DrawOverlay(beer, this);
    	mapOverlays.add(barOverlay);
    	droid = this.getResources().getDrawable(R.drawable.androidmarker);
    	myOverlay = new DrawOverlay(droid, this);
    	mapOverlays.add(myOverlay);
    	// Set static properties.
    	myPlace = new Place("Me");
    	myPlace.isMe = true;
        myPlace.address = "My Position";
    	// Set location manager.
    	locationManager = (LocationManager)this.getSystemService(Context.LOCATION_SERVICE);
    	// Grab cached location.
    	Location myLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
        // Call drawing with current location.
    	Log.d(TAG,"Retrieved cached location for application startup: " + myLocation.getLatitude() + ", " + myLocation.getLongitude());
    	refresh(myLocation);
    	locationListener = new MyLocationListener();
    }
    /**
     * Re-renders user and beer locations based on specified coordinates.
     * @param loc Location object specifying current user coordinates.
     */
    public void refresh(Location loc) {
    	myLat = loc.getLatitude();
    	myLng = loc.getLongitude();
    	myGeo = new GeoPoint((int)(myLat*1E6),(int)(myLng*1E6)); 
        myPlace.lat = myLat;
        myPlace.lng = myLng;
    	this.updateMyPosition();
    	this.updateBeers();
    }
    /**
     * Re-renders user position based on current user position.
     */
    private void updateMyPosition() {
    	myOverlay.clear(false);
    	myOverlay.addOverlay(new OverlayItem(myGeo, "Me", "My Position."),myPlace);
    	mapController.setCenter(myGeo);
		mapController.setZoom(13);
		Toast.makeText(MapViewActivity.this, "Position updated.", Toast.LENGTH_SHORT).show();
    }
    /**
     * Queries online services (Yahoo, BeerMapping soon...) for available beers close to current user location, and renders this information to UI.
     */
    private void updateBeers() {
    	// Make the YQL request. TODO: Get a proper appid...
    	String request = "http://local.yahooapis.com/LocalSearchService/V3/localSearch?appid=YahooDemo&query=beer&latitude=" + String.valueOf(myLat) + "&longitude=" + String.valueOf(myLng) + "&radius=35&output=xml";
		YQLParser yql = new YQLParser(request);
		try {
			yql.parse();
			ArrayList<Place> response = yql.getPlaces();
			// Draw places.
			barOverlay.clear(false);
			for (int i = 0; i < response.size(); i++) {
				Place curPlace = response.get(i);
				int geoLat = (int)(curPlace.lat*1E6);
				int geoLng = (int)(curPlace.lng*1E6);
				GeoPoint barPosition = new GeoPoint(geoLat,geoLng);
				String beerDesc = "";
				if (curPlace.address.length() > 0) {
					beerDesc = curPlace.address + "\n";
				}
				if (curPlace.phone.length() > 0) {
					beerDesc += "Phone: " + curPlace.phone + "\n";
				}
				if (curPlace.reviewlink.length() > 0) {
					beerDesc += "Placeholder link here somehow...";
				}
				Log.d(TAG, "Adding bar ('" + curPlace.name + "') to map overlay.");
				barOverlay.addOverlay(new OverlayItem(barPosition,curPlace.name,beerDesc),curPlace);
			}
		} catch (Exception e) {
			Log.d(TAG,"Exception caught in YQL beer parsing, message: " + e.getMessage());
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
			refresh(location);
		}

		public void onProviderDisabled(String provider) {
			Toast.makeText(MapViewActivity.this, "Your location provider ('" + provider + "') has been disabled.", Toast.LENGTH_LONG).show();
		}

		public void onProviderEnabled(String provider) {
			Toast.makeText(MapViewActivity.this, "Your location provider ('" + provider + "') has been enabled.", Toast.LENGTH_SHORT).show();
		}

		public void onStatusChanged(String provider, int status, Bundle extras) {
			Log.d(TAG, "Location provider ('" + provider + "') status changed to '" + (status==0?"OUT_OF_SERVICE":status==1?"TEMPORARILY_UNAVAILABLE":"AVAILABLE") + "'.");
		}

	}
}
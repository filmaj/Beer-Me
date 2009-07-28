package com.nitobi;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.google.android.maps.GeoPoint;
import com.google.android.maps.MapActivity;
import com.google.android.maps.MapController;
import com.google.android.maps.MapView;
import com.google.android.maps.Overlay;
import com.google.android.maps.OverlayItem;

import android.app.ProgressDialog;
import android.content.Context;
import android.graphics.drawable.Drawable;
import android.location.Address;
import android.location.Geocoder;
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
	private Geocoder coder;
	private LocationXMLParser yql;
	private LocationXMLParser beerMapping;
	private ProgressDialog loadDialog;
	private double myLat;
	private double myLng;
	private GeoPoint myGeo;
	private Place myPlace;
	private static final String TAG = "BeerMe";
	private static final String DEFAULT_ADDRESS = "My position";
	private static final int UPDATE_INTERVAL_MS = 120000;
	private static final int UPDATE_DISTANCE_M = 250;
	private static final int MAX_DISTANCE_M = 20000;
	
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        // Create and show a progress dialog.
        loadDialog = ProgressDialog.show(this, "", "Loading. Please wait...", true);
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
    	// Instantiate service XML parsers.
    	yql = new LocationXMLParser("title","address","city","state","phone","businessurl","latitude","longitude","result");
    	beerMapping = new LocationXMLParser("name","street","city","state","phone","reviewlink","latitude","longitude","location");
    	beerMapping.shouldParseBeerMapping(true);
    	// Set location manager.
    	locationManager = (LocationManager)this.getSystemService(Context.LOCATION_SERVICE);
    	// Grab cached location.
    	Location myLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
    	Log.d(TAG,"Retrieved cached location for application startup: " + myLocation.getLatitude() + ", " + myLocation.getLongitude());
    	// Do a reverse geo-coding call with current location to determine address / place name. Also will be used later by BeerMapping.
    	coder = new Geocoder(this, Locale.getDefault());
    	List<Address> addresses;
    	try {
			 addresses = coder.getFromLocation(myLocation.getLatitude(), myLocation.getLongitude(), 1);
			 myPlace.address = addresses.get(0).getAdminArea();
			 myPlace.address = (myPlace.address.length()>0?myPlace.address:DEFAULT_ADDRESS);
		} catch (Exception e) {
			myPlace.address = DEFAULT_ADDRESS;
			Log.d(TAG,e.getMessage());
			Toast.makeText(MapViewActivity.this, "Could not determine current location name. Only one beer data source will be in use (no BeerMapping).", Toast.LENGTH_LONG).show();
		}
        // Call drawing with current location.
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
    	myOverlay.addOverlay(new OverlayItem(myGeo, "Me", myPlace.address),myPlace);
    	mapController.setCenter(myGeo);
		mapController.setZoom(13);
		Toast.makeText(MapViewActivity.this, "Position updated.", Toast.LENGTH_SHORT).show();
    }
    /**
     * Queries online services (Yahoo, BeerMapping soon...) for available beers close to current user location, and renders this information to UI.
     */
    private void updateBeers() {
    	// Make the YQL request.
    	yql.setRequestURL("http://local.yahooapis.com/LocalSearchService/V3/localSearch?appid=MJLfQQ4i&query=beer&latitude=" + String.valueOf(myLat) + "&longitude=" + String.valueOf(myLng) + "&radius=" + String.valueOf(MAX_DISTANCE_M/1000) + "&output=xml");
		try {
			yql.parse();
			ArrayList<Place> response = yql.getPlaces();
			Log.d(TAG, "YQL returned " + String.valueOf(response.size()) + " bars.");
			// Draw places.
			barOverlay.clear(false);
			for (int i = 0; i < response.size(); i++) {
				Place curPlace = response.get(i);
				this.addBarIfClose(curPlace);
			}
			if (response.size() == 0)
				barOverlay.clear(true);
		} catch (Exception e) {
			Log.d(TAG,"Exception caught in YQL beer parsing, message: " + e.getMessage());
			Toast.makeText(MapViewActivity.this, "There was a problem retrieving data from Yahoo. Loading data from BeerMapping...", Toast.LENGTH_LONG).show();
		}
		// Start the BeerMapping requests, if we were able to geo-code the name of user's state.
		if (myPlace.address != DEFAULT_ADDRESS) {
			try {
				beerMapping.setRequestURL("http://beermapping.com/webservice/locstate/33aac0960ce1fd70bd6e07191af96bd5/" + URLEncoder.encode(myPlace.address, "UTF-8"));
			} catch (UnsupportedEncodingException e) {
				Log.d(TAG, "Problem encoding current user's state");
			}
			try {
				beerMapping.parse();
				ArrayList<Place> response = beerMapping.getPlaces();
				for (int i = 0; i < response.size(); i++) {
					Place curPlace = response.get(i);
					// First thing we need to do is do a reverse geo-code call
					// for each result from BeerMapping.
					Log.d(TAG, "Doing a geo-coding call for address '" + curPlace.address.replace("\n", ", ") + "'.");
					List<Address> addies = coder.getFromLocationName(curPlace.address.replace("\n", ", "), 1);
					if (addies.size() == 0) {
						// Skip if no geo-coding results.
						Log.d(TAG,"No geo-coding results returned for last geo-code call.");
						continue;
					}
					Address addy = addies.get(0);
					curPlace.lat = addy.getLatitude();
					curPlace.lng = addy.getLongitude();
					this.addBarIfClose(curPlace);
				}
			} catch (Exception e) {
				Log.d(TAG, "Exception caught in BeerMapping beer parsing, message: " + e.getMessage());
				Toast.makeText(MapViewActivity.this, "There was a problem retrieving data from BeerMapping. sadface.", Toast.LENGTH_LONG).show();
			}
		}
    }
    /**
     * Compares the specified Place's coordinates to current user location, and if close enough, renders to screen.
     * @param place The Place object to check for distance and render on UI if close enough.
     */
    private void addBarIfClose(Place place) {
    	float[] results = new float[3];
		Location.distanceBetween(this.myLat, this.myLng, place.lat, place.lng, results);
		if (results[0] < MAX_DISTANCE_M) {
			int geoLat = (int) (place.lat * 1E6);
			int geoLng = (int) (place.lng * 1E6);
			GeoPoint barPosition = new GeoPoint(geoLat, geoLng);
			String beerDesc = "";
			if (place.address.length() > 0) {
				beerDesc = place.address + "\n";
			}
			if (place.phone.length() > 0) {
				beerDesc += "Phone: " + place.phone + "\n";
			}
			if (place.reviewlink.length() > 0) {
				beerDesc += "Link: " + place.reviewlink;
			}
			Log.d(TAG, "[BAR++] Added bar ('" + place.name + "') @ distance of " + String.valueOf(results[0]) + " to map overlay.");
			barOverlay.addOverlay(new OverlayItem(barPosition, place.name, beerDesc), place);
		} else {
			Log.d(TAG, "[BAR--] Bar ('" + place.name + "') @ distance of " + String.valueOf(results[0]) + " got skipped.");
		}
    }
	@Override
	protected boolean isRouteDisplayed() {
		// TODO Auto-generated method stub
		return false;
	}
	@Override
	public void onResume() {
		if (loadDialog.isShowing())
			loadDialog.dismiss();
		locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, UPDATE_INTERVAL_MS, UPDATE_DISTANCE_M, locationListener);
		super.onResume();
	}
	@Override
	public void onPause() {
		locationManager.removeUpdates(locationListener);
		super.onPause();
	}
	/**
	 * Simple implementation of a Location listener, does some basic logging and refreshes app.
	 * @author Fil Maj
	 *
	 */
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
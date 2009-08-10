package com.nitobi;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Timer;
import java.util.TimerTask;

import com.google.android.maps.GeoPoint;
import com.google.android.maps.MapActivity;
import com.google.android.maps.MapController;
import com.google.android.maps.MapView;
import com.google.android.maps.Overlay;
import com.google.android.maps.OverlayItem;

import android.app.AlertDialog;
import android.app.Dialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.res.Configuration;
import android.graphics.drawable.Drawable;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Toast;

public class BeerMeActivity extends MapActivity {
	
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
	private int numBars = 0;
	private double myLat;
	private double myLng;
	private boolean hasBM = false;
	private boolean hasYahoo = false;
	private boolean hasRefreshed = false;
	public boolean showAlert = true;
	private GeoPoint myGeo;
	private Place myPlace;
	private Timer timer = new Timer();
	private static final String TAG = "BeerMe";
	private static final String DEFAULT_ADDRESS = "My position";
	private static final String ME = "Me";
	private static final int UPDATE_INTERVAL_MS = 120000;
	private static final int UPDATE_DISTANCE_M = 250;
	private static final int MAX_DISTANCE_M = 20000;
	private static final int MENU_CACHE_REFRESH = 0;
	private static final int MENU_ABOUT = 1;
	
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
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
    	barOverlay.clear(true);
    	droid = this.getResources().getDrawable(R.drawable.androidmarker);
    	myOverlay = new DrawOverlay(droid, this);
    	mapOverlays.add(myOverlay);
    	// Set static properties.
    	myPlace = new Place(ME);
    	myPlace.isMe = true;
    	// Instantiate service XML parsers.
    	yql = new LocationXMLParser("title","address","city","state","phone","businessurl","latitude","longitude","result");
    	beerMapping = new LocationXMLParser("name","street","city","state","phone","reviewlink","latitude","longitude","location");
    	beerMapping.shouldParseBeerMapping(true);
    	// Set location manager.
    	locationManager = (LocationManager)this.getSystemService(Context.LOCATION_SERVICE);
    	// Load self position and existing Beer positions, if the app is simply re-loading.
    	this.loadPlaces();
        // Set timer for clearing GPS notifications.
        timer.schedule(new TimerTask() {
        	public void run() {
        		showAlert = true;
        	}
        }, 1000, 15000);
    	locationListener = new MyLocationListener();
    	
    }
    @Override
    public Object onRetainNonConfigurationInstance() {
        ArrayList<Place> thePlaces = new ArrayList<Place>();
        ArrayList<Place> currentPlaces = this.barOverlay.getPlaces();
        if (currentPlaces.size() > 0 && thePlaces.addAll(currentPlaces))
        	if (thePlaces.add(new Place(this.myPlace.name, this.myPlace.address, this.myPlace.isMe, this.myPlace.isBeerMapping, this.myPlace.reviewlink, this.myPlace.phone, this.myPlace.lat, this.myPlace.lng)))
        		return thePlaces;
        	else
        		return null;
        else
        	return null;
    }
    /**
     * Grabs Places assembled in onRetainNonConfiguration and renders if they exist.
     */
    private void loadPlaces() {
    	Object data = getLastNonConfigurationInstance();
    	ArrayList<Place> places = null;
    	if (data == null) {
    		// Grab cached location.
        	Location myLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
        	Log.d(TAG,"Retrieved cached location for application startup: " + myLocation.getLatitude() + ", " + myLocation.getLongitude());
        	// Do a reverse geo-coding call with current location to determine address / place name. Also will be used later by BeerMapping.
        	this.coder = new Geocoder(this, Locale.getDefault());
            // Call drawing with current location.
        	this.myLat = myLocation.getLatitude();
        	this.myLng = myLocation.getLongitude();
        	this.myGeo = new GeoPoint((int)(this.myLat*1E6),(int)(this.myLng*1E6));
        	this.myPlace.lat = myLat;
        	this.myPlace.lng = myLng;
    	} else {
    		this.hasRefreshed = true;
    		places = (ArrayList<Place>)data;
    		this.myPlace = places.remove(places.size()-1);
    		this.myLat = this.myPlace.lat;
    		this.myLng = this.myPlace.lng;
    		this.myGeo = new GeoPoint((int)(this.myLat*1E6),(int)(this.myLng*1E6));
    	}
    	this.updateMyPosition();
    	if (places!=null)
    		new BeerDrawTask().execute(places);
    }
    /**
     * Shows a dialog message with an 'OK' button.
     * @param title The dialog's title text.
     * @param message The dialog's message text.
     */
    private void showDialog(String title, String message) {
        AlertDialog ad = new AlertDialog.Builder(this).create();
        ad.setButton("OK", new DialogInterface.OnClickListener() {
          public void onClick(DialogInterface dialog, int which) {
            return;
        } });
        ad.setTitle(title);
        ad.setMessage(message);
        ad.show();
    }
    /**
     * Shows a progress dialog, with a title & message. Sets the dialog's loading progress.
     * @param title The dialog's title text.
     * @param message The dialog's message text.
     * @param progress Integer between 0 and 100 setting the progress of the dialog.
     */
    private void showProgress(String message, int progress, int max) {
    	if (loadDialog==null) {
    		loadDialog = new ProgressDialog(this);
    		loadDialog.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
    		loadDialog.setMessage(message);
    		loadDialog.setCancelable(false);
    		loadDialog.setMax(max);
    		loadDialog.show();
        }
    	loadDialog.setProgress(progress);
    }
    /**
     * Kills the current progress dialog, if it exists.
     */
    private void killProgress() {
    	if (loadDialog!=null) {
    		loadDialog.dismiss();
    		loadDialog=null;
        }
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
        List<Address> addresses;
    	try {
			 addresses = coder.getFromLocation(myLat, myLng, 1);
			 myPlace.address = addresses.get(0).getAdminArea();
			 myPlace.address = (myPlace.address.length()>0?myPlace.address:DEFAULT_ADDRESS);
		} catch (Exception e) {
			myPlace.address = DEFAULT_ADDRESS;
			Log.d(TAG,e.getMessage());
			showDialog("Error determining your city and/or state","Could not determine current location name. Only one beer data source will be in use (no BeerMapping).");
		}
    	this.updateMyPosition();
    	if (hasRefreshed) return;
    	hasRefreshed = true;
    	this.updateBeers();
    }
    /**
     * Re-renders user position based on current user position.
     */
    private void updateMyPosition() {
    	this.myOverlay.clear(false);
    	this.myOverlay.addOverlay(new OverlayItem(this.myGeo, this.ME, this.myPlace.address),this.myPlace);
    	this.mapController.animateTo(this.myGeo);
    	this.mapController.setZoom(13);
    }
    /**
     * Queries online services (Yahoo, BeerMapping) for available beers close to current user location, and renders this information to UI.
     */
	private void updateBeers() {
    	// Make the YQL request.
    	yql.setRequestURL("http://local.yahooapis.com/LocalSearchService/V3/localSearch?appid=Get Your Own Key&query=beer&latitude=" + String.valueOf(myLat) + "&longitude=" + String.valueOf(myLng) + "&radius=" + String.valueOf(MAX_DISTANCE_M/1000) + "&output=xml");
		try {
			yql.parse();
			ArrayList<Place> response = yql.getPlaces();
			// Clear map first.
			barOverlay.clear(false);
			// Draw places.
			new BeerDrawTask().execute(response);
		} catch (Exception e) {
			Log.d(TAG,"Exception caught in YQL beer parsing, message: " + e.getMessage());
			if (myPlace.address!=DEFAULT_ADDRESS) {
				showDialog("Problem retrieving data","There was a problem retrieving data from Yahoo. Loading data from BeerMapping...");
			} else {
				showDialog("Problem retrieving data","There was a problem retrieving data from Yahoo. We can't retrieve beer info for you. Sorry, try again later? :(");
			}
		}
		// Start the BeerMapping requests, if we were able to geo-code the name of user's state.
		if (myPlace.address != DEFAULT_ADDRESS) {
			try {
				beerMapping.setRequestURL("http://beermapping.com/webservice/locstate/Get Your Own Key/" + URLEncoder.encode(myPlace.address, "UTF-8"));
				try {
					beerMapping.parse();
					ArrayList<Place> response = beerMapping.getPlaces();
					new BeerDrawTask().execute(response);
				} catch (Exception e) {
					Log.d(TAG, "Exception caught in BeerMapping beer parsing, message: " + e.getMessage());
					showDialog("Problem retrieving data","There was a problem retrieving data from BeerMapping. ");
				}
			} catch (UnsupportedEncodingException e) {
				Log.d(TAG, "Problem encoding current user's state.");
				showDialog("Cannot encode state name","There was a problem encoding your current state's name for data retrieval from BeerMapping. We can't retrieve beer info for you. Sorry :(");
			}
		}
		// Refresh the screen.
		barOverlay.refresh();
		mapView.postInvalidate();
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
	/* Creates the menu items */
	public boolean onCreateOptionsMenu(Menu menu) {
	    menu.add(0, MENU_CACHE_REFRESH, 0, R.string.menu_refresh).setIcon(android.R.drawable.ic_menu_rotate);
	    menu.add(0, MENU_ABOUT, 1, R.string.menu_about).setIcon(android.R.drawable.ic_menu_info_details);
	    return true;
	}

	/* Handles item selections */
	public boolean onOptionsItemSelected(MenuItem item) {
	    switch (item.getItemId()) {
	    	case MENU_CACHE_REFRESH:
	    		hasRefreshed = false;
	    		Location myLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
	    		Log.d(TAG,"Retrieved cached location for cached refresh: " + myLocation.getLatitude() + ", " + myLocation.getLongitude());
	    		refresh(myLocation);
	    		return true;
	    	case MENU_ABOUT:
	    		showDialog("About Beer Me","Developed by Fil Maj of Nitobi (www.nitobi.com)\n\nWe create web & mobile applications that deliver great user experiences.\n\nThanks to BeerMapping & Yahoo for providing awesome open data services!");
	    		return true;
	    }
	    return false;
	}
	public void onConfigurationChanged(Configuration newConfig) {
      //don't reload everything!
      super.onConfigurationChanged(newConfig);
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
			Toast.makeText(BeerMeActivity.this, "Your location provider ('" + provider + "') has been disabled.", Toast.LENGTH_LONG).show();
		}

		public void onProviderEnabled(String provider) {
			Toast.makeText(BeerMeActivity.this, "Your location provider ('" + provider + "') has been enabled.", Toast.LENGTH_SHORT).show();
		}

		public void onStatusChanged(String provider, int status, Bundle extras) {
			if (showAlert) {
				showAlert = false;
				switch (status) {
				case 0:
					Toast.makeText(
							BeerMeActivity.this,
							"The " + provider.toUpperCase()
									+ " is out of service...",
							Toast.LENGTH_SHORT).show();
					break;
				case 1:
					Toast
							.makeText(
									BeerMeActivity.this,
									"The "
											+ provider.toUpperCase()
											+ " is searching for your position...",
									Toast.LENGTH_SHORT).show();
					break;
				case 2:
					break;
				}
			}
			Log.d(TAG, "Location provider ('" + provider + "') status changed to '" + (status==0?"OUT_OF_SERVICE":status==1?"TEMPORARILY_UNAVAILABLE":"AVAILABLE") + "'.");
		}

	}
	private class BeerDrawTask extends AsyncTask<ArrayList<Place>,Integer,boolean[]> {
		@Override
		protected boolean[] doInBackground(ArrayList<Place>... params) {
			boolean completeFlag = false;
			boolean bmFlag = false;
			try {
				ArrayList<Place> response = params[0];
				int total = response.size();
				numBars = total;
				Log.d(TAG, "BeerDrawTask is beginning processing of " + String.valueOf(numBars) + " bars.");
				for (int i = 0; i < total; i++) {
					Place curPlace = response.get(i);
					bmFlag = curPlace.isBeerMapping;
					if (bmFlag) {
						// Check if lat/lng needs to be set, or was already set.
						if (curPlace.lat == Place.DEFAULT && curPlace.lng == Place.DEFAULT) {
							// First thing we need to do is do a reverse
							// geo-code call
							// for each result from BeerMapping.
							Log.d(TAG, "Doing a geo-coding call for address '"
									+ curPlace.address.replace("\n", ", ")
									+ "'.");
							List<Address> addies = coder.getFromLocationName(
									curPlace.address.replace("\n", ", "), 1);
							if (addies.size() == 0) {
								// Skip if no geo-coding results.
								Log.d(TAG, "No geo-coding results returned for last geo-code call.");
								publishProgress(i, 1, total);
								continue;
							}
							Address addy = addies.get(0);
							curPlace.lat = addy.getLatitude();
							curPlace.lng = addy.getLongitude();
						} else {
							
						}
					}
					this.addBarIfClose(curPlace);
					publishProgress(i,(int)(bmFlag?1:0), total);
				}
				completeFlag = true;
			} catch (Exception e) {
				Log.d(TAG, "BeerDrawTask exception: " + e.getMessage());
				completeFlag = false;
				e.printStackTrace();
			}
			return new boolean[]{completeFlag,bmFlag};
		}
		protected void onProgressUpdate(Integer... progress) {
			if (progress[1] > 0) {
				// BeerMapping
				showProgress("Loading beers retrieved from BeerMapping.com...", progress[0], progress[2]);
			} else {
				// Yahoo
				showProgress("Loading beers retrieved from Yahoo.com...", progress[0], progress[2]);
			}
		}
		protected void onPostExecute(boolean[] wasSuccessful) {
			//get rid of the progress bar
		    killProgress();
		    boolean completeFlag = wasSuccessful[0];
		    boolean bmFlag = wasSuccessful[1];
		    //tell the user how it went
		    if (bmFlag) {
		    	if (completeFlag) {
		    		hasBM = true;
		    	} else {
		    		hasBM = false;
		    	}
		    	String dialMsg = "The following beer sources have finished loading:\n\nYahoo: ";
		    	if (hasYahoo) dialMsg += "Loaded successfully.\n\n";
		    	else dialMsg += "Not loaded properly.\n\n";
		    	if (myPlace.address!=DEFAULT_ADDRESS) {
		    		dialMsg += "BeerMapping: ";
		    		if (hasBM) dialMsg += "Loaded successfully.";
		    		else dialMsg += "Not loaded properly.";
		    	}
		    	showDialog("Beer loading complete", dialMsg);
		    } else {
		    	if (completeFlag) {
		    		hasYahoo = true;
		    	} else {
		    		hasYahoo = false;
		    	}
		    }
		}
		/**
	     * Compares the specified Place's coordinates to current user location, and if close enough, renders to screen.
	     * @param place The Place object to check for distance and render on UI if close enough.
	     */
	    private void addBarIfClose(Place place) {
	    	float[] results = new float[3];
			Location.distanceBetween(myLat, myLng, place.lat, place.lng, results);
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
	}
}
package com.nitobi;

import java.util.ArrayList;

import com.google.android.maps.OverlayItem;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

public class DrawOverlay extends com.google.android.maps.ItemizedOverlay {
	private ArrayList<OverlayItem> mOverlays = new ArrayList<OverlayItem>();
	private ArrayList<Place> mPlaces = new ArrayList<Place>();
	private Activity mApp;
	
	public DrawOverlay(Drawable marker, Activity app) {
		super(boundCenterBottom(marker));
		mApp = app;
	}

	@Override
	protected OverlayItem createItem(int i) {
		return mOverlays.get(i);
	}

	@Override
	public int size() {
		return mOverlays.size();
	}
	public void refresh() {
		populate();
	}
	public void addOverlay(OverlayItem overlay, Place place) {
    	mOverlays.add(overlay);
    	mPlaces.add(place);
    	populate();
	}
	/**
	 * Clears all overlay markers and associated places, and optionally immediately re-renders the map.
	 * @param refreshScreen Should the overlay items be drawn immediately after clearing?
	 */
	public void clear(boolean refreshScreen) {
		mOverlays = new ArrayList<OverlayItem>();
		mPlaces = new ArrayList<Place>();
		if (refreshScreen)
			populate();
	}
	@Override
	public boolean onTap(int index) {
		// Grab place information.
		final Place place = mPlaces.get(index);
		
		// Build the dialog.
		AlertDialog.Builder builder;
		AlertDialog alertDialog;
		LayoutInflater inflater = (LayoutInflater) mApp.getSystemService(android.content.Context.LAYOUT_INFLATER_SERVICE);
		View layout = inflater.inflate(R.layout.place_dialog, (ViewGroup) mApp.findViewById(R.id.layout_root));
		TextView textAddress = (TextView) layout.findViewById(R.id.address);
		textAddress.setText(place.address);
		TextView textPhone = (TextView) layout.findViewById(R.id.phone);
		if (place.phone.length() > 0) {
			textPhone.setVisibility(android.view.View.VISIBLE);
			textPhone.setText("Phone: " + place.phone);
		} else {
			textPhone.setVisibility(android.view.View.GONE);
		}
		Button btnLink = (Button) layout.findViewById(R.id.link_btn);
		if (place.reviewlink.length() > 0) {
			String linkText = "";
			if (place.isBeerMapping) {
				linkText = "BeerMapping Review Page";
			} else {
				linkText = "Web Site";
			}
			btnLink.setVisibility(android.view.View.VISIBLE);
			btnLink.setText(linkText);
			btnLink.setOnClickListener(new View.OnClickListener() {
	             public void onClick(View v) {
	            	 Intent myIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(place.reviewlink));
	            	 mApp.startActivity(myIntent);
	             }
	        });
		} else {
			btnLink.setVisibility(android.view.View.INVISIBLE);
		}
		builder = new AlertDialog.Builder(mApp);
		builder.setTitle(place.name);
		builder.setView(layout);
		alertDialog = builder.create();
		// Show dialog.
		alertDialog.setOwnerActivity(mApp);
		alertDialog.show();
		return true;
	}
	/**
	 * Returns the associated list of places.
	 * @return The associated list of places.
	 */
	public ArrayList<Place> getPlaces() {
		return new ArrayList<Place>(this.mPlaces);
	}
}

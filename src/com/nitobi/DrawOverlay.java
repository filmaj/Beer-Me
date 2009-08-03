package com.nitobi;

import java.util.ArrayList;

import com.google.android.maps.OverlayItem;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.graphics.drawable.Drawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

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
		// Grab marker and place information.
		OverlayItem marker = mOverlays.get(index);
		Place place = mPlaces.get(index);
		
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
		TextView textLink = (TextView) layout.findViewById(R.id.link);
		if (place.reviewlink.length() > 0) {
			String linkText = "";
			if (place.isBeerMapping) {
				linkText = "BeerMapping link: ";
			} else {
				linkText = "Link: ";
			}
			textLink.setVisibility(android.view.View.VISIBLE);
			textLink.setText(linkText + place.reviewlink);
		} else {
			
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
}

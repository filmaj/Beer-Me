package com.nitobi;

import java.util.ArrayList;

import com.google.android.maps.OverlayItem;

import android.graphics.drawable.Drawable;
import android.widget.Toast;

public class DrawOverlay extends com.google.android.maps.ItemizedOverlay {
	private ArrayList<OverlayItem> mOverlays = new ArrayList<OverlayItem>();
	private ArrayList<Place> mPlaces = new ArrayList<Place>();
	
	public DrawOverlay(Drawable marker) {
		super(boundCenterBottom(marker));
		// TODO Auto-generated constructor stub
	}

	@Override
	protected OverlayItem createItem(int i) {
		return mOverlays.get(i);
	}

	@Override
	public int size() {
		// TODO Auto-generated method stub
		return mOverlays.size();
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
		// TODO: Show dialog with bar info.
		OverlayItem marker = mOverlays.get(index);
		Place place = mPlaces.get(index);
		return true;
	}
}

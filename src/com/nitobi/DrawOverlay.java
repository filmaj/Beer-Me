package com.nitobi;

import java.util.ArrayList;

import com.google.android.maps.OverlayItem;

import android.graphics.drawable.Drawable;
import android.widget.Toast;

public class DrawOverlay extends com.google.android.maps.ItemizedOverlay {
	private ArrayList<OverlayItem> mOverlays = new ArrayList<OverlayItem>();
	
	public DrawOverlay(Drawable marker) {
		super(boundCenterBottom(marker));
		// TODO Auto-generated constructor stub
	}

	@Override
	protected OverlayItem createItem(int i) {
		// TODO Auto-generated method stub
		return mOverlays.get(i);
	}

	@Override
	public int size() {
		// TODO Auto-generated method stub
		return mOverlays.size();
	}
	public void addOverlay(OverlayItem overlay) {
    	mOverlays.add(overlay);
    	populate();
	}
	public void clear() {
		mOverlays = new ArrayList<OverlayItem>();
		populate();
	}
}

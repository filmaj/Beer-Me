package com.nitobi;

public class Place {
	public String name = "";
	public String address = "";
	public boolean isMe = false;
	public boolean isBeerMapping = false;
	public String reviewlink = "";
	public String phone = "";
	public double lat = 0;
	public double lng = 0;
	public Place(String n) {
		this.name = n;
	}
}

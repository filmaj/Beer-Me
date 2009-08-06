package com.nitobi;

public class Place {
	public static double DEFAULT = 0.01;
	public String name = "";
	public String address = "";
	public boolean isMe = false;
	public boolean isBeerMapping = false;
	public String reviewlink = "";
	public String phone = "";
	public double lat = DEFAULT;
	public double lng = DEFAULT;
	public Place(String n) {
		this.name = n;
	}
	public Place(String Name, String Address, boolean Isme, boolean Isbeermapping, String Reviewlink, String Phone, double Lat, double Lng) {
		this.name = Name;
		this.address = Address;
		this.isMe = Isme;
		this.isBeerMapping = Isbeermapping;
		this.reviewlink = Reviewlink;
		this.phone = Phone;
		this.lat = Lat;
		this.lng = Lng;
	}
}

package com.nitobi;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

public class BeerMappingParser extends DefaultHandler {
	
	private ArrayList<Place> places;
    private String urlString;
    private String currentPlace;
    private String currentAddress;
    private String currentCity;
    private String currentState;
    private String currentPhone;
    private String currentLink;
    private double currentLat;
    private double currentLon;
    private boolean inResult;
    private StringBuilder text;
    
    public BeerMappingParser(String url) {
        this.urlString = url;
        this.text = new StringBuilder();
        this.places = new ArrayList<Place>();
        this.currentLat = 0;
        this.currentLon = 0;
        this.currentPlace = null;
    }
   
    public void parse() throws ParserConfigurationException, SAXException, IOException {
        InputStream urlInputStream = null;
        SAXParserFactory spf = null;
        SAXParser sp = null;
        URL url = new URL(this.urlString);
        urlInputStream = url.openConnection().getInputStream();           
        spf = SAXParserFactory.newInstance();
        if (spf != null) {
                sp = spf.newSAXParser();
            sp.parse(urlInputStream, this);
        }
        if (urlInputStream != null) urlInputStream.close();
    }
    /**
     * Logic executed when the parser encounters a new XML element.
     */
    public void startElement(String uri, String localName, String qName, Attributes attributes) {
    	// If it's a new 'result' element, reset the local variables.
        if (localName.equalsIgnoreCase("result")) {
                this.inResult = true;
                this.currentLat = 0;
                this.currentLon = 0;
                this.currentPlace = null;
                this.currentAddress = null;
                this.currentCity = null;
                this.currentState = null;
                this.currentPhone = null;
                this.currentLink = null;
        }
    }
   
    /**
     * Logic executed when the parser encounters the end of an XML element. This is where we actually parse for the elements contents.
     */
    public void endElement(String uri, String localName, String qName) {
        // Check we have a Result
        if (this.inResult == false) {
            return;
        }
        // Check are at the end of a result item. Here is where we construct a Place instance and add it to our list.
        if (localName.equalsIgnoreCase("result")) {
                this.inResult = false;
                // Make sure we have, at the least, GPS coordinates and a place name.
                if (this.currentLat != 0.0 && this.currentLon != 0.0 && this.currentPlace != null && this.currentPlace.length() > 0) {
                	Place obj = new Place(this.currentPlace);
                	obj.lat = this.currentLat;
                	obj.lng = this.currentLon;
                	// Construct an address string based on available address, city and state information.
                	String finalAddressString = "";
                	if (this.currentState != null) {
                		finalAddressString = this.currentState;
                	}
                	if (this.currentCity != null) {
                		finalAddressString = this.currentCity + ", " + finalAddressString;
                	}
                	if (this.currentAddress != null)  {
                		finalAddressString = this.currentAddress + ", " + finalAddressString;
                	}
                	obj.address = finalAddressString;
                	if (this.currentPhone != null) {
                		obj.phone = this.currentPhone;
                	}
                	if (this.currentLink != null) {
                		obj.reviewlink = this.currentLink;
                	}
                	this.places.add(obj);
                }
        }
        // Parse title
        if (localName.equalsIgnoreCase("title"))
        {
            if (this.inResult == true){
                this.currentPlace = this.text.toString().trim();
            } 
        }       
        // Parse geo coords
        if (localName.equalsIgnoreCase("latitude"))
        {
            if (this.inResult == true){
                this.currentLat = Double.parseDouble(this.text.toString().trim());
            } 
        }   
        if (localName.equalsIgnoreCase("longitude"))
        {
            if (this.inResult == true){
                this.currentLon = Double.parseDouble(this.text.toString().trim());
            } 
        }
        if (localName.equalsIgnoreCase("address"))
        {
        	if (this.inResult == true){
                this.currentAddress = this.text.toString().trim();
            }
        }
        if (localName.equalsIgnoreCase("city"))
        {
        	if (this.inResult == true){
                this.currentCity = this.text.toString().trim();
            }
        }
        if (localName.equalsIgnoreCase("state"))
        {
        	if (this.inResult == true){
                this.currentState = this.text.toString().trim();
            }
        }
        if (localName.equalsIgnoreCase("phone"))
        {
        	if (this.inResult == true){
                this.currentPhone = this.text.toString().trim();
            }
        }
        if (localName.equalsIgnoreCase("businessurl"))
        {
        	if (this.inResult == true){
                this.currentLink = this.text.toString().trim();
            }
        }
        this.text.setLength(0);
    }
   
    public void characters(char[] ch, int start, int length) {
        this.text.append(ch, start, length);
    }
    public ArrayList<Place> getPlaces() {
    	return this.places;
    }
}

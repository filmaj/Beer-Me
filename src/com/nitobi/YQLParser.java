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

public class YQLParser extends DefaultHandler
{     
    /**
     * The constructor for the RSS Parser
     * @param url
     */
	private ArrayList<Place> places;
    private String urlString;
    private String currentPlace;
    private double currentLat;
    private double currentLon;
    private boolean inResult;
    private StringBuilder text;
    
    public YQLParser(String url) {
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
    
    public void startElement(String uri, String localName, String qName, Attributes attributes) {
        /** First lets check for a Result */
        if (localName.equalsIgnoreCase("result")) {
                this.inResult = true;
                this.currentLat = 0;
                this.currentLon = 0;
                this.currentPlace = null;
        }
    }
   
    /**
     * This is where we actually parse for the elements contents
     */
    public void endElement(String uri, String localName, String qName) {
        /** Check we have a Result */
        if (this.inResult == false) {
            return;
        }
        
        /** Check are at the end of an item */
        if (localName.equalsIgnoreCase("result")) {
                this.inResult = false;
        }
       
        /** Now we need to parse which title we are in */
        if (localName.equalsIgnoreCase("title"))
        {
            if (this.inResult == true){
                this.currentPlace = this.text.toString().trim();
            } 
        }       
       
        /** Now we need to parse geo coords */
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
                if (this.currentLat != 0.0) {
                	if (this.currentPlace.length() > 0) {
                		Place obj = new Place(this.currentPlace);
                		obj.lat = this.currentLat;
                		obj.lng = this.currentLon;
                		this.places.add(obj);
                	}
                }
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
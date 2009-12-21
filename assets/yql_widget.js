/*************************************************************************************************************
* yql_js_widget.js
* YQL JavaScript Widget
*
* Created by Jonathan LeBlanc on 06/08/09.
* Copyright (c) 2009 Yahoo! Inc. All rights reserved.
* 
* The copyrights embodied in the content of this file are licensed under the BSD (revised) open source license.
*************************************************************************************************************/
 
//YUI includes for GET utility
if (! window.YAHOO){
    document.write('<script type="text/javascript" src="http://yui.yahooapis.com/2.7.0/build/yahoo/yahoo-min.js" ></script>' +
		   '<script type="text/javascript" src="http://yui.yahooapis.com/2.7.0/build/get/get-min.js" ></script>');
}
   
yqlWidget = function() {
	//property instantiation
	var yqlPublicQueryURL = "http://query.yahooapis.com/v1/public/yql?";
	var widgetStack = [];
	var currString, resultFormat, queryInsert, setupConfig = [];
	var regex = /\{([\w\-\.\[\]]+)\}/gi;
 
	/************************************************************
	* Method: YUI GET Status Handlers 
	* Description: YUI GET function status functions
	************************************************************/
	var onYQLReqSuccess = function(o){ if (setupConfig['debug'] && window.console){ console.log('GET request succeeded'); }}
	var onYQLReqFailure = function(o){ if (setupConfig['debug'] && window.console){ console.log('GET request failed'); }}
    
	/************************************************************
	* Method: Get YQL Data
	* Description: Use the query provided to make a request to 
	*              YQL endpoint to capture data
	************************************************************/
	var getYQLData = function(query){
		//prepare the URL for YQL query:
        	var sURL = yqlPublicQueryURL + "q=" + encodeURI(query) + "&format=json&callback=yqlWidget.getYQLDataCallback";
 
		//add any environment files specified in the config
		if (setupConfig['env']) {
			sURL += "&env=" + escape(setupConfig['env']);
		}
 
		//make GET request to YQL with provided query
        	var transactionObj = YAHOO.util.Get.script(sURL, {
         	onSuccess : onYQLReqSuccess,
		onFailure : onYQLReqFailure,
            	scope     : this
        	});
 
		return transactionObj;
    	}
 
	/************************************************************
	* Method: Parse YQL Results
	* Description: Using the result set, parse the YQL results
	*			   into display mode
	***********************************************************
	var parseYQLResults = function(results){
		//get first JSON node - use loop due to first node being an unknown object
		var firstChild;
		for (var child in results){
			if (results.hasOwnProperty(child)){
				firstChild = results[child];
				break;
			}
		}
		
		//return data instantiation
		var html = "";
		
		//loop through all YQL return elements and result replace regex
		if (firstChild.length !== undefined){
			//multiple results - array
			for(var i = 0; i < firstChild.length; i++){
				html += parseFormat(firstChild[i]);
			}
		} else {
			//single result - object
			html += parseFormat(firstChild);
		}
		
		document.getElementById(queryInsert).innerHTML = html;
		yqlWidget.render();
	}
	*/
	var parseYQLResults = function(results){
		var createBeerMarker = function(node) {
			var beerMarker = new GMarker(new GLatLng(node.Latitude,node.Longitude), BeerMe.beerMarkerOptions);
		    GEvent.addListener(beerMarker, "click", function() {
		    	var myHtml = "<b>" + node.Title + "</b><br/>" + node.Address + "<br/>" + node.City;
		    	beerMarker.openInfoWindowHtml(myHtml);
		    });
		    return beerMarker;
		}
		//get first JSON node - use loop due to first node being an unknown object
		var firstChild;
		for (var child in results){
			if (results.hasOwnProperty(child)){
				firstChild = results[child];
				break;
			}
		}
		//loop through all YQL return elements and result replace regex
		if (firstChild.length !== undefined){
			//multiple results - array
			var Titles = [];
			for(var i = 0; i < firstChild.length; i++){
			    BeerMe.map.addOverlay(createBeerMarker(firstChild[i]));
			}
		} else {
			//single result - object
			var beerMarker = new GMarker(new GLatLng(firstChild[i].Latitude,firstChild[i].Longitude), beerMarkerOptions);
		    GEvent.addListener(beerMarker, "click", function() {
		    	var myHtml = "<b>" + firstChild[i].Title + "</b>";
		    	beerMarker.openInfoWindowHtml(myHtml);
		    });
		    BeerMe.map.addOverlay(beerMarker);
		}
		yqlWidget.render();
	}
	/************************************************************
	* Method: Parse Format
	* Description: Loop through format array for provided
	*              data set node
	************************************************************/
	var parseFormat = function(node){
		currString = node;
 
		//replace YQL result placeholders with return content
		if (resultFormat){ currString = resultFormat.replace(regex, function(matchedSubstring, index, originalString){
			return eval("currString." + index);
		});}
 
		return currString;
	}
 
	/************************************************************
	* Method: Public Function Return
	* Functions: init - starts yql parsing functions
	*			 getYQLDataCallback - yql run callback
	************************************************************/
	return {
		//push widget on the load stack
		push: function(query, config, format, insertEl){
			//validate widget variables
			if (query == null || format == null || insertEl == null){
				if (setupConfig['debug'] && window.console){ console.log('Missing query, return format or insert element'); }
				return null;
			}
 
			//push widget load on the stack
			widgetStack.push(function(){ yqlWidget.init(query, config, format, insertEl); });
		},
 
		//pop widget off the load stack and execute
		render: function(){ if (widgetStack.length > 0){ widgetStack.pop()(); } },
 
		//widget initialization
		init: function(query, config, format, insertEl){ 
			resultFormat = format; queryInsert = insertEl;
			if (config){ setupConfig = config; }
			return getYQLData(query);
		}, 
 
		//yql data caption success callback
		getYQLDataCallback: function(o){
			if (! o.query){
				if (setupConfig['debug'] && window.console){ console.log('YQL query returned no results'); }
				return null;
			}
			parseYQLResults(o.query.results);
		}
	}
}();
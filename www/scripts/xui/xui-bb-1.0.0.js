/*
 * XUI JavaScript Library v1.0.0
 * http://xuijs.com
 * 
 * Copyright (c) 2009 Brian LeRoux, Rob Ellis, Brock Whitten
 * Licensed under the MIT license.
 * 
 * Date: 2010-03-13T03:26:49-08:00
 */
(function() {

    var undefined,
        xui,
        window   = this,
        string   = new String('string'), 				// prevents Goog compiler from removing primative and subsidising out allowing us to compress further
        document = window.document,      				// obvious really
        idExpr   = /^#([\w-]+)$/,        				// for situations of dire need. Symbian and the such
		tagExpr  = /<(\S+).*\/>|<(\S+).*>.*<\/\S+>/,	// so you can create elements on the fly a la x$('<img/>')
        slice    = [].slice;

    window.x$ = window.xui = xui = function(q, context) {
        return new xui.fn.find(q, context);
    };

    // patch in forEach to help get the size down a little and avoid over the top currying on event.js and dom.js (shortcuts)
    if (! [].forEach) {
        Array.prototype.forEach = function(fn) {
            var len = this.length || 0,
                that = arguments[1], // wait, what's that!? awwww rem. here I thought I knew ya!
                i;
            if (typeof fn == 'function') {
                for (i = 0; i < len; i++) {
                    fn.call(that, this[i], i, this);
                }
            }
        };
    }
    /**
     * Array Remove - By John Resig (MIT Licensed) 
     */
    function removex(array, from, to) {
        var rest = array.slice((to || from) + 1 || array.length);
        array.length = from < 0 ? array.length + from: from;
        return array.push.apply(array, rest);
    }

    xui.fn = xui.prototype = {

        extend: function(o) {
            for (var i in o) {
                xui.fn[i] = o[i];
            }
        },

        find: function(q, context) {
            var ele = [],
                list,
                h, i, j, x; // poetry mate
                
            if (!q) {
                return this;
            } else if (context === undefined && this.length) {
                this.each(function(el, i) {
                    ele = ele.concat(slice.call(xui(q, this)));
                });
                ele = this.reduce(ele);
            } else {
                context = context || document;
                
                // fast matching for pure ID selectors
                if (typeof q == string && idExpr.test(q)) {
                    ele = [context.getElementById(q.substr(1))];
				// match for full html tags to create elements on the go
				} else if (typeof q == string && tagExpr.test(q)) {
					tagExpr.exec(q).forEach(function(match, index) {
						if (index===0) return;
						else if (match !== undefined) h = match;
					});;
					ele = [document.createElement(h)];
                } else if (typeof q == string) {
                    // one selector, check if Sizzle is available and use it instead of querySelectorAll.
					if (typeof Sizzle !== "undefined") {
						h = Sizzle(q);
					} else {
						h = context.querySelectorAll(q);
					}
					ele = slice.call(h);
                } else if (q.toString() === '[object Array]') {
                    ele = q;
                } else {
                    // an element was passed in
                    ele = [q];
                }
            }
            
            // disabling the append style, could be a plugin:
            // xui.fn.add = function (q) { this.elements = this.elements.concat(this.reduce(xui(q).elements)); return this; }
            return this.set(ele);
        },

        /** 
         * Resets the body of elements contained in XUI
         * Note that due to the way this.length = 0 works
         * if you do console.dir() you can still see the 
         * old elements, but you can't access them. Confused?
         */
        set: function(elements) {
            var ret = xui();
            
            // this *really* doesn't feel right...
            ret.cache = slice.call(this);
            ret.length = 0;
            [].push.apply(ret, elements);
            return ret;
        },

        /**
        * Array Unique
        */
        reduce: function(elements, b) {
            var a = [],
            elements = elements || slice.call(this);
            elements.forEach(function(el) {
                // question the support of [].indexOf in older mobiles (RS will bring up 5800 to test)
                if (a.indexOf(el, 0, b) < 0)
                a.push(el);
            });

            return a;
        },

        /**
         * Has modifies the elements array and reurns all the elements that match (has) a CSS Query
         */
        has: function(q) {
            return this.filter(function() {
                return !! xui(q, this).length;
            });
        },

        /**
         * Both an internal utility function, but also allows developers to extend xui using custom filters
         */
        filter: function(fn) {
            var elements = [];
            return this.each(function(el, i) {
                if (fn.call(el, i)) elements.push(el);
            }).set(elements);
        },

        // supports easier conversion of jQuery plugins to XUI
        end: function () {
            return this.set(this.cache || []);
        },


        /**
         * Not modifies the elements array and reurns all the elements that DO NOT match a CSS Query
         */
        not: function(q) {
            var list = slice.call(this);
            
            return this.filter(function(i) {
                var found;
                xui(q).each(function(el) {
                    return found = list[i] != el;
                });
                return found;
            });
        },


        /**
         * Element iterator.
         * 
         * @return {XUI} Returns the XUI object. 
         */
        each: function(fn) {
            // we could compress this by using [].forEach.call - but we wouldn't be able to support
            // fn return false breaking the loop, a feature I quite like.
            for (var i = 0, len = this.length; i < len; ++i) {
                if (fn.call(this[i], this[i], i, this) === false)
                break;
            }
            return this;
        }
    };

    xui.fn.find.prototype = xui.fn;
    xui.extend = xui.fn.extend;

      // --- 
    /**
     * 
     * @namespace {Dom}
     * @example
     *
     * Dom
     * ---
     * 
     * Manipulating the Document Object Model aka the DOM.
     * 
     */
    xui.extend({
    
        /**
         * For manipulating HTML markup in the DOM.
         * 
         * syntax:
         *
         *      x$(window).html( location, html );
         *
         * or this method will accept just an html fragment with a default behavior of inner..
         *
         *      x$(window).html( htmlFragment );
         * 
         * arguments:
         * 
         * - location:string can be one of inner, outer, top, bottom
         * - html:string any string of html markup or HTMLElement
         *
         * example:
         *
         *      x$('#foo').html( 'inner',  '<strong>rock and roll</strong>' );
         *      x$('#foo').html( 'outer',  '<p>lock and load</p>' );
         *      x$('#foo').html( 'top',    '<div>bangers and mash</div>');
         *      x$('#foo').html( 'bottom', '<em>mean and clean</em>');
         *      x$('#foo').html( 'remove');	
         *      x$('#foo').html( 'before', '<p>some warmup html</p>');
         *      x$('#foo').html( 'after', '<p>more html!</p>');
         * 
         * or
         * 
         *      x$('#foo').html('<p>sweet as honey</p>');
         * 
         */
        html: function (location, html) {
    
            // private method for finding a dom element
            var getTag = function (el) {
    
                if (el.firstChild === null) {
                    switch (el.tagName) {
                    case 'UL':
                        return 'LI';
                    case 'DL':
                        return 'DT';
                    case 'TR':
                        return 'TD';
                    default:
                        return el.tagName;
                    }
                }
                return el.firstChild.tagName;
            },
    
            // private method
            // Wraps the HTML in a TAG, Tag is optional
            // If the html starts with a Tag, it will wrap the context in that tag.
            wrap = function (xhtml, tag) {
                var attributes = {},
                    re = /^<([A-Z][A-Z0-9]*)([^>]*)>(.*)<\/\1>/i,
                    result, attrList, i, attr, node, element, x, a;
                
                if (re.test(xhtml)) {
                    result = re.exec(xhtml);
                    tag = result[1];
    
                    // if the node has any attributes, convert to object
                    if (result[2] !== "") {
                        attrList = result[2].split(/([A-Z]*\s*=\s*['|"][A-Z0-9:;#\s]*['|"])/i);
    
                        for (i = 0; i < attrList.length; i++) {
                            attr = attrList[i].replace(/^\s*|\s*$/g, "");
                            if (attr !== "" && attr !== " ") {
                                node = attr.split('=');
                                attributes[node[0]] = node[1].replace(/(["']?)/g, '');
                            }
                        }
                    }
                    xhtml = result[3];
                }
    
                element = document.createElement(tag);
    
                for (x in attributes) {
                    a = document.createAttribute(x);
                    a.nodeValue = attributes[x];
                    element.setAttributeNode(a);
                }
    
                element.innerHTML = xhtml;
                return element;
            };
    
            this.clean();
    
            if (arguments.length === 0) {
                return this[0].innerHTML;
            }
            if (arguments.length === 1 && arguments[0] !== 'remove') {
                html = location;
                location = 'inner';
            }
    
            this.each(function (el) {
                var list, len, i, parent;
                switch (location) {
                case "inner":
                    if (typeof html == string) {
                        el.innerHTML = html;
                        list = el.getElementsByTagName('SCRIPT');
                        len = list.length;
                        for (i = 0; i < len; i++) {
                            eval(list[i].text);
                        }
                    } else {
                        el.innerHTML = '';
                        el.appendChild(html);
                    }
                    break;
                case "outer":
                    if (typeof html == string) {
                        html = wrap(html, getTag(el));
                    }
                    el.parentNode.replaceChild(html, el);
                    break;
                case "top":
                    if (typeof html == string) {
                        html = wrap(html, getTag(el));
                    }
                    el.insertBefore(html, el.firstChild);
                    break;
                case "bottom":
                    if (typeof html == string) {
                        html = wrap(html, getTag(el));
                    }
                    el.insertBefore(html, null);
                    break;
                case "remove":
                    parent = el.parentNode;
                    parent.removeChild(el);
                    break;
                case "before":
                    parent = el.parentNode;
                    if (typeof html == string) {
                        html = wrap(html, getTag(parent));
                    }
                    parent.insertBefore(html, el);
                    break;
                case "after":
                    parent = el.parentNode;
                    if (typeof html == string) {
                        html = wrap(html, getTag(parent));
                    }
                    parent.insertBefore(html, el.nextSibling);
                    break;
                }
            });
            return this;
        },
    
    
        /**
         * Removes all erronious nodes from the DOM.
         * 
         */
        clean: function () {
            var ns = /\S/;
            this.each(function (el) {
                var d = el,
                    n = d.firstChild,
                    ni = -1,
                    nx;
                while (n) {
                    nx = n.nextSibling;
                    if (n.nodeType === 3 && !ns.test(n.nodeValue)) {
                        d.removeChild(n);
                    } else { 
    					if(nx!=null && nx.data!=null) //added for IE Mobile compatibility
    					n.nodeIndex = ++ni;
                   }
    				n = nx;
                }
            });
            return this;
        },
    
        /**
         * Attribute getter/setter
         *
         */
        attr: function (attribute, val) {
            if (arguments.length === 2) {
                this.each(function (el) {
                    el.setAttribute(attribute, val);
                });
    
                return this;
            } else {
                var attrs = [];
                this.each(function (el) {
                    if (el.getAttribute(attribute) != null) {
                        attrs.push(el.getAttribute(attribute));
                    }
                });
                return attrs;
            }
        }
    // --
    });
    /**
     *
     * @namespace {Event}
     * @example
     *
     * Event
     * ---
     *	
     * A good old fashioned event handling system.
     * 
     */
    xui.extend({
        
        
        /**	
         *
         * Register callbacks to DOM events.
         * 
         * @param {Event} type The event identifier as a string.
         * @param {Function} fn The callback function to invoke when the event is raised.
         * @return self
         * @example
         * 
         * ### on
         * 
         * Registers a callback function to a DOM event on the element collection.
         * 
         * For more information see:
         * 
         * - http://developer.apple.com/webapps/docs/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/chapter_7_section_1.html#//apple_ref/doc/uid/TP40006511-SW1
         *
         * syntax:
         *
         *      x$('button').on( 'click', function(e){ alert('hey that tickles!') });
         * 
         * or
         * 
         *      x$('a.save').click(function(e){ alert('tee hee!') });
         *
         * arguments:
         *
         * - type:string the event to subscribe to click|load|etc
         * - fn:function a callback function to execute when the event is fired
         *
         * example:
         * 
         *      x$(window).load(function(e){
         *          x$('.save').touchstart( function(evt){ alert('tee hee!') }).css(background:'grey');	
         *      });
         * 
         */
        on: function (type, fn) {
            this.each(function (el) {
                if (window.addEventListener) {
                    el.addEventListener(type, fn, false);
                }
            });
            return this;
        }
    // --
    });
    /**
     *
     * @namespace {Fx}
     * @example
     *
     * Fx
     * ---
     * 
     * Animations, transforms and transitions for getting the most out of hardware accelerated CSS.
     * 
     */
    xui.extend({
    
        /**
         *
         * Tween is a method for transforming a css property to a new value.
         * 
         * @param {String} styles
         * @param {Object} options ({Int} duration, {Function} easing, {Function} after)
         * @return self
         * @example
         * 
         * ### tween
         * 
         * syntax:
         * 
         * x$(selector).tween(style, options);
         *
         * arguments:
         * 
         * - styles: String of CSS properties & values to tween
         * - options (optional): object to optionally specify duration, easing function, & callback
         *
         * example:
         *
         *    x$('#box').tween("left: 100px; backgroundColor: 'blue';");
         *    x$('#box').tween("left: 100px; backgroundColor: 'blue';", { after : function() { alert('done!'); } });
         *    x$('#box').tween("left: 100px;").tween(" left: 100px;");
         * 
         */
        tween: function (style, options) {
            // TODO make xui into emile options
            // TODO make queue
            return this.each(function (e) {
                emile(e, style, options);
            });
        }
    //---
    });
    /**
     *
     * @namespace {Style}
     * @example
     *
     * Style
     * ---
     *    
     * Anything related to how things look. Usually, this is CSS.
     * 
     */
    (function () {
    
        function hasClass(el, className) {
            return getClassRegEx(className).test(el.className);
        }
    
        function trim(text) {
            return (text || "").replace(rtrim, "");
        }
    
        xui.extend({
    
            /**
             * 
             * Sets a single CSS property to a new value.
             * 
             * @param {String} prop The property to set.
             * @param {String} val The value to set the property.
             * @return self
             * @example
             *
             * ### setStyle
             * 
             * syntax: 
             *
             *      x$(selector).setStyle(property, value);
             *
             * arguments: 
             *
             * - property:string the property to modify
             * - value:string the property value to set
             *
             * example:
             * 
             *      x$('.txt').setStyle('color', '#000');
             * 
             */
            setStyle: function (prop, val) {
                return this.each(function (el) {
                    el.style[prop] = val;
                });
            },
    
            /**
             * 
             * Retuns a single CSS property. Can also invoke a callback to perform more specific processing tasks related to the property value.
             * 
             * @param {String} prop The property to retrieve.
             * @param {Function} callback A callback function to invoke with the property value.
             * @return self if a callback is passed, otherwise the individual property requested
             * @example
             *
             * ### getStyle
             * 
             * syntax: 
             *
             *      x$(selector).getStyle(property, callback);
             *
             * arguments: 
             * 
             * - property:string a css key (for example, border-color NOT borderColor)
             * - callback:function (optional) a method to call on each element in the collection 
             *
             * example:
             *
             *      x$('ul#nav li.trunk').getStyle('font-size');
             *      x$('a.globalnav').getStyle( 'background', function (prop){ prop == 'blue' ? 'green' : 'blue' });
             *
             */
            getStyle: function (prop, callback) {
                var gs = function (el, p) {
                    return document.defaultView.getComputedStyle(el, "").getPropertyValue(p);
                };
    
                if (callback === undefined) {
                    return gs(this[0], prop);
                }
    
                return this.each(function (el) {
                    callback(gs(el, prop));
                });
            },
    
            /**
             *
             * Adds the classname to all the elements in the collection. 
             * 
             * @param {String} className The class name.
             * @return self
             * @example
             *
             * ### addClass
             *    
             * syntax:
             *
             *      $(selector).addClass(className);
             * 
             * arguments:
             *
             * - className:string the name of the CSS class to apply
             *
             * example:
             * 
             *      $('.foo').addClass('awesome');
             *
             */
            addClass: function (className) {
                return this.each(function (el) {
                    if (hasClass(el, className) === false) {
                        el.className = trim(el.className + ' ' + className);
                    }
                });
            },
            /**
             *
             * Checks to see if classname is one the element. If a callback isn't passed, hasClass expects only one element in collection
             * 
             * @param {String} className The class name.
             * @param {Function} callback A callback function (optional)
             * @return self if a callback is passed, otherwise true or false as to whether the element has the class
             * @example
             *
             * ### hasClass
             *    
             * syntax:
             *
             *      $(selector).hasClass('className');
             *      $(selector).hasClass('className', function (element) {});
             * 
             * arguments:
             *
             * - className:string the name of the CSS class to apply
             *
             * example:
             * 
             *      $('#foo').hasClass('awesome'); // returns true or false
             *      $('.foo').hasClass('awesome',function (e){}); // returns XUI object
             *
             */
            hasClass: function (className, callback) {
                if (callback === undefined && this.length === 1) {
                    return hasClass(this[0], this[0].className);
                }
    
                return this.each(function (el) {
                    if (hasClass(el, el.className)) {
                        callback(el);
                    }
                });
            },
    
            /**
             *
             * Removes the classname from all the elements in the collection. 
             * 
             * @param {String} className The class name.
             * @return self
             * @example
             *
             * ### removeClass
             * 
             * syntax:
             *
             *      x$(selector).removeClass(className);
             * 
             * arguments:
             *
             * - className:string the name of the CSS class to remove.
             *
             * example:
             * 
             *      x$('.bar').removeClass('awesome');
             * 
             */
            removeClass: function (className) {
                if (className === undefined) {
                    this.each(function (el) {
                        el.className = '';
                    });
                } else {
                    var re = getClassRegEx(className);
                    this.each(function (el) {
                        el.className = el.className.replace(re, '');
                    });
                }
                return this;
            },
    
    
            /**
             *
             * Set a number of CSS properties at once.
             * 
             * @param {Object} props An object literal of CSS properties and corosponding values.
             * @return self
             * @example
             *
             * ### css
             *
             * syntax: 
             *
             *      x$(selector).css(object);
             *
             * arguments: 
             *
             * - an object literal of css key/value pairs to set.
             *
             * example:
             * 
             *      x$('h2.fugly').css({ backgroundColor:'blue', color:'white', border:'2px solid red' });
             *  
             */
            css: function (o) {
                var that = this,
                    prop;
                
                for (prop in o) {
                    that.setStyle(prop, o[prop]);
                }
                return that;
            }
        // --
        });
    
        // RS: now that I've moved these out, they'll compress better, however, do these variables
        // need to be instance based - if it's regarding the DOM, I'm guessing it's better they're
        // global within the scope of xui
    
        // -- private methods -- //
        // Via jQuery - used to avoid el.className = ' foo';
        // Used for trimming whitespace
        var rtrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g,
            reClassNameCache = {},
            getClassRegEx = function (className) {
                var re = reClassNameCache[className];
                if (!re) {
                    re = new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)');
                    reClassNameCache[className] = re;
                }
                return re;
            };
    }());
    /**
     *
     * @namespace {Xhr}
     * @example
     *
     *
     * Xhr
     * ---
     *    
     * Remoting methods and utils. 
     * 
     */
    xui.extend({
        /**
         * 
         * The classic Xml Http Request sometimes also known as the Greek God: Ajax. Not to be confused with AJAX the cleaning agent. 
         * This method has a few new tricks. It is always invoked on an element collection and follows the identical behaviour as the
         * `html` method. If there no callback is defined the response text will be inserted into the elements in the collection. 
         * 
         * @param {location} location [inner|outer|top|bottom|before|after]
         * @param {String} url The URL to request.
         * @param {Object} options The method options including a callback function to invoke when the request returns. 
         * @return self
         * @example
         *    
         * ### xhr
    
         * syntax:
         *
         *    xhr(location, url, options)
         *
         * or this method will accept just a url with a default behavior of inner...
         *
         *    xhr(url, options);
         *
         * location
         * 
         * options:
         *
         * - method {String} [get|put|delete|post] Defaults to 'get'.
         * - async {Boolen} Asynchronous request. Defaults to false.
         * - data {String} A url encoded string of parameters to send.
         * - callback {Function} Called on 200 status (success)
         *
         * response 
         * - The response available to the callback function as 'this', it is not passed in. 
         * - this.reponseText will have the resulting data from the file.
         * 
         * example:
         *
         *    x$('#status').xhr('inner', '/status.html');
         *    x$('#status').xhr('outer', '/status.html');
         *    x$('#status').xhr('top',   '/status.html');
         *    x$('#status').xhr('bottom','/status.html');
         *    x$('#status').xhr('before','/status.html');
         *    x$('#status').xhr('after', '/status.html');
         *
         * or 
         *
         *    x$('#status').xhr('/status.html');
         * 
         *    x$('#left-panel').xhr('/panel', {callback:function(){ alert("All Done!") }});
         *
         *    x$('#left-panel').xhr('/panel', function(){ alert(this.responseText) }); 
         * 
         */
        xhr: function (location, url, options) {
        
            // this is to keep support for the old syntax (easy as that)
            if (!/^inner|outer|top|bottom|before|after$/.test(location)) {
                options = url;
                url = location;
                location = 'inner';
            }
            
            var o      = options ? options : {},
                that   = this,
                req    = new XMLHttpRequest(),
                method = o.method || 'get',
                async  = o.async || false,
                params = o.data || null,
                i, len;
            
            if (typeof options === "function") {
                o = {};
                o.callback = options;
            }
            
            req.queryString = params;
            req.open(method, url, async);
            
            if (o.headers) {
                for (i = 0, len = o.headers.length; i < len; i++) {
                    req.setRequestHeader(o.headers[i].name, o.headers[i].value);
                }
            }
            
            req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            
            req.onload = (o.callback) ? o.callback : function () { that.html(location, this.responseText); };
            
            if(method.toUpperCase() === 'POST') { 
                req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                req.send(params || "");
            } else {
                req.send();
            }
            
            return this;
        }
    // --
    });
        xui.extend({
        
    	/**
    	 * Adds more DOM nodes to the existing element list.
    	 */
    	add: function(q) {
    	  [].push.apply(this, [].slice.call(xui(q)));
    	  return this.set(this.reduce());
    	},
    
    	/**
    	 * Returns the first element in the collection.
    	 * 
    	 * @return Returns a single DOM element.
    	 */
    	first: function() {
    		return this.get(0);
    	},
    
    	/**
    	 * Returns the element in the collection at the 
    	 * given index
    	 *
    	 * @return Returns a single DOM element
    	 * */
    	get: function(index) {
    		return this[index];
    	},
    	
    	/**
    	 * Returns a collection containing the element
    	 * at the given index
    	 * */
    	eq: function(idx1,idx2) {
    		idx2 = idx2 ? idx2 + 1 : idx1 + 1;
    		return this.set([].slice.call(this, idx1, idx2));
    	},
    
    	/**
    	 * Returns the size of the collection
    	 *
    	 * @return Returns an integer size of collection (use xui.length instead)
    	 * */
    	size: function() {
    		return this.length;
    	}
    // --	
    });	
    "inner outer top bottom remove before after".split(' ').forEach(function (method) {
      xui.fn[method] = function (html) { return this.html(method, html); };
    });
    // private event functions
    (function () {
    
    var cache = {};
    
    /**
     *
     * @namespace {Event}
     * @example
     *
     * Event
     * ---
     *	
     * A good new skool fashioned event handling system.
     * 
     */
    xui.extend({
        /**
         *
         * Register callbacks to DOM events.
         * 
         * @param {Event} type The event identifier as a string.
         * @param {Function} callback The callback function to invoke when the event is raised.
         * @return self
         * @example
         * 
         * ### on
         * 
         * Registers a callback function to a DOM event on the element collection.
         * 
         * This method has shortcut aliases for: 
         *
         * - click
         * - load
         * - touchstart
         * - touchmove
         * - touchend
         * - touchcancel
         * - gesturestart
         * - gesturechange
         * - gestureend
         * - orientationchange
         *
         * For more information see:
         * 
         * - http://developer.apple.com/webapps/docs/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/chapter_7_section_1.html#//apple_ref/doc/uid/TP40006511-SW1
         *
         * syntax:
         *
         *      x$('button').on( 'click', function(e){ alert('hey that tickles!') });
         * 
         * or...
         * 
         *      x$('a.save').click(function(e){ alert('tee hee!') });
         *
         * arguments:
         *
         * - type:string the event to subscribe to click|load|etc
         * - fn:function a callback function to execute when the event is fired
         *
         * example:
         * 
         *      x$(window).load(function(e){
         *          x$('.save').touchstart( function(evt){ alert('tee hee!') }).css(background:'grey');	
         *      });
         * 
         */
         
        on: function(type, fn) {
            return this.each(function (el) {
                el.addEventListener(type, _createResponder(el, type, fn), false);
            });
        },
        
        un: function(type) {
            var that = this;
            return this.each(function (el) {
                var id = _getEventID(el), responders = _getRespondersForEvent(id, type), i = responders.length;
    
                while (i--) {
                    el.removeEventListener(type, responders[i], false);
                }
    
                delete cache[id];
            });
        },
        
        fire: function (type, data) {
            return this.each(function (el) {
                if (el == document && !el.dispatchEvent) {
                    el = document.documentElement;
                }
    
                var event = document.createEvent('HTMLEvents');
                    event.initEvent(type, true, true);
                    event.data = data || {};
                    event.eventName = type;
                
                el.dispatchEvent(event);
            });
        }
    //---
    });
    
    // lifted from Prototype's (big P) event model
    function _getEventID(element) {
        if (element._xuiEventID) { return element._xuiEventID[0]; }
        return (element._xuiEventID = [++_getEventID.id]);
    }
    
    _getEventID.id = 1;
    
    function _getRespondersForEvent(id, eventName) {
        var c = cache[id] = cache[id] || {};
        return (c[eventName] = c[eventName] || []);
    }
    
    function _createResponder(element, eventName, handler) {
        var id = _getEventID(element), 
            r = _getRespondersForEvent(id, eventName),
            responder = function(event) {
                if (handler.call(element, event) === false) {
                    event.preventDefault();
                    event.stopPropagation();
                } 
            };
        
        responder.handler = handler;
        r.push(responder);
        return responder;
    }
    
    "click load submit touchstart touchmove touchend touchcancel gesturestart gesturechange gestureend orientationchange".split(' ').forEach(function (event) {
        xui.fn[event] = function (fn) { 
            return fn ? this.on(event, fn) : this.fire(event);
        };
    });
    
    }());
    /**
     *
     * @namespace {Form}
     * @example
     *
     *
     * Form
     * ---
     *	
     * Form related
     * 
     */
    xui.extend({
        /**
         * 
         * This method is private, it takes a form element and returns a string
         * 
         * @param {Element} form
         * @return encoded querystring
         * 
         */
        _toQueryString: function (docForm) {
            var submitString = '',
                formElement = '',
                lastElementName = '',
                length = docForm.length,
                i;
            
            for (i = 0 ; i < length ; i++) {
                formElement = docForm[i];
                switch (formElement.type) {
                case 'text' :
                case 'select-one' :
                case 'hidden' :
                case 'password' :
                case 'textarea' :
                    submitString += formElement.name + '=' + encodeURIComponent(formElement.value) + '&'; 
                    break; 
                case 'radio' :
                    if (formElement.checked) { 
                        submitString += formElement.name + '=' + encodeURIComponent(formElement.value) + '&'; 
                    } 
                    break; 
                case 'checkbox' :
                    if (formElement.checked)  {
                        if (formElement.name == lastElementName) {
                            if (submitString.lastIndexOf('&') === submitString.length - 1) { 
                                submitString = submitString.substring(0, submitString.length - 1); 
                            } 
                            submitString += ',' + encodeURIComponent(formElement.value); 
                        } else { 
                            submitString += formElement.name + '=' + encodeURIComponent(formElement.value);  
                        } 
                        submitString += '&'; 
                        lastElementName = formElement.name; 
                    } 
                    break;  
                }
            } 
            submitString = submitString.substring(0, submitString.length - 1); 
            return submitString;
        }
    // --
    });
    xui.extend({
        nativeAnimate: function (options, callback) {
            this.animationStack = [];
            if (options instanceof Array) {
                for (var i = 0; i < options.length; i++) {
                    this.animationStack.push(options[i]);
                }
            } else if (options instanceof Object) {
                this.animationStack.push(options);
            }
    
            this.start(callback);
            return this;
        },
    
        // -- private -- //
    
        // TODO move these methods into the tween method
        animationStack: [],
    
        start: function (callback) {
            var t = 0,
                len = this.animationStack.length,
                i, options, duration;
            
            for (i = 0; i < this.animationStack.length; i++) {
                options = this.animationStack[i];
                duration = options.duration === undefined ? 0.5 : options.duration;
                // We use setTimeout to stage the animations.
                window.setTimeout(function (s, o, i) {
                    s.animate(o);
                    if ((i === len - 1) && callback && typeof(callback) === 'function') {
                        callback();
                    }
                }, t * 1000 * duration, this, options, i);
                t += duration;
            }
    
            return this;
        },
      
        animate: function (options) {   
            var that = this,
                opt_after = options.after,
                easing = (options.easing === undefined) ? 'ease-in' : options.easing,
                before = (options.before === undefined) ? function () {} : options.before,
                after = (opt_after === undefined) ? function () {} : function () { opt_after.apply(that); },
                duration = (options.duration === undefined) ? 0.5 : options.duration,
                translate = options.by,
                rotate = options.rotate;
                
            options.easing = options.rotate = options.by = options.before = options.after = options.duration = undefined;
            before.apply(before.arguments);
       
            // this sets duration and easing equation on a style property change
            this.setStyle('-webkit-transition', 'all ' + duration + 's ' + easing);
       
            // sets the starting point and ending point for each css property tween
            this.each(function (el) {
                for (var prop in options) {
                    that.setStyle(prop, options[prop]);
                }
        
                if (translate) {
                    that.setStyle('-webkit-transform', that.translateOp(translate[0], translate[1]));
                }
                
                if (rotate) {
                    that.setStyle('-webkit-transform', that.rotateOp(rotate[0], rotate[1]));
                }
            });
    
            window.setTimeout(function () { that.setStyle('-webkit-transition', 'none'); }, duration * 1000);
            window.setTimeout(function () { that.setStyle('-webkit-transform', 'none'); }, duration * 1000);
            window.setTimeout(after, duration * 1000);
    
            return this || that; // haha
        },
        
        translateOp: function (xPixels, yPixels) {
            return 'translate(' + xPixels + 'px, ' + yPixels + 'px)';
        },
        
        rotateOp: function (axis, degree) {
            return 'rotate' + axis.toUpperCase() + '(' + degree + 'deg)';
        }
    // --
    });xui.extend({
        xhrInner: function (url) {
            return this.xhr('inner', url);
        },
        xhrOuter: function (url) {
            return this.xhr('outer', url);
        },
        xhrTop: function (url) {
            return this.xhr('top', url);
        },
        xhrBottom: function (url) {
            return this.xhr('bottom', url);
        },
        xhrBefore: function (url) {
            return this.xhr('before', url);
        },
        xhrAfter: function (url) {
            return this.xhr('after', url);
        },
    
        /**
         * 
         * Another twist on remoting: lightweight and unobtrusive DOM databinding. Since we are often talking to a server with 
         * handy JSON objects we added the convienance the map property which allows you to map JSON nodes to DOM elements. 
         * 
         * @param {String} url The URL to request.
         * @param {Object} options The method options including a callback function to invoke when the request returns. 
         * @return self
         * @example
         * 
         * ### xhrjson 
         *
         * syntax:
         *
         *      xhrjson(url, options);
         * 
         * example:
         *  
         * The available options are the same as the xhr method with the addition of map. 
         * 
         *      x$('#user').xhrjson( '/users/1.json', {map:{'username':'#name', 'image_url':'img#avatar[@src]'} });
         * 
         */
        xhrjson: function (url, options) {
            var that = this,
                cb = (typeof cb !== 'function') ? function (x) { return x; } : options.callback,
            callback = function () {
                var o = eval('(' + this.responseText + ')'),
                    prop;
                for (prop in o) {
                    xui(options.map[prop]).html(cb(o[prop]));
                }
            };
            
            options.callback = callback;
            this.xhr(url, options);
            return this;
        }
    // --
    });
        // emile.js (c) 2009 Thomas Fuchs
    // Licensed under the terms of the MIT license.
    
    (function(emile, container){
      var parseEl = document.createElement('div'),
        props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth '+
        'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize '+
        'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight '+
        'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft '+
        'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' ');
    
      function interpolate(source,target,pos){ return (source+(target-source)*pos).toFixed(3); }
      function s(str, p, c){ return str.substr(p,c||1); }
      function color(source,target,pos){
        var i = 2, j, c, tmp, v = [], r = [];
        while(j=3,c=arguments[i-1],i--)
          if(s(c,0)=='r') { c = c.match(/\d+/g); while(j--) v.push(~~c[j]); } else {
            if(c.length==4) c='#'+s(c,1)+s(c,1)+s(c,2)+s(c,2)+s(c,3)+s(c,3);
            while(j--) v.push(parseInt(s(c,1+j*2,2), 16)); }
        while(j--) { tmp = ~~(v[j+3]+(v[j]-v[j+3])*pos); r.push(tmp<0?0:tmp>255?255:tmp); }
        return 'rgb('+r.join(',')+')';
      }
      
      function parse(prop){
        var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'');
        return isNaN(p) ? { v: q, f: color, u: ''} : { v: p, f: interpolate, u: q };
      }
      
      function normalize(style){
        var css, rules = {}, i = props.length, v;
        parseEl.innerHTML = '<div style="'+style+'"></div>';
        css = parseEl.childNodes[0].style;
        while(i--) if(v = css[props[i]]) rules[props[i]] = parse(v);
        return rules;
      }  
      
      container[emile] = function(el, style, opts){
        el = typeof el == 'string' ? document.getElementById(el) : el;
        opts = opts || {};
        var target = normalize(style), comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
          prop, current = {}, start = +new Date, dur = opts.duration||200, finish = start+dur, interval,
          easing = opts.easing || function(pos){ return (-Math.cos(pos*Math.PI)/2) + 0.5; };
        for(prop in target) current[prop] = parse(comp[prop]);
        interval = setInterval(function(){
          var time = +new Date, pos = time>finish ? 1 : (time-start)/dur;
          for(prop in target)
            el.style[prop] = target[prop].f(current[prop].v,target[prop].v,easing(pos)) + target[prop].u;
          if(time>finish) { clearInterval(interval); opts.after && opts.after(); }
        },10);
      }
    })('emile', this);    /*!
     * Sizzle CSS Selector Engine - v1.0
     *  Copyright 2009, The Dojo Foundation
     *  Released under the MIT, BSD, and GPL Licenses.
     *  More information: http://sizzlejs.com/
     */
    (function(){
    
    var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
    	done = 0,
    	toString = Object.prototype.toString,
    	hasDuplicate = false,
    	baseHasDuplicate = true;
    
    // Here we check if the JavaScript engine is using some sort of
    // optimization where it does not always call our comparision
    // function. If that is the case, discard the hasDuplicate value.
    //   Thus far that includes Google Chrome.
    [0, 0].sort(function(){
    	baseHasDuplicate = false;
    	return 0;
    });
    
    var Sizzle = function(selector, context, results, seed) {
    	results = results || [];
    	context = context || document;
    
    	var origContext = context;
    
    	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
    		return [];
    	}
    	
    	if ( !selector || typeof selector !== "string" ) {
    		return results;
    	}
    
    	var parts = [], m, set, checkSet, extra, prune = true, contextXML = isXML(context),
    		soFar = selector, ret, cur, pop, i;
    	
    	// Reset the position of the chunker regexp (start from head)
    	do {
    		chunker.exec("");
    		m = chunker.exec(soFar);
    
    		if ( m ) {
    			soFar = m[3];
    		
    			parts.push( m[1] );
    		
    			if ( m[2] ) {
    				extra = m[3];
    				break;
    			}
    		}
    	} while ( m );
    
    	if ( parts.length > 1 && origPOS.exec( selector ) ) {
    		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
    			set = posProcess( parts[0] + parts[1], context );
    		} else {
    			set = Expr.relative[ parts[0] ] ?
    				[ context ] :
    				Sizzle( parts.shift(), context );
    
    			while ( parts.length ) {
    				selector = parts.shift();
    
    				if ( Expr.relative[ selector ] ) {
    					selector += parts.shift();
    				}
    				
    				set = posProcess( selector, set );
    			}
    		}
    	} else {
    		// Take a shortcut and set the context if the root selector is an ID
    		// (but not if it'll be faster if the inner selector is an ID)
    		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
    				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
    			ret = Sizzle.find( parts.shift(), context, contextXML );
    			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
    		}
    
    		if ( context ) {
    			ret = seed ?
    				{ expr: parts.pop(), set: makeArray(seed) } :
    				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
    			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;
    
    			if ( parts.length > 0 ) {
    				checkSet = makeArray(set);
    			} else {
    				prune = false;
    			}
    
    			while ( parts.length ) {
    				cur = parts.pop();
    				pop = cur;
    
    				if ( !Expr.relative[ cur ] ) {
    					cur = "";
    				} else {
    					pop = parts.pop();
    				}
    
    				if ( pop == null ) {
    					pop = context;
    				}
    
    				Expr.relative[ cur ]( checkSet, pop, contextXML );
    			}
    		} else {
    			checkSet = parts = [];
    		}
    	}
    
    	if ( !checkSet ) {
    		checkSet = set;
    	}
    
    	if ( !checkSet ) {
    		Sizzle.error( cur || selector );
    	}
    
    	if ( toString.call(checkSet) === "[object Array]" ) {
    		if ( !prune ) {
    			results.push.apply( results, checkSet );
    		} else if ( context && context.nodeType === 1 ) {
    			for ( i = 0; checkSet[i] != null; i++ ) {
    				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
    					results.push( set[i] );
    				}
    			}
    		} else {
    			for ( i = 0; checkSet[i] != null; i++ ) {
    				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
    					results.push( set[i] );
    				}
    			}
    		}
    	} else {
    		makeArray( checkSet, results );
    	}
    
    	if ( extra ) {
    		Sizzle( extra, origContext, results, seed );
    		Sizzle.uniqueSort( results );
    	}
    
    	return results;
    };
    
    Sizzle.uniqueSort = function(results){
    	if ( sortOrder ) {
    		hasDuplicate = baseHasDuplicate;
    		results.sort(sortOrder);
    
    		if ( hasDuplicate ) {
    			for ( var i = 1; i < results.length; i++ ) {
    				if ( results[i] === results[i-1] ) {
    					results.splice(i--, 1);
    				}
    			}
    		}
    	}
    
    	return results;
    };
    
    Sizzle.matches = function(expr, set){
    	return Sizzle(expr, null, null, set);
    };
    
    Sizzle.find = function(expr, context, isXML){
    	var set;
    
    	if ( !expr ) {
    		return [];
    	}
    
    	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
    		var type = Expr.order[i], match;
    		
    		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
    			var left = match[1];
    			match.splice(1,1);
    
    			if ( left.substr( left.length - 1 ) !== "\\" ) {
    				match[1] = (match[1] || "").replace(/\\/g, "");
    				set = Expr.find[ type ]( match, context, isXML );
    				if ( set != null ) {
    					expr = expr.replace( Expr.match[ type ], "" );
    					break;
    				}
    			}
    		}
    	}
    
    	if ( !set ) {
    		set = context.getElementsByTagName("*");
    	}
    
    	return {set: set, expr: expr};
    };
    
    Sizzle.filter = function(expr, set, inplace, not){
    	var old = expr, result = [], curLoop = set, match, anyFound,
    		isXMLFilter = set && set[0] && isXML(set[0]);
    
    	while ( expr && set.length ) {
    		for ( var type in Expr.filter ) {
    			if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
    				var filter = Expr.filter[ type ], found, item, left = match[1];
    				anyFound = false;
    
    				match.splice(1,1);
    
    				if ( left.substr( left.length - 1 ) === "\\" ) {
    					continue;
    				}
    
    				if ( curLoop === result ) {
    					result = [];
    				}
    
    				if ( Expr.preFilter[ type ] ) {
    					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );
    
    					if ( !match ) {
    						anyFound = found = true;
    					} else if ( match === true ) {
    						continue;
    					}
    				}
    
    				if ( match ) {
    					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
    						if ( item ) {
    							found = filter( item, match, i, curLoop );
    							var pass = not ^ !!found;
    
    							if ( inplace && found != null ) {
    								if ( pass ) {
    									anyFound = true;
    								} else {
    									curLoop[i] = false;
    								}
    							} else if ( pass ) {
    								result.push( item );
    								anyFound = true;
    							}
    						}
    					}
    				}
    
    				if ( found !== undefined ) {
    					if ( !inplace ) {
    						curLoop = result;
    					}
    
    					expr = expr.replace( Expr.match[ type ], "" );
    
    					if ( !anyFound ) {
    						return [];
    					}
    
    					break;
    				}
    			}
    		}
    
    		// Improper expression
    		if ( expr === old ) {
    			if ( anyFound == null ) {
    				Sizzle.error( expr );
    			} else {
    				break;
    			}
    		}
    
    		old = expr;
    	}
    
    	return curLoop;
    };
    
    Sizzle.error = function( msg ) {
    	throw "Syntax error, unrecognized expression: " + msg;
    };
    
    var Expr = Sizzle.selectors = {
    	order: [ "ID", "NAME", "TAG" ],
    	match: {
    		ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
    		CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
    		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
    		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
    		TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
    		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+\-]*)\))?/,
    		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
    		PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
    	},
    	leftMatch: {},
    	attrMap: {
    		"class": "className",
    		"for": "htmlFor"
    	},
    	attrHandle: {
    		href: function(elem){
    			return elem.getAttribute("href");
    		}
    	},
    	relative: {
    		"+": function(checkSet, part){
    			var isPartStr = typeof part === "string",
    				isTag = isPartStr && !/\W/.test(part),
    				isPartStrNotTag = isPartStr && !isTag;
    
    			if ( isTag ) {
    				part = part.toLowerCase();
    			}
    
    			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
    				if ( (elem = checkSet[i]) ) {
    					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}
    
    					checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
    						elem || false :
    						elem === part;
    				}
    			}
    
    			if ( isPartStrNotTag ) {
    				Sizzle.filter( part, checkSet, true );
    			}
    		},
    		">": function(checkSet, part){
    			var isPartStr = typeof part === "string",
    				elem, i = 0, l = checkSet.length;
    
    			if ( isPartStr && !/\W/.test(part) ) {
    				part = part.toLowerCase();
    
    				for ( ; i < l; i++ ) {
    					elem = checkSet[i];
    					if ( elem ) {
    						var parent = elem.parentNode;
    						checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
    					}
    				}
    			} else {
    				for ( ; i < l; i++ ) {
    					elem = checkSet[i];
    					if ( elem ) {
    						checkSet[i] = isPartStr ?
    							elem.parentNode :
    							elem.parentNode === part;
    					}
    				}
    
    				if ( isPartStr ) {
    					Sizzle.filter( part, checkSet, true );
    				}
    			}
    		},
    		"": function(checkSet, part, isXML){
    			var doneName = done++, checkFn = dirCheck, nodeCheck;
    
    			if ( typeof part === "string" && !/\W/.test(part) ) {
    				part = part.toLowerCase();
    				nodeCheck = part;
    				checkFn = dirNodeCheck;
    			}
    
    			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
    		},
    		"~": function(checkSet, part, isXML){
    			var doneName = done++, checkFn = dirCheck, nodeCheck;
    
    			if ( typeof part === "string" && !/\W/.test(part) ) {
    				part = part.toLowerCase();
    				nodeCheck = part;
    				checkFn = dirNodeCheck;
    			}
    
    			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
    		}
    	},
    	find: {
    		ID: function(match, context, isXML){
    			if ( typeof context.getElementById !== "undefined" && !isXML ) {
    				var m = context.getElementById(match[1]);
    				return m ? [m] : [];
    			}
    		},
    		NAME: function(match, context){
    			if ( typeof context.getElementsByName !== "undefined" ) {
    				var ret = [], results = context.getElementsByName(match[1]);
    
    				for ( var i = 0, l = results.length; i < l; i++ ) {
    					if ( results[i].getAttribute("name") === match[1] ) {
    						ret.push( results[i] );
    					}
    				}
    
    				return ret.length === 0 ? null : ret;
    			}
    		},
    		TAG: function(match, context){
    			return context.getElementsByTagName(match[1]);
    		}
    	},
    	preFilter: {
    		CLASS: function(match, curLoop, inplace, result, not, isXML){
    			match = " " + match[1].replace(/\\/g, "") + " ";
    
    			if ( isXML ) {
    				return match;
    			}
    
    			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
    				if ( elem ) {
    					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n]/g, " ").indexOf(match) >= 0) ) {
    						if ( !inplace ) {
    							result.push( elem );
    						}
    					} else if ( inplace ) {
    						curLoop[i] = false;
    					}
    				}
    			}
    
    			return false;
    		},
    		ID: function(match){
    			return match[1].replace(/\\/g, "");
    		},
    		TAG: function(match, curLoop){
    			return match[1].toLowerCase();
    		},
    		CHILD: function(match){
    			if ( match[1] === "nth" ) {
    				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
    				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
    					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
    					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);
    
    				// calculate the numbers (first)n+(last) including if they are negative
    				match[2] = (test[1] + (test[2] || 1)) - 0;
    				match[3] = test[3] - 0;
    			}
    
    			// TODO: Move to normal caching system
    			match[0] = done++;
    
    			return match;
    		},
    		ATTR: function(match, curLoop, inplace, result, not, isXML){
    			var name = match[1].replace(/\\/g, "");
    			
    			if ( !isXML && Expr.attrMap[name] ) {
    				match[1] = Expr.attrMap[name];
    			}
    
    			if ( match[2] === "~=" ) {
    				match[4] = " " + match[4] + " ";
    			}
    
    			return match;
    		},
    		PSEUDO: function(match, curLoop, inplace, result, not){
    			if ( match[1] === "not" ) {
    				// If we're dealing with a complex expression, or a simple one
    				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
    					match[3] = Sizzle(match[3], null, null, curLoop);
    				} else {
    					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
    					if ( !inplace ) {
    						result.push.apply( result, ret );
    					}
    					return false;
    				}
    			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
    				return true;
    			}
    			
    			return match;
    		},
    		POS: function(match){
    			match.unshift( true );
    			return match;
    		}
    	},
    	filters: {
    		enabled: function(elem){
    			return elem.disabled === false && elem.type !== "hidden";
    		},
    		disabled: function(elem){
    			return elem.disabled === true;
    		},
    		checked: function(elem){
    			return elem.checked === true;
    		},
    		selected: function(elem){
    			// Accessing this property makes selected-by-default
    			// options in Safari work properly
    			elem.parentNode.selectedIndex;
    			return elem.selected === true;
    		},
    		parent: function(elem){
    			return !!elem.firstChild;
    		},
    		empty: function(elem){
    			return !elem.firstChild;
    		},
    		has: function(elem, i, match){
    			return !!Sizzle( match[3], elem ).length;
    		},
    		header: function(elem){
    			return (/h\d/i).test( elem.nodeName );
    		},
    		text: function(elem){
    			return "text" === elem.type;
    		},
    		radio: function(elem){
    			return "radio" === elem.type;
    		},
    		checkbox: function(elem){
    			return "checkbox" === elem.type;
    		},
    		file: function(elem){
    			return "file" === elem.type;
    		},
    		password: function(elem){
    			return "password" === elem.type;
    		},
    		submit: function(elem){
    			return "submit" === elem.type;
    		},
    		image: function(elem){
    			return "image" === elem.type;
    		},
    		reset: function(elem){
    			return "reset" === elem.type;
    		},
    		button: function(elem){
    			return "button" === elem.type || elem.nodeName.toLowerCase() === "button";
    		},
    		input: function(elem){
    			return (/input|select|textarea|button/i).test(elem.nodeName);
    		}
    	},
    	setFilters: {
    		first: function(elem, i){
    			return i === 0;
    		},
    		last: function(elem, i, match, array){
    			return i === array.length - 1;
    		},
    		even: function(elem, i){
    			return i % 2 === 0;
    		},
    		odd: function(elem, i){
    			return i % 2 === 1;
    		},
    		lt: function(elem, i, match){
    			return i < match[3] - 0;
    		},
    		gt: function(elem, i, match){
    			return i > match[3] - 0;
    		},
    		nth: function(elem, i, match){
    			return match[3] - 0 === i;
    		},
    		eq: function(elem, i, match){
    			return match[3] - 0 === i;
    		}
    	},
    	filter: {
    		PSEUDO: function(elem, match, i, array){
    			var name = match[1], filter = Expr.filters[ name ];
    
    			if ( filter ) {
    				return filter( elem, i, match, array );
    			} else if ( name === "contains" ) {
    				return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;
    			} else if ( name === "not" ) {
    				var not = match[3];
    
    				for ( var j = 0, l = not.length; j < l; j++ ) {
    					if ( not[j] === elem ) {
    						return false;
    					}
    				}
    
    				return true;
    			} else {
    				Sizzle.error( "Syntax error, unrecognized expression: " + name );
    			}
    		},
    		CHILD: function(elem, match){
    			var type = match[1], node = elem;
    			switch (type) {
    				case 'only':
    				case 'first':
    					while ( (node = node.previousSibling) )	 {
    						if ( node.nodeType === 1 ) { 
    							return false; 
    						}
    					}
    					if ( type === "first" ) { 
    						return true; 
    					}
    					node = elem;
    				case 'last':
    					while ( (node = node.nextSibling) )	 {
    						if ( node.nodeType === 1 ) { 
    							return false; 
    						}
    					}
    					return true;
    				case 'nth':
    					var first = match[2], last = match[3];
    
    					if ( first === 1 && last === 0 ) {
    						return true;
    					}
    					
    					var doneName = match[0],
    						parent = elem.parentNode;
    	
    					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
    						var count = 0;
    						for ( node = parent.firstChild; node; node = node.nextSibling ) {
    							if ( node.nodeType === 1 ) {
    								node.nodeIndex = ++count;
    							}
    						} 
    						parent.sizcache = doneName;
    					}
    					
    					var diff = elem.nodeIndex - last;
    					if ( first === 0 ) {
    						return diff === 0;
    					} else {
    						return ( diff % first === 0 && diff / first >= 0 );
    					}
    			}
    		},
    		ID: function(elem, match){
    			return elem.nodeType === 1 && elem.getAttribute("id") === match;
    		},
    		TAG: function(elem, match){
    			return (match === "*" && elem.nodeType === 1) || elem.nodeName.toLowerCase() === match;
    		},
    		CLASS: function(elem, match){
    			return (" " + (elem.className || elem.getAttribute("class")) + " ")
    				.indexOf( match ) > -1;
    		},
    		ATTR: function(elem, match){
    			var name = match[1],
    				result = Expr.attrHandle[ name ] ?
    					Expr.attrHandle[ name ]( elem ) :
    					elem[ name ] != null ?
    						elem[ name ] :
    						elem.getAttribute( name ),
    				value = result + "",
    				type = match[2],
    				check = match[4];
    
    			return result == null ?
    				type === "!=" :
    				type === "=" ?
    				value === check :
    				type === "*=" ?
    				value.indexOf(check) >= 0 :
    				type === "~=" ?
    				(" " + value + " ").indexOf(check) >= 0 :
    				!check ?
    				value && result !== false :
    				type === "!=" ?
    				value !== check :
    				type === "^=" ?
    				value.indexOf(check) === 0 :
    				type === "$=" ?
    				value.substr(value.length - check.length) === check :
    				type === "|=" ?
    				value === check || value.substr(0, check.length + 1) === check + "-" :
    				false;
    		},
    		POS: function(elem, match, i, array){
    			var name = match[2], filter = Expr.setFilters[ name ];
    
    			if ( filter ) {
    				return filter( elem, i, match, array );
    			}
    		}
    	}
    };
    
    var origPOS = Expr.match.POS,
    	fescape = function(all, num){
    		return "\\" + (num - 0 + 1);
    	};
    
    for ( var type in Expr.match ) {
    	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
    	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
    }
    
    var makeArray = function(array, results) {
    	array = Array.prototype.slice.call( convert, 0 );
    
    	if ( results ) {
    		results.push.apply( results, array );
    		return results;
    	}
    	
    	return array;
    };
    
    // Perform a simple check to determine if the browser is capable of
    // converting a NodeList to an array using builtin methods.
    // Also verifies that the returned array holds DOM nodes
    // (which is not the case in the Blackberry browser)
    try {
    	Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;
    // Provide a fallback method if it does not work
    } catch(e){
    	makeArray = function(array, results) {
    		var ret = results || [], i = 0;
    
    		if ( toString.call(array) === "[object Array]" ) {
    			Array.prototype.push.apply( ret, array );
    		} else {
    			if ( typeof array.length === "number" ) {
    				for ( var l = array.length; i < l; i++ ) {
    					ret.push( array[i] );
    				}
    			} else {
    				for ( ; array[i]; i++ ) {
    					ret.push( array[i] );
    				}
    			}
    		}
    
    		return ret;
    	};
    }
    
    var sortOrder;
    
    if ( document.documentElement.compareDocumentPosition ) {
    	sortOrder = function( a, b ) {
    		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
    			if ( a == b ) {
    				hasDuplicate = true;
    			}
    			return a.compareDocumentPosition ? -1 : 1;
    		}
    
    		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
    		if ( ret === 0 ) {
    			hasDuplicate = true;
    		}
    		return ret;
    	};
    } else if ( "sourceIndex" in document.documentElement ) {
    	sortOrder = function( a, b ) {
    		if ( !a.sourceIndex || !b.sourceIndex ) {
    			if ( a == b ) {
    				hasDuplicate = true;
    			}
    			return a.sourceIndex ? -1 : 1;
    		}
    
    		var ret = a.sourceIndex - b.sourceIndex;
    		if ( ret === 0 ) {
    			hasDuplicate = true;
    		}
    		return ret;
    	};
    } else if ( document.createRange ) {
    	sortOrder = function( a, b ) {
    		if ( !a.ownerDocument || !b.ownerDocument ) {
    			if ( a == b ) {
    				hasDuplicate = true;
    			}
    			return a.ownerDocument ? -1 : 1;
    		}
    
    		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
    		aRange.setStart(a, 0);
    		aRange.setEnd(a, 0);
    		bRange.setStart(b, 0);
    		bRange.setEnd(b, 0);
    		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
    		if ( ret === 0 ) {
    			hasDuplicate = true;
    		}
    		return ret;
    	};
    }
    
    // Utility function for retreiving the text value of an array of DOM nodes
    function getText( elems ) {
    	var ret = "", elem;
    
    	for ( var i = 0; elems[i]; i++ ) {
    		elem = elems[i];
    
    		// Get the text from text nodes and CDATA nodes
    		if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
    			ret += elem.nodeValue;
    
    		// Traverse everything else, except comment nodes
    		} else if ( elem.nodeType !== 8 ) {
    			ret += getText( elem.childNodes );
    		}
    	}
    
    	return ret;
    }
    
    // Check to see if the browser returns elements by name when
    // querying by getElementById (and provide a workaround)
    (function(){
    	// We're going to inject a fake input element with a specified name
    	var form = document.createElement("div"),
    		id = "script" + (new Date()).getTime();
    	form.innerHTML = "<a name='" + id + "'/>";
    
    	// Inject it into the root element, check its status, and remove it quickly
    	var root = document.documentElement;
    	root.insertBefore( form, root.firstChild );
    
    	// The workaround has to do additional checks after a getElementById
    	// Which slows things down for other browsers (hence the branching)
    	if ( document.getElementById( id ) ) {
    		Expr.find.ID = function(match, context, isXML){
    			if ( typeof context.getElementById !== "undefined" && !isXML ) {
    				var m = context.getElementById(match[1]);
    				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
    			}
    		};
    
    		Expr.filter.ID = function(elem, match){
    			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
    			return elem.nodeType === 1 && node && node.nodeValue === match;
    		};
    	}
    
    	root.removeChild( form );
    	root = form = null; // release memory in IE
    })();
    
    (function(){
    	// Check to see if the browser returns only elements
    	// when doing getElementsByTagName("*")
    
    	// Create a fake element
    	var div = document.createElement("div");
    	div.appendChild( document.createComment("") );
    
    	// Make sure no comments are found
    	if ( div.getElementsByTagName("*").length > 0 ) {
    		Expr.find.TAG = function(match, context){
    			var results = context.getElementsByTagName(match[1]);
    
    			// Filter out possible comments
    			if ( match[1] === "*" ) {
    				var tmp = [];
    
    				for ( var i = 0; results[i]; i++ ) {
    					if ( results[i].nodeType === 1 ) {
    						tmp.push( results[i] );
    					}
    				}
    
    				results = tmp;
    			}
    
    			return results;
    		};
    	}
    
    	// Check to see if an attribute returns normalized href attributes
    	div.innerHTML = "<a href='#'></a>";
    	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
    			div.firstChild.getAttribute("href") !== "#" ) {
    		Expr.attrHandle.href = function(elem){
    			return elem.getAttribute("href", 2);
    		};
    	}
    
    	div = null; // release memory in IE
    })();
    
    if ( document.querySelectorAll ) {
    	(function(){
    		var oldSizzle = Sizzle, div = document.createElement("div");
    		div.innerHTML = "<p class='TEST'></p>";
    
    		// Safari can't handle uppercase or unicode characters when
    		// in quirks mode.
    		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
    			return;
    		}
    	
    		Sizzle = function(query, context, extra, seed){
    			context = context || document;
    
    			// Only use querySelectorAll on non-XML documents
    			// (ID selectors don't work in non-HTML documents)
    			if ( !seed && context.nodeType === 9 && !isXML(context) ) {
    				try {
    					return makeArray( context.querySelectorAll(query), extra );
    				} catch(e){}
    			}
    		
    			return oldSizzle(query, context, extra, seed);
    		};
    
    		for ( var prop in oldSizzle ) {
    			Sizzle[ prop ] = oldSizzle[ prop ];
    		}
    
    		div = null; // release memory in IE
    	})();
    }
    
    (function(){
    	var div = document.createElement("div");
    
    	div.innerHTML = "<div class='test e'></div><div class='test'></div>";
    
    	// Opera can't find a second classname (in 9.6)
    	// Also, make sure that getElementsByClassName actually exists
    	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
    		return;
    	}
    
    	// Safari caches class attributes, doesn't catch changes (in 3.2)
    	div.lastChild.className = "e";
    
    	if ( div.getElementsByClassName("e").length === 1 ) {
    		return;
    	}
    	
    	Expr.order.splice(1, 0, "CLASS");
    	Expr.find.CLASS = function(match, context, isXML) {
    		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
    			return context.getElementsByClassName(match[1]);
    		}
    	};
    
    	div = null; // release memory in IE
    })();
    
    function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
    	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
    		var elem = checkSet[i];
    		if ( elem ) {
    			elem = elem[dir];
    			var match = false;
    
    			while ( elem ) {
    				if ( elem.sizcache === doneName ) {
    					match = checkSet[elem.sizset];
    					break;
    				}
    
    				if ( elem.nodeType === 1 && !isXML ){
    					elem.sizcache = doneName;
    					elem.sizset = i;
    				}
    
    				if ( elem.nodeName.toLowerCase() === cur ) {
    					match = elem;
    					break;
    				}
    
    				elem = elem[dir];
    			}
    
    			checkSet[i] = match;
    		}
    	}
    }
    
    function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
    	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
    		var elem = checkSet[i];
    		if ( elem ) {
    			elem = elem[dir];
    			var match = false;
    
    			while ( elem ) {
    				if ( elem.sizcache === doneName ) {
    					match = checkSet[elem.sizset];
    					break;
    				}
    
    				if ( elem.nodeType === 1 ) {
    					if ( !isXML ) {
    						elem.sizcache = doneName;
    						elem.sizset = i;
    					}
    					if ( typeof cur !== "string" ) {
    						if ( elem === cur ) {
    							match = true;
    							break;
    						}
    
    					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
    						match = elem;
    						break;
    					}
    				}
    
    				elem = elem[dir];
    			}
    
    			checkSet[i] = match;
    		}
    	}
    }
    
    var contains = document.compareDocumentPosition ? function(a, b){
    	return !!(a.compareDocumentPosition(b) & 16);
    } : function(a, b){
    	return a !== b && (a.contains ? a.contains(b) : true);
    };
    
    var isXML = function(elem){
    	// documentElement is verified for cases where it doesn't yet exist
    	// (such as loading iframes in IE - #4833) 
    	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
    	return documentElement ? documentElement.nodeName !== "HTML" : false;
    };
    
    var posProcess = function(selector, context){
    	var tmpSet = [], later = "", match,
    		root = context.nodeType ? [context] : context;
    
    	// Position selectors must be done after the filter
    	// And so must :not(positional) so we move all PSEUDOs to the end
    	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
    		later += match[0];
    		selector = selector.replace( Expr.match.PSEUDO, "" );
    	}
    
    	selector = Expr.relative[selector] ? selector + "*" : selector;
    
    	for ( var i = 0, l = root.length; i < l; i++ ) {
    		Sizzle( selector, root[i], tmpSet );
    	}
    
    	return Sizzle.filter( later, tmpSet );
    };
    
    // EXPOSE
    
    window.Sizzle = Sizzle;
    
    })();
    
      // ---
}());

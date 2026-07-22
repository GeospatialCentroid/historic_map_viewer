

/**
 * Get the URL parameters
 * source: https://css-tricks.com/snippets/javascript/get-url-variables/
 * @param  {String} url The URL
 * @return {Object}     The URL parameters
 */
var getParams = function (url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};

//to support older browsers
String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};

//color control
function rgbStrToHex(rgb) {
  var rgbvals = /rgb\((.+),(.+),(.+)\)/i.exec(rgb);
  var rval = parseInt(rgbvals[1]);
  var gval = parseInt(rgbvals[2]);
  var bval = parseInt(rgbvals[3]);
  return '#' + (
    rval.toString(16) +
    gval.toString(16) +
    bval.toString(16)
  ).toUpperCase();
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

String.prototype.clip_text=function(limit){
    if(this.length>limit){
       return "<div class='d-inline' title='"+this.toString()+"'>"+this.substring(0,limit)+"...</div>"
    }
    return this
}
String.prototype.hyper_text=function(){

    if(this.startsWith("http")){
        var str=this.toString()
        //if url is really long take beginning 10 and end 3 characters
        if(this.length>30){
            str=this.substring(0,24)+"..."+this.substring(this.length-3,this.length)
        }
        return "<a href='"+this.toString()+"' target='_blank'>"+str+"</a>"
    }
    return this
}
String.prototype.image_text=function(){

    if(this.startsWith("http")){
        return "<img class='popup_image' src='"+this.toString()+"'>"
    }
    return this
}
//set via url params
var DEBUGMODE=false
console_log = (function (methods, undefined) {

    	var Log = Error; // does this do anything?  proper inheritance...?
    	Log.prototype.write = function (args, method) {
    		/// <summary>
    		/// Paulirish-like console.log wrapper.  Includes stack trace via @fredrik SO suggestion (see remarks for sources).
    		/// Paulirish-like console.log wrapper.  Includes stack trace via @fredrik SO suggestion (see remarks for sources).
    		/// </summary>
    		/// <param name="args" type="Array">list of details to log, as provided by `arguments`</param>
    		/// <param name="method" type="string">the console method to use:  debug, log, warn, info, error</param>
    		/// <remarks>Includes line numbers by calling Error object -- see
    		/// * http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
    		/// * http://stackoverflow.com/questions/13815640/a-proper-wrapper-for-console-log-with-correct-line-number
    		/// * http://stackoverflow.com/a/3806596/1037948
    		/// </remarks>

    		// via @fredrik SO trace suggestion; wrapping in special construct so it stands out
    		var suffix = {
    			"@": (this.lineNumber
    					? this.fileName + ':' + this.lineNumber + ":1" // add arbitrary column value for chrome linking
    					: extractLineNumberFromStack(this.stack)
    			)
    		};

    		args = args.concat([suffix]);
    		// via @paulirish console wrapper
    		if (console && console[method]) {
    			if (console[method].apply) { console[method].apply(console, args); } else { console[method](args); } // nicer display in some browsers
    		}
    	};
    	var extractLineNumberFromStack = function (stack) {
    		/// <summary>
    		/// Get the line/filename detail from a Webkit stack trace.  See http://stackoverflow.com/a/3806596/1037948
    		/// </summary>
    		/// <param name="stack" type="String">the stack string</param>

    		// correct line number according to how Log().write implemented
    		var line = stack.split('\n')[3];
    		// fix for various display text
    		try{
                line = (line.indexOf(' (') >= 0
                    ? line.split(' (')[1].substring(0, line.length - 1)
                    : line.split('at ')[1]
                    );
                return line;
    		}catch(e){
    		    return "undefined";
    		}

    	};

    	// method builder
    	var logMethod = function(method) {
    		return function (params) {
    			/// <summary>
    			/// Paulirish-like console.log wrapper
    			/// </summary>
    			/// <param name="params" type="[...]">list your logging parameters</param>

    			// only if explicitly true somewhere
    			if (typeof DEBUGMODE === typeof undefined || !DEBUGMODE) return;

    			// call handler extension which provides stack trace
    			Log().write(Array.prototype.slice.call(arguments, 0), method); // turn into proper array & declare method to use
    		};//--	fn	logMethod
    	};
    	var result = logMethod('log'); // base for backwards compatibility, simplicity
    	// add some extra juice
    	for(var i in methods) result[methods[i]] = logMethod(methods[i]);

		return result; // expose
    })(['error', 'debug', 'info', 'warn']);//--- _log


class Analytics_Manager {
    constructor(properties,_resource_id) {
        // for events that might happen really frequently, like zooming into the map or changing the transparency
        // prevent more then one event from being tracking within a time frame
        this.sent_events=[]
    }
    track_event(category,action,label,value,delay){
        
        // not the delay prevents the same event from being submitted with a certain number of seconds
        var trigger=true
        if (delay){
            // check the events sent to see if there is a match
            var match=false
            for(var i=0;i<this.sent_events.length;i++){
                var s = this.sent_events[i]
                if(s.category==category && s.label==label && s.value==value){
                     //if match - check if enough time has surpassed to send another event
                     // if so - send a new event and update the time
                     if ((Date.now()-s.time)/1000>delay){
                        match=true
                     }else{
                        trigger=false
                     }
                     //update the time to extend the clock
                     s.time=Date.now()

                }
            }
            if(!match){
                 this.sent_events.push({category:category,label:label,value:value,time:Date.now()})
            }
        }
        if (trigger){
            console_log("trigger",category, action,label,value)

            gtag('event', action, {
              'event_category': category,
              'event_label': label,
              'value': value
            })
        }

    }
}

L.Layer.prototype.setInteractive = function (interactive) {
    if (this.getLayers) {
        try{
            this.getLayers().forEach(layer => {
                layer.setInteractive(interactive);
            });
        }catch(e){
            console.log("unable to set setInteractive", e)
        }

        return;
    }
    if (!this._path) {
        return;
    }

    this.options.interactive = interactive;

    if (interactive) {
        L.DomUtil.addClass(this._path, 'leaflet-interactive');
    } else {
        L.DomUtil.removeClass(this._path, 'leaflet-interactive');
    }
};
//ref: https://stackoverflow.com/questions/45798387/how-to-make-markerclustergroup-cluster-polygons
// Compute a polygon "center", use your favourite algorithm (centroid, etc.)
L.Polygon.addInitHook(function() {
  this._latlng = this._bounds.getCenter();
});

// Provide getLatLng and setLatLng methods for
// Leaflet.markercluster to be able to cluster polygons.
L.Polygon.include({
  getLatLng: function() {
    return this._latlng;
  },
  setLatLng: function() {} // Dummy method.
});

function getValidNumber(value) {
  const numberValue = parseFloat(value); // Attempt to convert the value to a number
  if (Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue; // Return the valid number
}

/**
 * Get the dominant color from the *source IIIF image* of an Allmaps.WarpedMapLayer.
 * Works even when the map itself is rendered with WebGL.
 *
 * @param {Allmaps.WarpedMapLayer} layer
 * @param {Object} [options]
 * @param {number} [options.thumbWidth=100]   IIIF thumbnail width to request
 * @param {number} [options.sampleSize=50]    Size (px) of offscreen canvas for color analysis
 * @returns {Promise<{r:number,g:number,b:number} | null>} Dominant RGB color
 */
async function getDominantColorFromWarpedLayer(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';   // needed if the server allows CORS
        img.src = imageUrl;

        img.onload = () => {
            // Use the image’s natural size so we capture every pixel
            const width  = img.naturalWidth;
            const height = img.naturalHeight;

            const canvas = document.createElement('canvas');
            canvas.width  = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0);

            const data = ctx.getImageData(0, 0, width, height).data;

            const colorCount = {};
            let maxCount = 0;
            let dominant = null;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                if (a === 0) continue; // ignore fully transparent pixels

                const key = `${r},${g},${b}`;
                colorCount[key] = (colorCount[key] || 0) + 1;

                if (colorCount[key] > maxCount) {
                    maxCount = colorCount[key];
                    dominant = rgbToHex(r, g, b)//{ r, g, b };
                }
            }

            resolve(dominant);
        };

        img.onerror = err => reject(err);
    });
}

// Ref: https://stackoverflow.com/questions/4910567/hide-certain-values-in-output-from-json-stringify
function omitKeys(obj, keys)
{
    var dup = {};
    for (var key in obj) {
        if (keys.indexOf(key) == -1) {
            dup[key] = obj[key];
        }
    }
    return dup;
}
const circularReference = {};
circularReference.myself = circularReference;
function stringifyWithoutCircular(obj) {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.add(value);
    }
    return value;
  });
}

function parse_date(date_str) {
    if (!date_str) return new Date(0); // Fallback for missing dates
    
    var parts = date_str.split('/');
    if (parts.length !== 3) return new Date(0);
    
    var month = parseInt(parts[0], 10) - 1; // JS months are 0-indexed
    var day = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);
    
    // Explicitly handle 2-digit years for the 2000s era
    if (year < 100) {
        year += 2000;
    }
    
    return new Date(year, month, day);
}

// 
L.CopyCornersAction = L.EditAction.extend({
    initialize: function(map, overlay, options) {
        options = options || {};
        options.toolbarIcon = {
            html: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-top: 6px;"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>',
            tooltip: 'Copy GeoJSON for Dataset'
        };
        L.EditAction.prototype.initialize.call(this, map, overlay, options);
    },

addHooks: function() {
        var overlay = this._overlay;
        var corners = overlay.getCorners();
        
        // Extract the ID from the overlay object or its options
        var layerId = overlay.options.id || overlay.id || overlay.layer_id || "Unknown ID";

        // Helper function to return [longitude, latitude] as numbers
        var formatCoord = function(c) {
            return [parseFloat(c.lng.toFixed(6)), parseFloat(c.lat.toFixed(6))];
        };

        // Extract corners based on the Z-shape storage [NW, NE, SW, SE]
        var nw = formatCoord(corners[0]);
        var ne = formatCoord(corners[1]);
        var sw = formatCoord(corners[2]);
        var se = formatCoord(corners[3]);

        // Construct a valid GeoJSON Feature with a closed polygon ring
        var geojsonFeature = {
            "type": "Feature",
            "properties": {
                "id": layerId
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    nw, // Top-Left
                    ne, // Top-Right
                    se, // Bottom-Right
                    sw, // Bottom-Left
                    nw  // Close the loop (Return to Top-Left)
                ]]
            }
        };

        // Convert to a clean, indented JSON string (2 spaces)
        var copyText = JSON.stringify(geojsonFeature, null, 2);

        // Construct the multi-line instruction message
        var alertMsg = "GeoJSON successfully copied to clipboard!\n\n" +
                       "Layer ID: " + layerId + "\n" +
                       "Instructions: Paste this GeoJSON into the geometry field in your dataset for this specific layer.\n\n" +
                       copyText;

        // Push to clipboard and alert the user
        navigator.clipboard.writeText(copyText).then(function() {
            alert(alertMsg);
        }).catch(function(err) {
            console.error("Failed to copy GeoJSON: ", err);
        });
    }
});

/**
 * Safely extracts 4 corners from a GeoJSON Feature and returns them in a Z-shape layout.
 * @param {Object|String} geojson - The GeoJSON input from the Solr resource.
 * @returns {L.LatLng[]|null} Array of 4 Leaflet LatLng points, or null if invalid.
 */
function getCornersFromGeoJSON(geojson) {
    if (!geojson) return null;

    if (typeof geojson === 'string') {
        try {
            geojson = JSON.parse(geojson);
        } catch (e) {
            console.error("Failed to parse GeoJSON string:", e);
            return null;
        }
    }

    try {
        var geometry = geojson.geometry || geojson;
        var coords = geometry.coordinates?.[0];
        
        if (coords && coords.length >= 4) {
            var nw = L.latLng(coords[0][1], coords[0][0]); // Index 0
            var ne = L.latLng(coords[1][1], coords[1][0]); // Index 1
            var se = L.latLng(coords[2][1], coords[2][0]); // Index 2
            var sw = L.latLng(coords[3][1], coords[3][0]); // Index 3

            // Conforms strictly to your environment's target layout: [NW, SW, NE, SE]
            return [nw, sw, ne, se];
        }
    } catch (err) {
        console.error("Error parsing GeoJSON coordinate structure:", err);
    }

    return null;
}

/**
 * Normalizes spatial data by extracting valid GeoJSON from either a standard GeoJSON object 
 * or a IIIF Georeference AnnotationPage/Annotation.
 * * @param {Object|string} input - The JSON string or object to parse.
 * @returns {Object} A standard GeoJSON object.
 * @throws {Error} If no valid GeoJSON is found.
 */
function extractGeoJSON(input) {
  // Parse the input if it's passed as a string
  const data = typeof input === 'string' ? JSON.parse(input) : input;

  if (!data || typeof data !== 'object') {
    throw new Error("Input must be a valid JSON object or string.");
  }

  // A list of valid root-level GeoJSON types
  const validGeoJSONTypes = [
    "FeatureCollection", "Feature", "Point", "LineString", 
    "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon", "GeometryCollection"
  ];

  // 1. Check if the input itself is already valid GeoJSON
  if (validGeoJSONTypes.includes(data.type)) {
    return data;
  }

  // 2. Check if the input is a IIIF AnnotationPage containing items
  if (data.type === "AnnotationPage" && Array.isArray(data.items)) {
    for (const item of data.items) {
      if (item.body && validGeoJSONTypes.includes(item.body.type)) {
        return item.body; // Return the nested FeatureCollection
      }
    }
  }

  // 3. Check if the input is a single IIIF Annotation
  if (data.type === "Annotation" && data.body && validGeoJSONTypes.includes(data.body.type)) {
    return data.body;
  }

  // If we reach this point, we didn't find any GeoJSON
  throw new Error("Unable to locate valid GeoJSON within the provided data structure.");
}

async function download_item(URl, prefix = "") {
    analytics_manager.track_event("search_tab", "download", "url", URl);

    // Extract the base filename from the URL, or default to a generic name
    const baseFilename = URl.substring(URl.lastIndexOf('/') + 1) || 'map_download';
    
    // Apply the optional prefix. If a prefix is provided, it prepends it to the filename.
    const filename = prefix ? `${prefix}${baseFilename}` : baseFilename;

    try {
        // Fetch the file as a Blob to bypass default browser navigation behavior
        const response = await fetch(URl);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();

        // Create a local object URL from the Blob
        const blobUrl = window.URL.createObjectURL(blob);

        // Create the temporary link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;

        // Append, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the object URL to free memory after the download starts
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        
    } catch (error) {
        console.error("Blob download failed, falling back to standard link:", error);
        
        // Fallback in case strict CORS policies block the fetch request
        const fallbackLink = document.createElement('a');
        fallbackLink.href = URl;
        fallbackLink.download = filename;
        
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
    }
}
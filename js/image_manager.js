class Image_Manager {
      constructor(properties) {

         // track image_layer
         this.image_layer;
      }
    // allow iiif images to show in same window
  init(){
        this.image_map = L.map('image_map', {
          center: [0, 0],
          zoom:  1,
          minZoom: -10,
          maxZoom: 10,
          crs: L.CRS.Simple,
          rotate:true,
        });

        this.image_map._resetView(this.image_map.getCenter(), this.image_map.getZoom());
        this.add_close_control()
        
        // Existing keyboard accessibility handling...
        $(".leaflet-close-but").attr("tabindex", "0");
        $(document).on('keydown', '.leaflet-close-but', function(e) {
            if (e.which === 13 || e.which === 32) {
                $(this).click(); 
                e.preventDefault();
            }
        });

        // Handle clicking "Georeference on Main Map"
        var $this = this;
       $(document).on('click', '.georeference_link', function(e) {
    e.preventDefault();
    var imgUrl = $(this).data('img');
    var itemId = $(this).data('id'); // <-- 1. Catch the ID from the HTML here
    
    if (!imgUrl) return;

    // Run the negative regex check for static image extensions
    if (!/\.(png|jpe?g)$/i.test(imgUrl)) {
        // Intercept the default click behavior or Leaflet viewer initialization
        window.open("https://editor.allmaps.org/images?url="+imgUrl, '_blank');
        return;
    }

    // --- NEW: REMOVE PREVIOUS LAYER ---
    if (map_manager.layers && map_manager.layers.length > 0) {
        map_manager.layers = map_manager.layers.filter(function(layerItem) {
            if (layerItem.type === "distortableImageOverlay") {
                // Remove from the map if it exists
                if (map_manager.map.hasLayer(layerItem.layer_obj)) {
                    map_manager.map.removeLayer(layerItem.layer_obj);
                }
                return false; // Remove this item from the layers array
            }
            return true; // Keep all other layer types in the array
        });
    }

    // --- NEW: SHOW LOADING INDICATOR ---
    var mapContainer = $(map_manager.map.getContainer());
    $('#georef-loader').remove(); // Ensure no leftover loaders exist
    
    var $loader = $('<div id="georef-loader" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; background: rgba(255,255,255,0.9); padding: 10px 20px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-weight: bold;">Loading Image...</div>');
    mapContainer.append($loader);

    var center = map_manager.map.getCenter();
    var currentZoom = map_manager.map.getZoom();
    var offset = 0.02 / Math.pow(2, currentZoom - 10);

    var estimatedCorners = [
        L.latLng(center.lat + offset, center.lng - offset),
        L.latLng(center.lat + offset, center.lng + offset),
        L.latLng(center.lat - offset, center.lng - offset),
        L.latLng(center.lat - offset, center.lng + offset) 
    ];

    // Combine default tools with the custom Copy action
    var activeTools = [
        L.DragAction, L.ScaleAction, L.DistortAction, 
        L.RotateAction, L.FreeRotateAction, L.LockAction, 
        L.OpacityAction, L.BorderAction, 
        L.DeleteAction, L.CopyCornersAction
    ];

    // Initialize the overlay WITHOUT adding it to the map immediately
    var mainDistortableLayer = L.distortableImageOverlay(imgUrl, {
        corners: estimatedCorners,
        editable: true,
        selected: true, 
        mode: "distort",
        actions: activeTools,
        id: itemId
    });

    // --- NEW: LISTEN FOR LOAD/ERROR EVENTS ---
    mainDistortableLayer.on('load', function() {
        // Hide the loader once the image is successfully loaded and rendered
        $('#georef-loader').remove();
    });

    mainDistortableLayer.on('error', function() {
        // Handle failed image loads gracefully
        $('#georef-loader').text('Error loading image.');
        setTimeout(function() { $('#georef-loader').remove(); }, 3000);
    });

    // Now add it to the map
    mainDistortableLayer.addTo(map_manager.map);

    // Track main map layers dynamically
    if (map_manager.layers) {
        map_manager.layers.push({
            type: "distortableImageOverlay",
            id: "georef_session_" + Date.now(),
            url: imgUrl,
            layer_obj: mainDistortableLayer
        });
    }

    // Close and collapse the side image viewer panel
    $("#image_map").hide();
    $("#image_map").width("0");
    
    if (typeof update_map_size === "function") {
        update_map_size();
    } else if (typeof $this.update_map_size === "function") {
        $this.update_map_size();
    }
    });

        this.add_load_control();

        // Add resize control...
        $("#image_map").resizable({
             handles: "e, w",
             resize: function( event, ui ) {
               if (typeof update_map_size === "function") { update_map_size(); }
             }
        });
        
        this.degrees=0
        var control = new L.Control.Rotate_Button()
        control.addTo(this.image_map);
        $(".rotate_control").html('<a href="javascript:void(0);" role="button" onclick="image_manager.rotate_image()"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16" style="margin-top: 7px;"><path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"></path><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"></path></svg></a>')
    }
    add_close_control(){
        var $this = this;
        L.Control.save_but = L.Control.extend({
            onAdd: function(map) {
              this._container = L.DomUtil.create('div', '');
              this._container.classList.add('leaflet-close-but');
              L.DomEvent.disableClickPropagation(this._container);
              L.DomEvent.on(this._container, 'click', function(){
                $("#image_map").hide()
                 $("#image_map").width("0");
               update_map_size()
              }, this);
              return  this._container;
            }
        });
        L.control.save_but = function(opts) {
            return new L.Control.save_but(opts);
        }

        L.control.save_but({ position: 'topright' }).addTo(this.image_map);
    }
    add_load_control(){
        var $this = this;
        L.Control.load_control = L.Control.extend({
            onAdd: function(map) {
              this._container = L.DomUtil.create('div', '');
              this._container.classList.add('leaflet-spinner');
               this._container.classList.add('spinner-border');
                this._container.classList.add('spinner-border-sm');

              L.DomEvent.disableClickPropagation(this._container);

              this._defaultCursor = this._map._container.style.cursor;

              return  this._container;
            }
        });
        L.control.load_control = function(opts) {
            return new L.Control.load_control(opts);
        }
        L.control.load_control({ position: 'bottomleft' }).addTo(this.image_map);
    }
    update_map_size(){
        // make the map fill the difference
        // var window_width=$( "#map_wrapper" ).width()
        // $("#map").width(window_width-$("#image_map").width()-2)
        map_manager.map.invalidateSize(true)
        this.image_map.invalidateSize(true)
    }
     show_image(img, attribution, info_page,layer_id) {
        console_log("Loading image asset:", img);
        var $this = this;
        // 1. Reveal the viewer container and show the loading spinner IMMEDIATELY
        $("#image_map").width("75%");
        $("#image_map").show();
        $(".leaflet-spinner").show(); 

        // 2. Instantly wipe out old layers so the previous map doesn't hang around while loading
        if (!$this.image_layers) { $this.image_layers = []; }
        for (var i in $this.image_layers){
            try {
                $this.image_map.removeLayer($this.image_layers[i]);
            } catch(e) {
                console.log("Attempting removeLayer error:", e);
            }
        }
        $this.image_layers = []; // Clear the tracking array

        // 3. Force Leaflet to recognize its updated 75% wide layout space
        if (typeof update_map_size === "function") { 
            update_map_size(); 
        } else {
            $this.update_map_size();
        }
        $this.image_map.invalidateSize(true);

        // Helper to handle standard attribution setup once metadata/assets are pulled
        const finalizeAttribution = function() {
            $this.image_map.attributionControl._attributions = {};
            $this.image_map.attributionControl.addAttribution(
                "<a href=\"" + info_page + "\" target=\"_new\">" + attribution + "</a> | " +
                "<a class=\"georeference_link\" href=\"javascript:void(0);\" data-img=\"" + img + "\" data-id=\"" + layer_id + "\">"+LANG.IMAGE.GEOREFERENCE+"</a>");    };

        // 4. Branch off depending on file type, handling the loading states gracefully
        if (/\.(png|jpe?g)$/i.test(img)) {
            // Standard Image File Workflow
            var tempImg = new Image();
            tempImg.onload = function() {
                var bounds = [[0, 0], [this.height, this.width]];
                var imgLayer = L.imageOverlay(img, bounds);
                
                imgLayer.addTo($this.image_map);
                $this.image_layers.push(imgLayer);
                
                // Reset zoom options and scale to target bounds
                $this.image_map.options.minZoom = -10;
                $this.image_map.options.maxZoom = 10;
                $this.image_map.fitBounds(bounds);
                
                finalizeAttribution();
                $(".leaflet-spinner").hide(); // Asset is ready and drawn, kill the spinner
            };
            tempImg.src = img;

        } else {
            // IIIF Manifest Workflow
            var iiifLayer = L["tileLayer"]["iiif"](img);
            iiifLayer.addTo($this.image_map);
            $this.image_layers.push(iiifLayer);

            finalizeAttribution();

            // The IIIF manifest fetches its info.json asynchronously; hide spinner when tiles load
            iiifLayer.once('load', function() {
                if (this.options.maxBounds) {
                   $this.image_map.fitBounds(this.options.maxBounds);
                }
                $(".leaflet-spinner").hide(); // Safe to turn off spinner now
            });
        }
    }
     rotate_image(){
        this.degrees-=90
        this.image_map.setBearing(this.degrees);
     }

 }

 L.Control.Rotate_Button = L.Control.extend({
    options: {
        position: 'topleft'
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control rotate_control');
        var button = L.DomUtil.create('a', 'leaflet-control-button', container);
        L.DomEvent.disableClickPropagation(button);
        L.DomEvent.on(button, 'click', function(){
            console.log('click');
        });
        L.DomEvent.on(button, 'dblclick', L.DomEvent.stopPropagation);
        container.title = "Rotate Image";

        return container;
    },
    onRemove: function(map) {},
});
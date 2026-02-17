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
          crs: L.CRS.Simple,
           rotate:true,
        });

        this.image_map._resetView(this.image_map.getCenter(), this.image_map.getZoom());
        this.add_close_control()
        this.add_load_control()

        //add resize control
        var $this=this
        $("#image_map").resizable({
             handles: "e, w",
             resize: function( event, ui ) {

               $this.update_map_size()
             }
             }
        );
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
                $this.update_map_size()
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
        var window_width=$( "#map_wrapper" ).width()
        $("#map").width(window_width-$("#image_map").width()-2)
        map_manager.map.invalidateSize(true)
        this.image_map.invalidateSize(true)
    }
     show_image(img,attribution,info_page){

         layer_manager.show_image_viewer_layer(L["tileLayer"]["iiif"](img))

        map_manager.map.invalidateSize(true)
        this.image_map.invalidateSize(true)

        this.image_map.attributionControl._attributions = {};
        this.image_map.attributionControl.addAttribution("<a href=\""+info_page+"\" target=\"_new\">"+attribution+"</a> <a href=\"https://editor.allmaps.org/#/collection?url="+img+"\" target=\"_new\">Georeference</a>");

     }
     rotate_image(){
     console.log(this.degrees)
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

        container.title = "Rotate Image";

        return container;
    },
    onRemove: function(map) {},
});
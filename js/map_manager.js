class Map_Manager {
  constructor(properties) {

    for (var p in properties){
        this[p]=properties[p]
    }
    if (this.params){
        if (this.params.hasOwnProperty('z')){
            this.z = Number(this.params['z'])
        }
         if (this.params.hasOwnProperty('c')){
            var c = this.params['c'].split(',')
            this.lat= Number(c[0])
            this.lng = Number(c[1])
        }

    }else{
        this.params={}
    }
     this.map = L.map('map',{doubleClickZoom: false}).setView([this.lat, this.lng], this.z);
  }
  init(){
    var $this=this
     L.control.scale().addTo( this.map);
     this.map.createPane('left');
    var right_pane=  this.map.createPane('right');
//    this.map.on("moveend", function () {
//      update_layer_list();
//      var c =  map_manager.map.getCenter()
//         map_manager.set_url_params("c",c.lat+","+c.lng)
//         map_manager.set_url_params("z", map_manager.map.getZoom())
//         save_params()
//    });
    this.map.on('dragend', function (e) {
       $this.update_map_pos()

    });
    this.map.on('zoomend', function (e) {
        $this.update_map_pos()

    });
    this.map.on('moveend', function (e) {
        $this.update_map_pos()
    });



    this.add_legend()

   map_manager.map.on('warpedmapadded', (event) => {
        const layers = event.target._layers;
        const layer_ids = Object.keys(layers).map(k => parseInt(k));
        const new_layer_id = Math.max(...layer_ids);
      const but_id = "item_"+layers[new_layer_id].id

      if (but_id) {
        const $button = $("." + but_id + "_toggle");
        $button.removeClass("progress-bar-striped progress-bar-animated");
        layer_manager.layer_load_complete($button);
        $button.html(LANG.RESULT.REMOVE);
        $("." + but_id + "_zoom").show();

        // update parent
        var id_parts = but_id.replaceAll("item_","").split("_");
        var section_id= id_parts[0]
        var item_id=id_parts[1]
        var item = filter_manager.get_item(section_id,item_id);
        filter_manager.update_parent_but(section_id, item.parent_id);
      }


    });


  }

     update_map_pos(no_save){
        var c = this.map.getCenter()
        this.set_url_params("c",c.lat+","+c.lng)
        this.set_url_params("z",this.map.getZoom())
        if(!no_save){
            save_params()
        }
//        // also update the table view if table bounds checked
//        table_manager?.bounds_change_handler();
        //update the search results if search results checked
        filter_manager?.update_bounds_search();
    }

    move_map_pos(_params){
        var z = Number(_params['z'])
        var c = _params['c'].split(',')
        var lat= Number(c[0])
        var lng = Number(c[1])
         this.map.setView([lat, lng], z, {animation: true});
    }

    set_url_params(type,value){
        // allow or saving details outside of the filter list but
        //added to the json_str when the map changes
         this.params[type]= value

    }

 popup_show(feature){
        var $this=this

        var html = '<div id="popup_content">'
        html+='<h6>'+feature.properties.title+'</h6><a href="javascript:void(0);" onclick="image_manager.show_image(\''+feature.properties.iiif+'\',\''+feature.properties.attribution+'\',\''+feature.properties.info_page+'\')" ><img class="center" src="'+feature.properties.thumb_url+'" alt="'+feature.properties.title+'"></a> '
        if(feature.properties.well!=""){
        //html+='<br/>County: '+feature.properties.county+''
        html+='<br/>Well #: '+feature.properties.well+'<br/>'
            if(transcription_mode){

            html+='<a href="javascript:void(0);" onclick="transcription.show_form('+feature.properties.id+')" >transcription</a>'
            }
        }

          html+='</div>'

        this.popup= L.popup(this.popup_options)
            .setLatLng(this.click_lat_lng)
            .setContent(html)
            .openOn(this.map)
//            .on("remove", function () {
//                 $this.show_highlight_geo_json()
//              });

     }
      show_highlight_geo_json(geo_json){
        var $this=this
        // when a researcher hovers over a resource show the bounds on the map
        if (typeof(this.highlighted_feature) !="undefined"){
            this.hide_highlight_feature();
        }
        if (geo_json?.geometry && geo_json.geometry.type =="Point" || geo_json?.type=="MultiPoint"){
            //special treatment for points
            this.highlighted_feature = L.geoJSON(geo_json, {
              pointToLayer: function (feature, latlng) {
                        return L.marker(latlng, {icon: $this.get_marker_icon()});
                }
            }).addTo(this.map);
        }else{
            this.highlighted_feature =  L.geoJSON(geo_json,{
                style: function (feature) {
                    return {color: "#fff",fillColor:"#fff",fillOpacity:.5};
                }
                }).addTo(this.map);
        }

    }
     hide_highlight_feature(){
        this.map.removeLayer(this.highlighted_feature);
        delete this.highlighted_feature;
    }
      update_map_size(){
        // make the map fill the difference
        var window_width=$( "#map_wrapper" ).width()
        $("#map").width(window_width-$("#image_map").width()-2)
        this.map.invalidateSize(true)
        image_manager.image_map.invalidateSize(true)
    }
     highlight_marker(_id){
     var markers = section_manager.json_data[0].geojson_markers
        for(var i=0;i<markers.length;i++){
            if(markers[i]._layers[Object.keys(markers[i]._layers)[0]].feature.properties.id==_id){
                var extra='style="border-color: black;"'
              markers[i]._layers[Object.keys(markers[i]._layers)[0]]._icon.innerHTML='<span class="marker" '+extra+'/>'
               break;
            }
        }
    }
    get_marker_icon(extra){
        // define a default marker
        return L.divIcon({
          className: "marker_div",
          iconAnchor: [0, 8],
          labelAnchor: [-6, 0],
          popupAnchor: [0, -36],
          html: '<span class="marker" '+extra+'/>'
        })
    }
    // township search

    parse_township_section_geojson(data){
        var feature = L.geoJson(JSON.parse(data))//.addTo(map_manager.map);
        map_manager.map.fitBounds(feature.getBounds());
        map_manager.create_marker(feature.getBounds().getCenter())
        //show success
        $("#bearing").removeClass("option_error")
        $("#bearing").addClass("option_valid")
    }
    create_marker(lat_lng){
        if(click_marker){
            this.map.removeLayer(click_marker);
        }
        click_marker = new L.marker(lat_lng).addTo(this.map);
        var lat = lat_lng["lat"].toFixed(7);
        var lng = lat_lng["lng"].toFixed(7);
        var html="<table id='lat_lng_table'><tr><td>"+lat+"</td><td>"+lng+"</td></tr></table>"
        html+="<a href='#' onclick='copyElementToClipboard(\"lat_lng_table\");'>copy</a>"

        var popup = L.popup().setContent(html);

        click_marker.bindPopup(popup).openPopup();

    }
    show_layer_select(_layer_id){
        var trigger_map_click=false
        // triggered when there is an update
         if (typeof(_layer_id)!="undefined"){
            this.selected_layer_id = _layer_id
         }
         // if the _layer_id is not set and the this.selected_layer_id is no longer on the map trigger a new map click with the first layer
         if (!_layer_id || !layer_manager.is_on_map(this.selected_layer_id) ){

            // make sure there are still layers left
            if(layer_manager.layers.length>0){
                this.selected_layer_id=layer_manager.layers[0].id
                trigger_map_click = true
            }else{
                this.popup_close()

                return
            }

        }

        var html = layer_manager.get_layer_select_html(this.selected_layer_id,"map_manager.set_selected_layer_id")
         $("#layer_select").html(html)
         //also return the html for direct injection
         if (trigger_map_click &&  $("#layer_select").length){
            this.map_click_event()

         }
         return html
     }
     map_zoom_event(_bounds){
        var bounds
        if (_bounds){
            bounds=_bounds
        }else{
           bounds=this.highlighted_feature.getBounds()
        }

        var zoom_level = this.map.getBoundsZoom(bounds)
        console.log("The zoom level is ",zoom_level)
        //prevent zooming in too close
        if (zoom_level>19){
            this.map.flyTo(bounds.getCenter(),19);
        }else{
            this.map.flyToBounds(bounds);
        }
        this.scroll_to_map()
     }
     scroll_to_map(){
            console.log("Scroll to map")
         $('html, body').animate({
                scrollTop: $("#map").offset().top
            }, 1000);
     }
      get_selected_layer(){
        // start with the last layer (top) if not yet set - check to make use the previous selection still exists
        if (!this.selected_layer_id || !layer_manager.is_on_map(this.selected_layer_id) ){
            if ( layer_manager.layers.length>0){
                this.selected_layer_id=layer_manager.layers[layer_manager.layers.length-1].id
            }else{
                console.log("No layers for you!")
                return
            }

        }
        return layer_manager.get_layer_obj(this.selected_layer_id);
    }
     map_click_event(lat_lng,no_page){

        var $this=this
        if(lat_lng){
            $this.click_lat_lng=lat_lng
        }

        // identify any feature under where the user clicked
        //start by removing the existing feature
        if (this.highlighted_feature) {
          this.map.removeLayer(this.highlighted_feature);
        }


        //analytics_manager.track_event("web_map","click","layer_id",this.get_selected_layer()?.id)
        //start by using the first loaded layer
        var layer = this.get_selected_layer()
        console_log("Get selected layer",layer)
        if (!layer){

            return
        }
         // show popup
        this.popup_show();
        var query_base =false
        try{
         var query_base = layer.layer_obj.query()
        }catch(e){

            this.show_popup_details()
            return
        }

        // if the layer is a point - add some wiggle room
        if(layer.type=="esriPMS"){
            query_full=query_base.nearby(this.click_lat_lng, 5)
        }else{
            query_full=query_base.intersects(this.click_lat_lng)

        }
        if (no_page){
            var query_full =query_base
        }else{
            var query_full = query_base.limit(this.limit)
        }
        this.run_query(query_full)


    }

    add_legend(){
        var header ="<span class='legend_title'>"+"</span>"
        //add custom control
        L.Control.MyControl = L.Control.extend({
          onAdd: function(map) {
            var el = L.DomUtil.create('div', 'legend');
            el.innerHTML = header+'<div id="legend"></div>';
            return el;
          },
          onRemove: function(map) {
            // Nothing to do here
          }
        });

        L.control.myControl = function(opts) {
          return new L.Control.MyControl(opts);
        }

        L.control.myControl({
          position: 'bottomright'
        }).addTo(this.map);
    }
 }
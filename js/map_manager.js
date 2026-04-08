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
     this.map = L.map('map',{doubleClickZoom: true,maxZoom: 21,}).setView([this.lat, this.lng], this.z);


  }
  init(){
    var $this=this
    L.control.scale().addTo( this.map);
    this.map.createPane('left');
    var right_pane=  this.map.createPane('right');
    this.map.on('dragend', function (e) {
       $this.update_map_pos()

    });
    this.map.on('zoomend', function (e) {
        $this.update_map_pos()

    });
    this.map.on('moveend', function (e) {
        $this.update_map_pos()
    });
    this.map.on('click', function(e) {

        const interactiveClasses = ['leaflet-interactive', 'leaflet-sbs-range'];
        if (interactiveClasses.some(cls => e.originalEvent.target.classList.contains(cls))) {
            // The user clicked a marker, a polygon hitbox, or the split control, so ignore
            return; 
        }
        var text = LANG.MAP.MAP_SEARCH;
        var html=`<button type="button" id="" class="btn btn-primary compressed" onclick="filter_manager.handle_point_search(${e.latlng.lat},${e.latlng.lng});">${text}</button>`


        $this.popup= L.popup($this.popup_options)
        .setLatLng(e.latlng)
        .setContent(html)
        .openOn($this.map)

      
       
    });
    

    //this.add_legend()

    L.control.layer_list({ position: 'bottomleft' }).addTo( this.map);
    var html=  "<label for='toggle_marker_checkbox'>"+LANG.MAP.MARKER_TOGGLE+"</lable> <input id='toggle_marker_checkbox' class='form-check-input' type='checkbox' checked/>"
    html+="<br/><label for='toggle_outline_checkbox'>"+LANG.MAP.LAYERS_OUTLINE_TOGGLE+"</lable> <input id='toggle_outline_checkbox' class='form-check-input' type='checkbox' checked/>"
    $("#layer_list_title").html(html)
    //
    $('#toggle_marker_checkbox').change(function() {
        if(this.checked) {
             section_manager.json_data[0].clustered_points.addTo(map_manager.map);
        }else{
             map_manager.map.removeLayer(section_manager.json_data[0].clustered_points);
        }
    });
     $('#toggle_outline_checkbox').change(function() {
        if(this.checked) {
            layer_manager.outlineLayer.addTo(map_manager.map);
        }else{
            map_manager.map.removeLayer(layer_manager.outlineLayer);
        }
    });

   map_manager.map.on('warpedmapadded', (event) => {
    // when the layer is added, update the associated buttons
    // reconstruct the original string from the event object
    const reconstructedString = Object.entries(event)
    .filter(([key, value]) => !isNaN(key) && typeof value === 'string' && value.length === 1)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([key, value]) => value)
    .join('');
    
    const entry = layer_manager.warpedLayerIndex[reconstructedString];
  
    if (!entry) {
        console.warn("No metadata for warped map:", annotationUrl);
        return;
    }
    const section_id = entry.section_id;
    const item_id = entry.item_id;
    const but_id = `item_${section_id}_${item_id}`;
    
    const $button = $("." + but_id + "_toggle");
    $button.removeClass("progress-bar-striped progress-bar-animated");
    layer_manager.layer_load_complete($button);
    $button.html(LANG.RESULT.REMOVE);
    $("." + but_id + "_zoom").show();
    if(typeof section_id !== "undefined" && typeof item_id !== "undefined" ){
        var item = filter_manager.get_item(section_id,item_id);
        filter_manager.update_parent_but(section_id, item.parent_id);
        var hitbox_layer = map_manager.add_hitbox_layer(item);
        entry.layer_obj.hitbox_layer = hitbox_layer;//keep track for later removal
    
    }else{
        console_log(but_id,"Could not find section_id and item_id for hitbox layer",section_id,item_id)
    }

     map_manager.update_popup(section_id,item_id);
    });
    map_manager.map.on('layerremove', (e) => {
        //when a layer is removed, also remove the hitbox layer if it exists
        if (e?.layer?.hitbox_layer) {
            map_manager.map.removeLayer(e.layer.hitbox_layer);
            map_manager.hide_highlight_feature();
            //also close the popup if the layer is removes
            // if(map_manager.popup){
            //     map_manager.popup.remove()
            //     map_manager.popup=null
            // }
        }
        
    });

  }
  update_popup(section_id,item_id){
    //update the popup if it's visible
    try{
        const el = document.getElementById(`item_${section_id}_${item_id}_popup`);
        if (el.classList.contains("popup_info") ){
            if(layer_manager.is_on_map(section_id+"_"+item_id)){
                el.classList.add("layer-active");
            }else{
                 el.classList.remove("layer-active");
            }
        }
    }catch(e){
        //no popup found
        //console.log(`item_${section_id}_${item_id}_popup not found`)
    }
  }
  add_hitbox_layer(resource_obj) {
    const $this = this;

    const hitbox = L.geoJSON(resource_obj.geojson, {
        style: {
            opacity: 0,
            fillOpacity: 0,
            weight: 0
        },
        interactive: true
    });

    hitbox.on('mouseover', function (e) {
        $this.map.getContainer().style.cursor = 'pointer';
       $this.show_highlight_geo_json(resource_obj.geojson, true);
    });

    hitbox.on('mouseout', function (e) {
        $this.map.getContainer().style.cursor = '';
        $this.hide_highlight_feature();
    });

    hitbox.on('click', function (e) {

        L.DomEvent.stopPropagation(e);
       var latlng = map_manager.map.mouseEventToLatLng(e.originalEvent)
        $this.click_lat_lng = L.latLng(latlng.lat,latlng.lng);
        $this.popup_show(resource_obj);
    });

    hitbox.addTo(this.map);

    return hitbox;
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
        if ($('#filter_bounds_checkbox').is(':checked')){
             filter_manager?.update_bounds_search();
        }
    }

    move_map_pos(_params){
        console.log("move_map_pos",_params)
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

 popup_show(item){
        var item_id=item.id
        var section_id=item.section_id
        var section = section_manager.json_data[section_id];
        var $this=this
        const id = `item_${section_id}_${item_id}`;
        // get the existing slider values
        var t = $("." + id+'_slider').slider("value");
        var c = $("." + id+'_color_remove'+'_slider').slider("value");
        var extra = `<div class="item_thumb_container"><img class="item_thumb" src="${item[section['image_col']]}" /></div>`

        // adjust the popup details depending on layer visibility
        var _class = "popup_info"; //base class
        if(layer_manager.is_on_map(section_id+"_"+item_id)){
            _class += " layer-active" // mix-in showing layer controls
        }
        var html = layer_manager.get_layer_html(section_id,item_id,_class,extra,"_popup")

        this.popup= L.popup(this.popup_options)
            .setLatLng(this.click_lat_lng)
            .setContent(html)
            .openOn(this.map)
           .on("remove", function () {
                $this.show_highlight_geo_json()
             });
        // add active class if the layer is visible  
        // create and set slider values
        layer_manager.make_slider(id+'_slider',t)
        layer_manager.make_remove_color_slider(id+'_color_remove'+'_slider',c)
        //sync the split control
        if (layer_manager.split_left_layers.includes(id)) {
            $("." + id + "_left").addClass("split_cell_active");
        }
        if (layer_manager.split_right_layers.includes(id)) {
            $("." + id + "_right").addClass("split_cell_active");
        }

        analytics_manager.track_event("web_map","click","layer_id",`${section_id}_${item_id}`)

     }
      show_highlight_geo_json(geo_json,_no_fill){
        let fill_opacity=.5
        if (_no_fill){fill_opacity=0}
        var $this=this
        // when a researcher hovers over a resource show the bounds on the map
        this.hide_highlight_feature();

        if (geo_json?.geometry && geo_json.geometry.type =="Point" || geo_json?.type=="MultiPoint"){

            //special treatment for points
            this.highlighted_feature = L.geoJSON(geo_json, {
                interactive: false, 
              pointToLayer: function (feature, latlng) {
                        return L.marker(latlng, {icon: $this.get_marker_icon()});
                        interactive: false 
                }
            }).addTo(this.map);
        }else{
            this.highlighted_feature =  L.geoJSON(geo_json,{
                interactive: false ,
                style: function (feature) {
                    return {color: "#fff",fillColor:"#fff",fillOpacity:fill_opacity};
                }
                }).addTo(this.map);
        }

    }
     hide_highlight_feature(){
        if (typeof(this.highlighted_feature) !="undefined"){
            this.map.removeLayer(this.highlighted_feature);
            delete this.highlighted_feature;
        }
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
        //prevent zooming in too close
        if (zoom_level>19){
            this.map.flyTo(bounds.getCenter(),19);
        }else{
            this.map.flyToBounds(bounds);
        }
        //this.scroll_to_map()
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


       // analytics_manager.track_event("web_map","click","layer_id",this.get_selected_layer()?.id)
        //start by using the first loaded layer
        var layer = this.get_selected_layer()
        console_log("Get selected layer",layer)
        if (!layer){

            return
        }
         // show popup
         console.log("popup_show....")
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
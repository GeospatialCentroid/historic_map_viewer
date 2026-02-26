/**
 * Description. A layer object to control what is shown on the map
 *
 * @file   This files defines the Layer_Manager class.
 * @author Kevin Worthington
 *
 * @param {Object} properties     The properties passed as a json object specifying:


*/

class Layer_Manager {
  constructor(properties) {
    //store all the properties passed
    for (var p in properties){
        this[p]=properties[p]
    }
    // manage the
    // keep track of the layers that are added to the map
    this.layers=[]
    this.image_layers=[]

    if(typeof(this.layers_list)=="undefined"){
        this.layers_list=[]
    }
    //keep reference to the basemap
    this.basemap_layer;

    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data &copy; OpenStreetMap contributors';

	//Plugin magic goes here! Note that you cannot use the same layer object again, as that will confuse the two map controls
	var osm2 = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 13, attribution: osmAttrib });
    this.miniMap = new L.Control.MiniMap( osm2,{toggleDisplay: true}).addTo(map_manager.map);
//
    // fixing the minimap partial display
    setTimeout(() => {
      const mini = this.miniMap._miniMap;

      if (!mini) return;

      mini.invalidateSize();
      mini.setView(
        map_manager.map.getCenter()

      );
    }, 2000);

    this.side_by_side= L.control.sideBySide([], []).addTo(map_manager.map);

    this.split_left_layers=[];
    this.split_right_layers=[];

    //  only show the table for specific types
    this.table_types=["esriSFS","esriSMS","esriPMS","esriSLS","vector","GeoJSON","mapserver","feature layer"]
    //
    var $this=this
    // make the map layers sortable
    // make the map layers sortable
    $("#sortable_layers").sortable({
        start: function(event, ui) {
             $(ui.item).addClass('highlight');
        },
        stop: function(event, ui) {
            $this.update_layer_order();
        },
        update: function(event, ui) {
           $('#sortable_layers li').removeClass('highlight');
        },
        out: function(event, ui) {
           $('#sortable_layers li').removeClass('highlight');
        }
    });
    // when the map_panel resizes update the map_panel_scroll_content
    $('#sortable_layers').bind('resize', function(){
       $("#map_panel_scroll_content").height($("#map_panel").height())
    });
    $("#map_panel_scroll").scroll( function(e) {
         $("#map_panel").offset({top:-$(this).scrollTop()+$("#map_panel_wrapper").offset().top})
    });
    $("#map_panel_wrapper").bind("mousewheel",function(ev, delta) {
        var scrollTop = $("#map_panel_scroll").scrollTop();
       $("#map_panel_scroll").scrollTop(scrollTop-Math.round(delta));
    });

  }
  update_layer_order(){
    //based on the sortable

    //note that the layer order is reversed
    var ext ="_drag"
    var children =  $("#sortable_layers").children('.drag_li').get().reverse()
    var layers = []
    for (var i =0; i<children.length;i++){
        var id = $(children[i]).attr('id')
        if(typeof(id)!="undefined"){
            var _id = id.substring(0,id.length-ext.length);

            this.map.getPane(_id).style.zIndex = i+100;
            layers.push(this.get_layer_obj(_id.replace("item_","")))
        }

    }
    // update the layer order and url
    this.layers=layers;
    this.set_layers_list()

  }
  add_layer_toggle(section_id,item_id){
  // called from the add/remove button
    var id = "item_"+section_id+"_"+item_id;

    if($("#"+id+"_toggle").html()==LANG.RESULT.REMOVE){
        this.remove_feature_layer(id)
    }else{
        $("#"+id+"_toggle").addClass("progress-bar-striped progress-bar-animated")

        //layer_manager.toggle_layer section_id,item_id,type,drawing_info,url,z,item_ids
        layer_manager.toggle_layer(section_id,item_id,'AllMaps')//,false,false,this.layers_list.length)//,,false,match.URL)
         var layer =  this.get_layer_obj(section_id+"_"+item_id)
         this.map.addLayer(layer.layer_obj)
    }

  }
  remove_feature_layer(_layer_id){

    var layer_id=_layer_id.replace("item_","")
    var layer =  this.get_layer_obj(layer_id)

    console.log("remove_feature_layer",layer_id,layer)
    this.map.removeLayer(layer.layer_obj);

    $("."+_layer_id+"_toggle").removeClass("active")
    $("."+_layer_id+"_toggle").text(LANG.RESULT.ADD) // revert to Add button text
    $("."+_layer_id+"_toggle").removeClass('btn-danger').addClass('btn-primary');
    $("#"+_layer_id+"_drag").remove();
    $("."+_layer_id+"_zoom").hide();
    ////        $this.remove_legend(_resource_id);

    for(var i =0;i<this.layers.length;i++){

            if (this.layers[i].id==layer_id){
               this.layers.splice(i,1)
               break
            }
      }
    this.update_layer_count();
    this.set_layers_list();
    this.layer_list_change();

    // check if the split control needs updating
    if (this.split_right_layers[0]==_layer_id){

        this.split_right_layers=[]
    }
    if (this.split_left_layers[0]==_layer_id){
        this.split_left_layers=[]
    }

    this.toggle_split_control();

    // update the parent button
    var id_parts = layer.id.split("_");
    var section_id= id_parts[0]
    var item_id=id_parts[1]
    var item = filter_manager.get_item(section_id,item_id);
    // slight delay to account of removing layer
    setTimeout(
        filter_manager.update_parent_but(section_id,item.parent_id)
    , 1000);
  }
  get_layer_obj(_resource_id){
     //param _resource_id: section_id+"_"+child_id
      for(var i =0;i<this.layers.length;i++){

            //console.log(temp_layer,"VS",_resource_id)
            if ( this.layers[i].id==_resource_id){
                return  this.layers[i]
            }
      }
      // if no layer was returned - maybe we are controls
     if(_resource_id =="basemap"){
        this.basemap_layer.type="basemap"
        return this.basemap_layer

     }
      if(_resource_id ==-1){

          console.log("unable to find the _resource_id in get_layer_obj",_resource_id)
      }
     return false
  }
  is_on_map(_resource_id){
   //param _resource_id: section_id+"_"+child_id
    var layer = this.get_layer_obj(_resource_id)
    if (layer){
        return true;
    }else{
        return false;
    }
  }

  toggle_layer(section_id,item_id,type,drawing_info,url,z,item_ids){

    var but_id = "item_"+section_id+"_"+item_id;
    var pane="item_"+section_id+"_"+item_id;
    var $this = layer_manager;
    var layer =false;


    // either add or hide a layer
    var resource = filter_manager.get_item(section_id,item_id)
    try {
        var parent_id=resource.parent_id
        var section = section_manager.get_section_details(section_id)
    }catch(e){
        console.log("unable to get section details")
    }

    this.add_layer(section_id,item_id,type,drawing_info,url,z,item_ids)

    if(type!="csv_geojson"){
        $this.add_to_map_tab(section_id,item_id,z);
        return
     }


  }
  zoom_layer(_id,item_id){
      var resource = filter_manager.get_item(_id,item_id)

     var layer =  this.get_layer_obj(_id+"_"+item_id)
      map_manager.map_zoom_event(layer.layer_obj.getBounds())
  }
  add_to_map_tab(section_id,item_id,_z){
        var $this = this;

        var item = filter_manager.get_item(section_id,item_id);

        // reference using the parent and child id joined by an "_"
        var id = "item_"+section_id+"_"+item_id
        var section=section_manager.get_section_details(section_id)
        var title = item[section["title_col"]]
        var title_limit=25
        if(title.length>title_limit){
            title = title.substring(0,title_limit)+"..."
        }
        var download_link = false//filter_manager.get_download_link(item)
        //var dcat_bbox = item.dcat_bbox
        //
        var html = "<li class='ui-state-default drag_li basemap_layer' onmouseover='filter_manager.show_highlight("+section_id+",\""+item_id+"\",true);' onmouseout='map_manager.hide_highlight_feature();' id='"+id+"_drag'  >"
        html+="<div class='left-div-map'>"
        html+="<div class='grip'><i class='bi bi-grip-vertical'></i></div>"

        html +="<div class='item_title item_title_wide font-weight-bold'>"+title+"</span></div>"
    

        html+="<div class='left-div-map-buttons'>"
        html +="<button type='button' id='"+id+"_toggle' class='btn btn-danger "+id+"_toggle' onclick='layer_manager.add_layer_toggle(\""+section_id+"\",\""+item_id+"\")'>"+LANG.RESULT.REMOVE+"</button>"
        //
        html +="<button type='button' class='btn btn-primary' onclick='layer_manager.zoom_layer(\""+section_id+"\",\""+item_id+"\")'>"+LANG.RESULT.ZOOM+"</button>"
        if(download_link){
              html +=download_link;
         }
        html +="<button type='button' class='btn btn-primary' onclick='filter_manager.select_item(\""+section_id+"\",\""+item_id+"\")'>"+LANG.RESULT.DETAILS+"</button>"
        html+='</div>'
        html+='</div>'
//        console_log("the type is ",layer.type)
//        if ($.inArray(layer.type,$this.table_types)>-1){
//            html +="<button type='button' class='btn btn-primary' onclick='layer_manager.show_table_data(\""+id+"\")'><i class='bi bi-table'></i></button>"
//        }

//
//        if (typeof(o.color)!="undefined"){
//          html += "<div class='color_box'><input type='text' id='"+id+"_line_color' value='"+o.color+"'/><br/><label for='"+id+"_line_color' >"+LANG.MAP.OUTLINE_COLOR+"</label></div>"
//        }
//        if (typeof(o.fillColor)!="undefined"){
//         html += "<div class='color_box'><input type='text' id='"+id+"_fill_color' value='"+o.fillColor+"'/><br/><label for='"+id+"_fill_color' >"+LANG.MAP.Fill_COLOR+"</label></div>"
//        }
//        if ($.inArray(layer.type,["esriPMS","esriSMS"])==-1){
        html+=' <div class="stacked-div-map">'
        html += this.get_slider_html(id);// to control opacity

         html += "<br/>"+this.get_slider_html(id+'_color_remove',LANG.MAP.REMOVE_COLOR);// to control color removal

//        }
        html+='</div>'
        html+=this.get_split_cell_control(section_id,item_id)
        html +='</li>'

        // add item to the beginning
        $("#sortable_layers").prepend(html)
        $("#sortable_layers" ).trigger("resize");


//        // add interactivity
//        this.make_color_palette(id+'_line_color',"color")
//        this.make_color_palette(id+'_fill_color',"fillColor")

        this.make_slider(id+'_slider',100)
        this.make_remove_color_slider(id+'_color_remove'+'_slider',0)


  }


  get_split_cell_control(section_id,item_id){
    return '<table class="split_table"><tr><td class="split_left split_cell" onclick="layer_manager.split_map(this,\''+section_id+'\',\''+item_id+'\',\'left\')"></td><td class="split_middle"></td><td class="split_right split_cell" onclick="layer_manager.split_map(this,\''+section_id+'\',\''+item_id+'\',\'right\')"></td></tr></table>'
  }
  split_map(elm,section_id,item_id, side){
    var _resource_id="item_"+section_id+"_"+item_id

    // only allow one left and one right layer - for now!
    // need to check if _resource_id is currently in use
    if(side=="right" && this.split_left_layers[0]==_resource_id){
        // reset right
        $("#"+_resource_id+"_drag .split_left").removeClass("split_cell_active")
        this.split_left_layers=[]
        this.side_by_side.setLeftLayers([])
    }
    if(side=="left" && this.split_right_layers[0]==_resource_id){
        // reset left
        $("#"+_resource_id+"_drag .split_right").removeClass("split_cell_active")
        this.split_right_layers=[]
        this.side_by_side.setRightLayers([])
    }

    var layer_obj =  this.get_layer_obj(section_id+"_"+item_id).layer_obj
    if (side=="right"){

        if (this.split_right_layers.length>0){
            // remove button active state
            $("#"+this.split_right_layers[0]+"_drag .split_right").removeClass("split_cell_active")
            // reset the clipped area of the right layer
//            try{
//               this.side_by_side._rightLayer.getContainer().style.clip = ''
//            }catch(e){
                this.side_by_side._rightLayer.getPane().style.clip = ''
//            }

            this.side_by_side.setRightLayers([])

            if(this.split_right_layers[0]==_resource_id){
              // deselect if current already exists on right
               this.split_right_layers=[]
               this.toggle_split_control()
               return
            }
        }
        this.split_right_layers=[_resource_id]
        this.side_by_side.setRightLayers([ layer_obj])
    }else{

        if (this.split_left_layers.length>0){
            $("#"+this.split_left_layers[0]+"_drag .split_left").removeClass("split_cell_active")
            // reset the clipped area of the left layer
            this.side_by_side._leftLayer.getPane().style.clip = ''
            this.side_by_side.setLeftLayers([])
            if(this.split_left_layers[0]==_resource_id){
               // deselect if current already exists on left
               this.split_left_layers=[]
               this.toggle_split_control()
               return
            }
        }
        this.split_left_layers=[_resource_id]
        this.side_by_side.setLeftLayers([ layer_obj])
    }
    $(elm).addClass("split_cell_active");
    //and show/hide the control
    this.toggle_split_control()
    console.log(this.split_left_layers,"split_left_layers")
    analytics_manager.track_event("map_tab","split_view","layer_id",_resource_id)
  }
  toggle_split_control(){
    if (this.split_right_layers.length>0 || this.split_left_layers.length>0 ){
        $(".leaflet-sbs").show();
    }else{
        $(".leaflet-sbs").hide();
    }
  }

  make_color_palette(elm_id,_attr){
    var $this = this;
     $("#"+elm_id).drawrpalette()
        $("#"+elm_id).on("choose.drawrpalette",function(event,hexcolor){
            // make exception for basemap
            if (!_attr){
                $(".leaflet-container").css("background",hexcolor)
                return
            }
            var ext ="_line_color";// just needed for character count
            var id = $(this).attr('id')
            var _id = id.substring(0,id.length-ext.length)
            var layer =  $this.get_layer_obj(_id)
            var temp_obj = {}
            temp_obj[_attr]=hexcolor
            layer.layer_obj.setStyle(temp_obj)

            //make exception for markers
            if($.inArray(layer.type,["esriPMS","esriSMS"])>-1){
                //update existing and new markers
                if(_attr=="fillColor"){
                    $("._marker_class"+_id).css({"background-color":hexcolor})
                    $("<style type='text/css'> ._marker_class"+_id+"{ background-color:"+hexcolor+";} </style>").appendTo("head");
                }else{
                    $("._marker_class"+_id).css({"border-color":hexcolor})
                     $("<style type='text/css'> ._marker_class"+_id+"{border-color:"+hexcolor+";} </style>").appendTo("head");
                }

            }
            analytics_manager.track_event("map_tab","change_"+_attr,"layer_id",_id)

        })
        // make sure the panel shows-up on top
        $("#"+elm_id).next().next().css({"z-index": 10001});

  }


  get_slider_html(elm_id,title){
  if(!title){
    title=LANG.MAP.TRANSPARENCY
  }
    return "<div class='slider_box'> <label class='lil' for='"+elm_id+"_slider' >"+title+"</label><div id='"+elm_id+"_slider'></div></div>"
  }
  make_slider(elm_id,value){

    var $this = this
    $("#"+elm_id).slider({
            min: 0,
            max: 100,
            value:value,
            range: "min",
            change: function( event, ui ) {
                 var ext ="_slider"
                 var id = $(this).attr('id')
                 var _id= id.substring(0,id.length-ext.length).replaceAll("item_","")

                 var layer =  $this.get_layer_obj(_id)
                 var type = layer.type
                 var val =ui.value/100
                 var set_opacity=["Map Service","Raster Layer","tms","","mapserver","mapservice","iiif","AllMaps"]
                 if($.inArray(type,set_opacity)>-1){
                    layer.layer_obj.setOpacity(val)
                 }else if($.inArray(type,["esriPMS","esriSMS"])>-1){
                       $("._marker_class"+_id).css({"opacity":val})
                 }else if($.inArray(type,["basemap"])>-1){
                    layer.setOpacity(val)
                 }else if($.inArray(type,["GeoJSON"])>-1){
                    layer.layer_obj.eachLayer(function (layer) {
                        layer.setStyle({
                            opacity: val,
                            fillOpacity: val
                          })
                    });
                 }else{
                    layer.layer_obj.setStyle({
                    opacity: val,
                    fillOpacity: val
                  })

                 }
                 //analytics_manager.track_event("map_tab","transparency_slider","layer_id",_id,3)
              }

         });
  }
    make_remove_color_slider(elm_id,value){
        var $this = this
        $("#"+elm_id).slider({
            min: 0,
            max: 1,
            step: 0.01,
            value:value,
            range: "min",
            change: function(event, ui) {
                var ext = "_color_remove_slider";
                var id = $(this).attr('id');
                var _id = id.substring(0, id.length - ext.length).replaceAll("item_", "");

                var linear = ui.value;
                var threshold = Math.pow(linear, 3); // nonlinear ramp

                var layer = $this.get_layer_obj(_id);

                layer.layer_obj.setRemoveColor({
                    hexColor: layer.dominant_color,
                    threshold: threshold,
                    hardness: 0.8,
                });
            }

    })
    }


    get_service_method(r){
        for (var i=0;i<this.service_method.length;i++){
               if (r==this.service_method[i].ref){
                    return this.service_method[i]
               }
        }
    }

  add_layer(section_id,item_id,_type,_drawing_info,url,_z,item_ids){
    var $this=this
    var update_url=false
    // create layer at pane

    var resource = filter_manager.get_item(section_id,item_id); //section_manager.get_match(_resource_id)
    console_log("The url is",url)

    var layer_options = this.get_layer_options(section_id,item_id,url,_drawing_info)

    //create a pane for the resource

    var pane = this.map.createPane(`item_${section_id}_${item_id}`);
    // set the z if not already
    if(typeof(_z)=="undefined"){
          _z= this.layers.length
          update_url=true
    }

    this.map.getPane(`item_${section_id}_${item_id}`).style.zIndex = _z+100;

    var service_method = this.get_service_method(_type)

    //todo attempt overcoming cors
//     layer_options.url='http://localhost:8000/sr/'+encodeURIComponent(layer_options.url)
     //check for a legend
    if(service_method._method=="tiledMapLayer" || service_method._method=="dynamicMapLayer" ){

        // todo test tms
        layer_options.tms = false
        // if the last character is a 0
        if (layer_options.url.substring(layer_options.url.length-1) =='0'){
            layer_options.url=layer_options.url.substring(0,layer_options.url.length-1)
        }
        // might need a forward slash
        if (layer_options.url.substring(layer_options.url.length-1) !='/'){
            layer_options.url+="/"
        }
        //filter_manager.load_json(layer_options.url+'legend?f=json',layer_manager.create_legend,_resource_id)
    }
    console_log(service_method,"service_method")
     console_log(layer_options.url)
    console_log(layer_options,"layer_options")

    if (service_method._class=="distortableImageOverlay"){
        // get the corners from the solr field
        var corners = filter_manager.get_poly_array(resource["locn_geometry"])
        var cs=[]
        if (corners){
            for(var i =0;i<4;i++){
                var c = corners[i].split(" ")
                // not values come in as lng lat
                cs.push(L.latLng(c[1],c[0]))
            }
            //shift the last value into the second position to conform with distortableImageOverlay
            cs.splice(1, 0, cs.splice(3, 1)[0]);

             // zoom in first for images as they are often quite small
             filter_manager.zoom_layer(resource.dcat_bbox)


            var layer_obj =  L[service_method._class](url,{
                    actions:[L.LockAction],mode:"lock",editable:false,
                    corners: cs,
                   }).addTo(this.map);

        }else{
            //we have no coordinates, just show the image in a separate leaflet
             this.show_image_viewer_layer(L[service_method._class](url,{ actions:[L.LockAction],mode:"lock",editable:false}))
              map_manager.image_map.attributionControl._attributions = {};
              map_manager.image_map.attributionControl.addAttribution(this.get_attribution(resource));
             return
        }


    }else if(service_method._method=="iiif"){
        this.show_image_viewer_layer(L[service_method._class][service_method._method](url))
         map_manager.image_map.attributionControl._attributions = {};
         map_manager.image_map.attributionControl.addAttribution(this.get_attribution(resource));
        return
    }else if(service_method._method=="AllMaps"){
        console.log("Load the ",section_id,item_id)
        var section = section_manager.get_section_details(section_id);
//        var layer_obj = new Allmaps.WarpedMapLayer(
//          resource[section.annotation_col],{ pane: `item_${section_id}_${item_id}`}
//        );

         // if loading the annotation from a relative path
        var layer_obj =new Allmaps.WarpedMapLayer(window.location.origin+"/"+window.location.pathname+"/"+resource[section.annotation_col],{pane: `item_${section_id}_${item_id}`})
        console.log(window.location.origin+"/"+window.location.pathname+"/"+resource[section.annotation_col])
        getDominantColorFromWarpedLayer(resource[section.image_col])
        .then(dominant => {
           layer.dominant_color=dominant
        });


    }else if(service_method._method=="" || service_method._method==null){
        //todo - get this from the service
        layer_options.maxZoom= 21
        console_log(service_method,service_method._class,service_method._method)
        var layer_obj =  L[service_method._class](layer_options.url,layer_options)//.addTo(this.map);

    }else if(service_method?._method && service_method._method.indexOf(".")>-1){
        var method_parts=service_method._method.split(".")
        var layer_obj =  L[service_method._class][method_parts[0]][method_parts[1]](layer_options.url,layer_options).addTo(this.map);


    }else{
      if (service_method._method=="ajax"){
            var layer_obj = L.layerGroup();
            this.load_ajax(url,layer_obj,_resource_id)
      }else if (service_method._method=="csv"){
           var layer_obj = L.layerGroup();
           this.load_tabular_data(url,layer_obj,_resource_id);
      }else if (service_method._method=="csv_geojson"){
         // check if we have a layer obj already
         var layer_obj=$this.get_layer_obj(section_id+"_"+item_id);
         if(layer_obj){
              //notice layer_obj.layer_obj
             this.show_csv_geojson_data(layer_obj.layer_obj,section_id,item_id,item_ids);
             return
          }else{
             // only create this layer if it doesn't yet exist
              layer_obj = L.featureGroup();
              layer_obj.item_to_layer_id=[];//store an id associating the item with the layer id
              layer_obj.layer_options=layer_options
              console_log("about to call show_csv_geojson_data")
              this.show_csv_geojson_data(layer_obj,section_id,item_id,item_ids);
          }

      }else{
        console_log("Passed in",layer_options)/*filter_manager.get_bounds(resource.locn_geometry),*/ // pass in the bounds
       var layer_obj =  L[service_method._class][service_method._method](layer_options)//.addTo(this.map);
        console_log(layer_obj)
      }

    }

    try{
       //layer_obj.setBounds(filter_manager.get_bounds(resource.locn_geometry))
        console_log("Success",resource)
    }catch(e){
        console_log(e)
    }

    try{
        layer_obj.on('click', function (e) {
            console.log(e)

           // $this.layer_click(e,_resource_id);

        });
    }catch(e){
        console_log(e)
    }

    //todo keep reference, update button on load
    // store the resource_obj as a copy for future use
    var type=_type;
     if (_drawing_info){
        if(_drawing_info.renderer?.symbol){
            type=_drawing_info.renderer.symbol.type
        }else{
            console_log("We don't know what this is!!!")
            console_log(_drawing_info)
        }

     }

     var layer = { type:type,"id":section_id+"_"+item_id,"url":url,"layer_obj":layer_obj,"resource_obj":Object.assign({}, resource)}

      // exclude the points layer
      if(layer.id!='0_-1'){
         if(typeof(_z)=="undefined"){
              this.layers.push(layer);
         }else{
            this.layers.splice(_z, 0, layer);
         }
    }
      // update a slim list for sharing only if no programmatically setting a z-index
     if (update_url){
           this.set_layers_list()
     }
     // for ease of access store a layer_id
     layer_obj.layer_id=section_id+"_"+item_id
     layer_obj.id=section_id+"_"+item_id
     //$("."+_resource_id+"_toggle").addClass("progress-bar-striped active progress-bar-animated")
     // update the parent record to show loaded
     //todo only required if we have a parent


     if (resource && typeof(resource.parent)!="undefined"){
          filter_manager.update_parent_but(resource.parent)
     }

     layer_obj.on('load', function (e) {
        console.log("loaded",e)
        $this.layer_load_complete(this);

        //$this.show_bounds($this.get_layer_obj(this.layer_id).layer_obj.getBounds())

    });

    this.layer_list_change();
  }
  load_tabular_data(url,layer_obj,_resource_id){
   var $this = this;
     $.ajax({
            type: "GET",
            url: url,
            dataType: "text",
            success: function(data) {

                layer_obj.data =  $.csv.toObjects(data.replaceAll('\t', ''))


                console.log(layer_obj)

                $this.layer_load_complete({layer_id:_resource_id})
                layer_manager.show_table_data(_resource_id)
            }
         });

  }
  load_ajax(url,layer_obj,_resource_id){
    var $this = this

    $this.create_style_class(_resource_id)
    console_log("AJAX",url)
    $.ajax({
            dataType: "json",
            url: url,
            success: function(data) {

                 console_log("AJAX","Loaded")
                 var markers = L.markerClusterGroup();
                 var unique_id=0;
                L["geoJSON"](data,{

                    onEachFeature: function(feature, layer){
                         markers.addLayer($this.create_geo_feature(feature,_resource_id,layer_obj, layer,url,unique_id++));
                    }
                })
                layer_obj.addLayer(markers)
                layer_obj.data = data
                layer_obj.addTo($this.map);
                //
                console_log(layer_obj)

                $this.show_bounds(markers.getBounds())

                $this.layer_load_complete({layer_id:_resource_id})
            }
        }).error(function(e) {
             console_log("Error",e)
//             var prefix="/sr/"
//             if(url.indexOf(prefix)==-1){
//                $this.load_ajax(prefix+url,layer_obj,_resource_id)
//
//             }else{
//                // show load error
//             }
        });
  }
  create_style_class(_resource_id){
    // custom points
    var layer_options ={}
    layer_options.color="#ffffff";
    layer_options.fillColor="#0290ce";
    layer_options.weight=1;
    var resource_marker_class = "_marker_class"+_resource_id

    $("<style type='text/css'> ."+resource_marker_class+"{ border: "+layer_options.weight+"px solid "+layer_options.color+"; background-color:"+layer_options.fillColor+";} </style>").appendTo("head");

  }
  create_geo_feature(feature,_resource_id,layer_obj, layer,url,unique_id){
    var $this = this

    var style = {}

    if(layer_obj.layer_options){
        style= jQuery.extend(true, {}, layer_obj.layer_options);
    }
    if(feature?.features[0]?.properties?.color && feature.features[0].properties.color!=""){
        style.fillColor= feature.features[0].properties.color
        style.color= feature.features[0].properties.color
        // style.opacity= 0
    }

    var extra=""
    if(feature?.features[0]?.properties?.has_data){
        extra='style="border-color: black;"'
    }
    var geo
    if(feature?.features[0]){
        feature.id= feature.features[0].id
         geo =L.geoJSON(feature, {pane: _resource_id, style: style,
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {  icon: map_manager.get_marker_icon(extra)});
            },
        })
         //temp add service options
         layer_obj.service= {options:{url:url}}
         geo.on('click', function(e) { $this.layer_click(e,unique_id) });

         geo.on('dblclick', function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            layer_manager.add_layer_toggle(0,e.target.options.pane)
         });

         geo.on('mouseover', function (e) {
           filter_manager.show_highlight(0,e.target.options.pane);
        });
        geo.on('mouseout', function (e) {
           map_manager.hide_highlight_feature();
        });
     }
     return geo
  }
  show_bounds(b){
    map_manager.show_copy_link(b.getWest(),b.getSouth(),b.getEast(),b.getNorth())
  }
  get_attribution(resource){
    return "<a href='javascript:void(0);' onclick=\"filter_manager.show_details('"+resource["id"]+"')\" >"+resource["dct_title_s"]+"</a>"
  }
  layer_click(e,_resource_id){

        console.log("layer_click",e,_resource_id)

        map_manager.layer_clicked=true
        map_manager.selected_layer_id=_resource_id

        map_manager.click_lat_lng = e.latlng
        map_manager.click_x_y=e.containerPoint

        //map_manager.popup_show(e.layer.feature);

       //show the details
       // we need to make sure that the parent is selected
       console.log(e)
       //todo store section_id as part of item
       var section_id=0
       var item= filter_manager.get_item(section_id,e.layer.feature.properties.id);
       // if there is a parent id - we should select it instead
      if(typeof(item.parent_id) =="undefined" || item.parent_id==""){
         //console.log(item.parent_id)
          filter_manager.select_item(section_id,e.layer.feature.properties.id)

       }else{
          filter_manager.show_layers(section_id,item.parent_id,e.layer.feature.properties.id)
       }
       //filter_manager.select_item(0,e.layer.feature.properties.id)
//        try{
//              map_manager.selected_feature_id=layer_manager.get_object_id(e.layer.feature);
//              map_manager.show_popup_details([e.layer.feature])
//        }catch(error){
//            // could be an artificial click
//             console_log(e)
//        }
         //map_manager.layer_clicked=false
  }
    get_object_id(_feature){
        // as the objectid might not be consistent between layers, we'll to no consistently determine what it is
        if(!_feature?.id ){
            if( _feature?.properties && _feature.properties?.id){
                 return  _feature.properties.id
            }else{
                return  _feature.properties._id
            }
        }
        return _feature["id"]
  }
  layer_load_complete(elm_id){

    $(elm_id).removeClass("progress-bar-striped progress-bar-animated");
    $(this).removeClass('btn-primary').addClass('btn-danger');
    $(elm_id).text(LANG.RESULT.REMOVE)

    // update the maps ta
    this.update_layer_count();
    //console_log("Add download link")
    //download_manager.add_downloadable_layers()
  }


  show_image_viewer_layer(_layer){
        var  $this = this
        $("#image_map").width("75%")
        $("#image_map").show();
        map_manager.update_map_size()

        // remove existing layers
        for (var i in $this.image_layers){
            image_manager.image_map.removeLayer($this.image_layers[i]);
        }

         $(".leaflet-spinner").show();
         setTimeout(function(){
             _layer.addTo(image_manager.image_map);
             _layer.on("load",function() {  $(".leaflet-spinner").hide(); });
            $this.image_layers.push(_layer)
         },500);

  }
  get_layer_options(section_id,item_id,url,_drawing_info){

      var layer_options ={
        url: url,
        pane:`item_${section_id}_${item_id}`,
        // to enable cursor and click events on raster images
        interactive:true,
        bubblingMouseEvents: false,
        maxZoom: 20,
        useCors:false
      }
      var type;
      var symbol;
      var renderer_type
      if (_drawing_info){
          if(_drawing_info.renderer?.symbol){
             symbol = _drawing_info.renderer.symbol
             type = symbol.type
             renderer_type = _drawing_info.renderer.type
          }else{
            if(_drawing_info.renderer?.uniqueValueInfos){
                symbol = _drawing_info.renderer.uniqueValueInfos[0].symbol
                type = symbol.type
                renderer_type ="simple"
            }

          }
          if (_drawing_info && symbol){
            if(renderer_type=="simple"){
              if(symbol.outline || (type == "esriSLS" && symbol.color)){
                var color_arr;
                if (type == "esriSLS"){
                  color_arr= symbol.color
                }else{
                  color_arr= symbol.outline.color
                }

                 layer_options.color = rgbToHex(color_arr[0], color_arr[1], color_arr[2])
                 layer_options.opacity = Number(color_arr[3])/255
                 if (symbol.outline){
                    layer_options.weight = Number(symbol.outline.width)
                 }

                 if(layer_options.opacity==0){
                    layer_options.stroke=false
                 }
             }

             // in the case of polygons the renderer.symbol.color refers to fill
             if(symbol.color && type != "esriSLS"){
                     var color_arr=symbol.color
                     layer_options.fillColor = rgbToHex(color_arr[0], color_arr[1], color_arr[2])
                     layer_options.fillOpacity = Number(color_arr[3])/255

                     if( layer_options.fillOpacity==0){
                        layer_options.fill=false
                     }
                }
                // we are dealing with markers
                var resource_marker_class = "_marker_class"+_resource_id
                if(typeof(layer_options.color)=="undefined"){
                    layer_options.color="#ffffff"
                }
                 if(typeof(layer_options.fillColor)=="undefined"){
                    layer_options.fillColor="#0290ce"
                }

                $("<style type='text/css'> ."+resource_marker_class+"{ border: "+layer_options.weight+"px solid "+layer_options.color+"; background-color:"+layer_options.fillColor+";} </style>").appendTo("head");

                layer_options.pointToLayer = function (geojson, latlng) {
                  return L.marker(latlng, {
                    icon: map_manager.get_marker_icon(resource_marker_class)
                  });
                }

             }

          }
       }
       return layer_options
  }

   get_selected_layer_count(_resource_id){
        var count = 0
        for(var i =0;i<this.layers.length;i++){
            if (this.layers[i].resource_obj?.path){
                var path = this.layers[i].resource_obj.path
                var parent=path.substring(0, path.indexOf(".layer"));
                if (parent==_resource_id){
                   count++
                }
            }
        }
        return count;
   }
   update_layer_count(){
    //add the the layer count to the maps tab
    $("#map_tab .value").text( this.layers.length+1)

   }


  show_table_data(_layer_id){
    //todo check if we already have a table object
    table_manager.get_layer_data(_layer_id)
    analytics_manager.track_event("map_tab","show_table","layer_id",_layer_id)

  }
 show_csv_geojson_data(layer_obj, section_id, id, item_ids) {
    var $this = this;

    if (!$this.map.hasLayer(layer_obj)) {
        layer_obj.addTo($this.map);
    }

    var section = section_manager.json_data[section_id];
    var items_showing = section.items_showing;

    // Create cluster group ONCE
    if (!section.clustered_points) {
        section.clustered_points = L.markerClusterGroup({
          maxClusterRadius: 40,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: false,
          iconCreateFunction: function (cluster) {
            return L.divIcon({
              html: `<div><span>${cluster.getChildCount()}</span></div>`,
              className: 'my-cluster',
              iconSize: L.point(40, 40)
            });
          }
        });
        section.clustered_points.on('clusterclick', function (a) {
          a.layer.spiderfy();
        });
        layer_obj.addLayer(section.clustered_points);
    }

    // reset markers for this call
    section.geojson_markers = [];
    var markers = section.geojson_markers;

    // Clear existing clustered layers
    section.clustered_points.clearLayers();

    $this.create_style_class(section_id);

    var data = section_manager.get_match(section_id);

    // Loop over items to display
    for (var i = 0; i < item_ids.length; i++) {
        var item_id = item_ids[i];

        var item_index = data.findIndex(item => item.id === item_id);
        if (item_index === -1) continue;
        var geo = $this.create_geo_feature(
            data[item_index].feature,
            item_id,
            layer_obj,
            false,
            false
        );
        if(geo){// to handle broken geo's
            markers.push(geo);

            // Associate item_id with Leaflet internal layer id
            layer_obj.item_to_layer_id[item_index] = layer_obj.getLayerId(geo);
        }
        // Avoid duplicates
        if (!items_showing.includes(item_id)) {
            items_showing.push(item_id);
        }
    }

    // Re-add fresh markers to the cluster
    section.clustered_points.addLayers(markers);

    // Ensure cluster group is on the map
    if (!layer_obj.hasLayer(section.clustered_points)) {
        layer_obj.addLayer(section.clustered_points);
    }

    // Associate data for map click access
    layer_obj.data = data;
}

    //
    get_layer_select_html(_layer_id,_change_event,is_table,omit_selected){
        console_log("todo get_layer_select_html")
        return
        var html=""
        if(_change_event){
            html+="<span>"+LANG.IDENTIFY.IDENTIFY_SELECT_LAYER+"</span>"
        }
        html+="<select "
        if(_change_event){
            html+="onchange='"+_change_event+"(this)'"
        }
        html+=">"

        for(var i =0;i<this.layers.length;i++){
            var skip =false

            var selected =""
            if (this.layers[i].id==_layer_id){
                selected = "selected"
                if (omit_selected){
                    skip=true
                }
            }
            var title = this.layers[i].resource_obj[filter_manager["title_col"]];
            title = title.clip_text(30)
            if ($.inArray(this.layers[i].type,this.table_types)>-1 || !is_table){
                // omit the selected value if flag set
                if(!skip){
                    html += "<option "+selected+" value='"+this.layers[i].id+"'>"+title+"</option>"
                }

            }
        }
        html+="<select>"

        return html
    }


    add_basemap_control(){

        var $this = this
        var id = "basemap"
        var fill_color =  rgbStrToHex($(".leaflet-container").css("backgroundColor"))

        var html = "<div class='basemap_text'>"+LANG.MAP.BASEMAP_TEXT+"</div><li class='basemap_layer'>"
        html += "<div class='left-div-map' style='width:30%'>"
        html += this.get_base_map_dropdown_html()+"</div>"
        html+= "<div class='stacked-div-map'>"+this.get_slider_html("basemap")+"</div>"
        html += "<div class='stacked-div-map'><div class='color_box'><input type='text' id='"+id+"_base_color' value='"+fill_color+"'/><br/><label for='"+id+"_base_color' >"+LANG.BASEMAP.BACKGROUND+"</label></div>"+"</div>"
         html += "</li>"
         $("#basemap_layer").html(html)
         this.make_slider("basemap_slider",100)
         this.make_color_palette(id+'_base_color')

          this.map.createPane("basemap");
          this.map.getPane("basemap").style.zIndex = 1;



         $('#basemap_layer_dropdown li').on('click', function () {
            if($this.basemap_layer){
                $this.map.removeLayer($this.basemap_layer);
            }
            var val = $(this).attr('value');
            $this.basemap_layer= L.tileLayer(LANG.BASEMAP.BASEMAP_OPTIONS[val].url, {
                maxZoom: 19,
                attribution: LANG.BASEMAP.BASEMAP_OPTIONS[val].attribution,
                pane:"basemap"
            }).addTo($this.map);
           // update the icon
           $("#basemap_layer_img").attr("src", LANG.BASEMAP.BASEMAP_OPTIONS[val].image)
        });
        //todo - allow setting via url params
        // add default layer
        $('#basemap_layer_dropdown li:first-child').trigger("click")
    }
    get_base_map_dropdown_html(){

        var basemaps=LANG.BASEMAP.BASEMAP_OPTIONS
        // get all the basemaps and show the images in a dropdown
        var first_item = basemaps[Object.keys(basemaps)[0]];
        var html=""
        //var html= "<div class='item_title font-weight-bold'>"+LANG.BASEMAP.TITLE+"</div> "
        html+= '<div class="btn-group dropup"><button id="basemap_layer_but" style="float:left;max-height:none;" class="btn btn-primary dropdown-toggle " type="button" data-toggle="dropdown" title="'+LANG.BASEMAP.TIP+'" data-bs-toggle="dropdown" aria-expanded="false">'
        html+='<img id="basemap_layer_img" class="thumbnail_small" src="'+first_item.image+'"/>'
        html+='</button>'
        html+= '<ul id="basemap_layer_dropdown" class="dropdown-menu" style="max-height:250px;overflow:scroll;" aria-labelledby="basemap_layer_but">'
        for(var b in basemaps){

            html+= '<li value="'+b+'"><div><a class="dropdown-item"><img alt="'+basemaps[b].title+'" class="thumbnail" src="'+basemaps[b].image+'"/></a><span>'+basemaps[b].title+'</span></div></li>'
        }
        html+='</ul></div>'
        return html

    }
    convert_text_to_json(text){
        //solr stores the json structure of nested elements as a smi usable string
        // convert the string to json for use!
        // returns a usable json object
        var reg = new RegExp(/(\w+)=([^\s|\[|,|\{|\}]+)/, 'gi');// get words between { and =
        text=text.replace(reg,'"$1"="$2"')

        // find all the {att: instances
        text=text.replace(/({)([^"|{]*)(=)/g,'{"$2"=')

        // and wrap the last attributes that equal something - adding back '='
        text=text.replace(/\s([^=|"|,]*)=/g,'"$1"=')

        // replace any empty strings =,
         text=text.replaceAll(/=,/g,'="",')
         // and empty slots
          text=text.replaceAll(/, ,/g,',')

        // lastly replace the '=' with ':'
        text=text.replaceAll('=',':')

        try {
            return JSON.parse(text)
        } catch(e) {
           console_log("error",e)
           console_log(text)
        }


    }
    set_layers_list(){
       // returns an object with the layer_id and any extra settings for each
       //todo - also keep track of the basemap
        this.layers_list=[]
        for(var i =0;i<this.layers.length;i++){
           var obj = this.layers[i]
           if(obj["id"]!="0_-1"){// exclude the point layer
               this.layers_list.push({
                   id:obj["id"],
                   });
               }
           }
        save_params()
    }
    layer_list_change(){
        console.log("layer_list_change")

        //update the table manager dropdown
       // table_manager.show_layer_select()
       // map_manager.show_layer_select()

    }
    create_legend(data,_resource_id){
        var html = '<div id="legend_'+_resource_id+'">'
        if(data?.['layers']){
//        console.log(data['layers'])
            for (var i=0;i<data['layers'].length;i++){
                var l = data['layers'][i]
                var layer_name=l.layerName
                layer_name = layer_name.clip_text(15)
                html += '<span class="legend_title">'+layer_name+'</span>'

                for (var j=0;j<l['legend'].length;j++){

                   var label =  l['legend'][j].label.clip_text(16)
                  var id =  l['legend'][j].url
                   html+='<label>'
                   if(l['legend'][j]?.imageData){
                        html+='<img alt="'+label+'" src="data:image/png;base64,'+l['legend'][j].imageData+'" border="0" width="20" height="20" class="legend_symbol">'
                   }else if(l['legend'][j]?.color){
                        var color = l['legend'][j]?.color
                        var class_ = ""
                        if ( l['legend'][j]?.class){
                            class_ = l['legend'][j]?.class
                        }
                        html+='<div alt="'+label+'" style="border-width: 1px;opacity: 0.5;width:20px;height:20px;background:'+color+';border:'+color+';"  class="legend_symbol '+class_+'"></div>'
                   }
                   html+='<span class="legend_label">'+label+'</span></label><br/>'

                }
            }
        }
       html += "</div>"
       $("#legend").append(html)
       $('.legend').show()
    }
    remove_legend(_resource_id){
        $("#legend_"+_resource_id).remove()
        console_log($('#legend').children().length)
        if ( $('#legend').children().length > 0 ) {
            $('.legend').show()
        }else{
            $('.legend').hide()
        }

    }
}


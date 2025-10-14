class Filter_Manager {
  constructor(properties) {
    //store all the properties passed
    for (var p in properties){
        this[p]=properties[p]
    }

    // store the subset of results for use
    this.subset_data;
    // store the item in the list
    this.page_num;
    // a dictionary of all the filters set
    this.filters={}
    this.mode='data';
    this.showing_id;// keep track of the current section on display
   }
     init_search_interface(json_data){
        //  called from section manager
        var $this=this
        this.populate_search(json_data)
        $('#list_sort').change(function() {
           $this.show_sorted_results($this.showing_id)
        });



        $("#search").focus();
        $("#search_clear").click(function(){
             if($this.mode=="data"){
                $("#search").val("")
                //back to browse
                $this.add_filter(false,null)
                $this.filter()
                //$this.section_manager.slide_position("browse")
               }else{
                $("#map_search").val("")
               }
        })
        ///--------
        $('input[type=radio][name=search_type]').change(function() {
            $this.mode=this.value
            if(this.value=="data"){
                $("#search").show();
                $("#map_search").hide();
            }else{
                $("#map_search").show();
                $("#search").hide();
            }
        });
        //When searching - all titles are added to the auto
         $("#search_but").click(function(){
            if($this.mode=="data"){
                console.log("search the data")
               $this.add_filter(false,[$("#search").val()])
               $this.filter();
               //go to results
               $this.section_manager.slide_position("results")
            }else{

                $.get($this.place_url, { q: $("#map_search").val() }, function(data) {
                    try{
                        $this.show_place_bounds(data[0].boundingbox)
                        $("#search").val(data[0].display_name)
                    }catch(e){

                    }

              })
            }
        })
        //

        $('#filter_bounds_checkbox').change(
        function(){
             filter_manager.update_bounds_search($(this))
        }
    );

    }
    show_date_search(col,all_data){
         //date search
         var dates=[]
        for (var i=0;i<all_data.length;i++){
            if(all_data[i][col][0] != null){
               dates = dates.concat(all_data[i][col])
            }

        }
        dates= dates.sort();

        $('#filter_date_checkbox').change(
            function(){
              filter_manager.delay_date_change(col);
            }
        );


        $("#filter_start_date").change( function() {
            filter_manager.delay_date_change(col)

        });
        $("#filter_end_date").change( function() {
          filter_manager.delay_date_change(col)
        });
        // create the range slider
        var values = [dates[0],dates[dates.length-1]]
         $("#filter_start_date").val(values[0])
         $("#filter_end_date").val(values[1])
        $("#filter_date .filter_slider_box").slider({
            range: true,
            min: values[0],
            max: values[1],
            values:values,
            slide: function( event, ui ) {

               $("#filter_start_date").val(ui.values[0])
               $("#filter_end_date").val(ui.values[1])
               filter_manager.delay_date_change(col)

         }
        })

    }
    delay_date_change(col){
        var $this=this
        // prevent multiple calls when editing filter parameters
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        this.timeout=setTimeout(function(){
              $this.update_date_filter(col)
              $this.timeout=false

        },500)
     }
     //todo add date filtering
    update_date_filter(col){
          //Add date filter
         if ($('#filter_date_checkbox').is(':checked')){
            var start =$("#filter_start_date").val()
            var end = $("#filter_end_date").val()

            this.add_filter(col, [start,end])
            this.filter();

         }else{
           this.remove_filter(col)
           this.filter();
        }
    }
     show_place_bounds(b){
        var sw = L.latLng(Number(b[0]), Number(b[2])),
            ne = L.latLng(Number(b[1]), Number(b[3])),
            bounds = L.latLngBounds(sw, ne);
            map_manager.map_zoom_event(bounds)

            map_manager.show_copy_link(b[2],b[0],b[3],b[1])

  }
    update_results_info(num){

        $(".total_results").text(LANG.RESULT.FOUND+" "+num+" "+LANG.RESULT.RESULTS)
        $(".spinner-border").hide();

        setTimeout(() => { run_resize()} , "500");
//        console.log("run resize")
    }
    populate_search(data){
       // to make it easy to select a dataset, an autocomplete control is used and populated based on entered values
       var $this = this
       this.subset=[]
        // loop over the data and add 'value' and 'key' items for use in the autocomplete input element
       for (var i=0;i<data.length;i++){
            // inject and if for access
            var title_col=data[i]['title_col'];
             var section_name=data[i]['section_name'];
            for (var j=0;j<data[i].all_data.length;j++){
                var item=data[i].all_data[j]
                this.subset.push({
                label: item[title_col], //+" ("+section_name+")",
                value: i+"_"+j
                 })

            }
        }
      $( "#search" ).autocomplete({
          source: this.subset,
          minLength: 0,
          select: function( event, ui ) {
                event.preventDefault();

                $("#search").val(ui.item.label)//.substring(0,ui.item.label.indexOf("(")-1));
                $("#search_but").trigger("click")
                $('#toggle_hidden_checkbox').prop("checked",true);
                $('#toggle_hidden_checkbox').trigger("change");
            },
        focus: function(event, ui) {
            event.preventDefault();
           // $("#search").val(ui.item.label);
        }

      });
      $(document).on("keydown", "#search", function(e) {
            if(e.keyCode==13){
                $("#search_but").trigger("click")
            }
        })

//      this.show_results()
//
//      //update counts
//      this.update_results_info(this.subset_data.length)
    }

      add_filter(_id,value){
        console_log("add_filter with a chip",_id,value)
        if (_id ==false){
            _id = LANG.SEARCH.CHIP_SUBMIT_BUT_LABEL
            // add text to the search field
            $("#search").val(value)
        }
        // remove the __ to get the true id
        var id = _id.replaceAll("__", " ");
        // set the filters value
        this.filters[id]=value
        console_log("And the filters are...",this.filters)
        //create text for filter chip
        var text_val=""
        //for number range use dash - separator
        if (value!=null){
            if($.isNumeric(value[0]) && value.length<=2){
                text_val=value[0]+" - "+value[1]
            }else{
                text_val=value.join(", ")
            }
        }
//        this.show_filter_selection(_id.replaceAll( " ", "__"),id+": "+text_val)
        if (value==null){
           this.remove_filter(_id)
        }

    }
     remove_filter(_id){
        var id = _id.replaceAll("__", " ");
        delete this.filters[id]
        //remove filter selection
        //this.remove_filter_selection(_id)
    }
    filter(section_id){
        // create a subset of the items based on the set filters
        var subset=[]
        //loop though the items in the list
        var start=0
        var end=this.section_manager.json_data.length
        if(section_id){
            //allow filtering results from a single section
            start=section_id
            end =section_id+1
        }
        for (var i=start;i<end;i++){
            for (var j=0;j<this.section_manager.json_data[i].all_data.length;j++){
                // compare each to the filter set to create a subset
                var meets_criteria=true; // a boolean to determine if the item should be included

                var obj=this.section_manager.json_data[i].all_data[j]
                for (var a in this.filters){
                    if (a==LANG.SEARCH.CHIP_SUBMIT_BUT_LABEL){
                        // if search term not found in both title and sub title
    //                    if(obj[this.title_col].indexOf(this.filters[a][0]) == - 1 &&  obj[this.sub_title_col].indexOf(this.filters[a][0])==-1){
    //                        meets_criteria=false
    //                    }
                        // convert to string for search
                        var obj_str = JSON.stringify(omitKeys(obj, ['resource_obj','Reference URL'])).toLowerCase();
                        if(obj_str.indexOf(this.filters[a][0].toLowerCase() )==-1){
                            meets_criteria=false
                        }

                    }else if (a=='bounds'){
                         if(obj?.[this['bounds_col']]){
                             var b = obj[this['bounds_col']].split(',')
                              var poly1 = turf.polygon([[
                                [b[1],b[0]],
                                [b[1],b[2]],
                                [b[3],b[2]],
                                [b[3],b[0]],
                                [b[1],b[0]]
                                ]])
                              var b = layer_manager.map.getBounds()
                              var poly2 = turf.polygon([[
                              [b._southWest.lat,b._southWest.lng],
                              [b._southWest.lat,b._northEast.lng],
                              [b._northEast.lat,b._northEast.lng],
                              [b._northEast.lat,b._southWest.lng],
                               [b._southWest.lat,b._southWest.lng]
                              ]])

                              if (!turf.booleanIntersects(poly1, poly2)){
                                meets_criteria=false
                              }
                        }else{
                             // no coordinates
                             meets_criteria=false
                        }

                    }else if (a!='p'){
                        if ($.isNumeric(this.filters[a][0])){
                            //we are dealing with a numbers - check range
                            if (obj[a]<this.filters[a][0] || obj[a]>this.filters[a][1]){
                                 meets_criteria=false
                            }
                        }else{
                            // match the elements
                            // make and exception for searching through array values
                             if ($.isArray(obj[a])){
                                // loop over the filters array checking if its in the object attribute array
                                for(var j=0;j<this.filters[a].length;j++){
                                     if ($.inArray(this.filters[a][j],obj[a])==-1){
                                        meets_criteria=false
                                     }
                                }
                             }else{
                                if ($.inArray(obj[a],this.filters[a])==-1){
                                    meets_criteria=false
                                }
                             }
                        }
                    }
                }
                if (meets_criteria==true){
                        subset.push(obj)
                }
            }
        }
        //this.populate_search(subset)
       // this.generate_filters(subset)
        // be sure to set the filter_manager params for setting filters during menu regeneration

        this.params=[this.filters]
        console_log( "params were set",this.filters)
//        this.set_filters();
//        this.save_filter_params()
//
//        this.add_filter_watcher();

        //this.slide_position("results");
        // keep track of the subset for sorting
         this.subset_data=subset
         this.show_sorted_results(subset)
    }
    add_filter_watcher(){
        var $this=this;
        // watch at the filter list level
        $('.filter_list').change( function() {
           var id = $(this).attr('id')
            // create a new list of selected values
           var vals=[]
           $(this).find(":checked").each(function() {
                vals.push($(this).val())

           })
           if(vals.length==0){
                vals=null
           }
           console_log("add_filter_watcher",$(this).attr('id'),vals)
           $this.add_filter($(this).attr('id'),vals);
           $this.filter()
        });
    }
    //---
     create_filter_values(section,all_data,filter_cols,year_start_col,year_end_col){
        // set variables to assist with grouping and filtering
        // a group allows a way to show a whole bunch of features at the same time.
        //todo add col grouping


        // year_start_col and year_end_cols allow a way to show change over time
        var years=[]
        for (var i=0;i<all_data.length;i++){
            if(year_start_col){
               years.push(Number(all_data[i][year_start_col]))
            }
            if(year_end_col && all_data[i][year_end_col]){
                 years.push(Number(all_data[i][year_end_col]))
            }
        }
        years.sort()
        section.start=years[0]
        section.end=years[years.length-1]
    }
    //--
     generate_filters(_data,filter_cols){
        // create a list of all the unique values
        // then create controls to allow users to filter items
        // these controls will update their counts when filters are selected
        $("#filters").empty()
        var $this=this;
        // create a catalog of all the unique options for each of attributes
        this.catalog={}
        // create a separate obj to track the occurrences of each unique option
        this.catalog_counts={}
        for (var i=0;i<_data.length;i++){
            var obj=_data[i]
//            //add a unique id, prepend 'item_' for use as a variable, only do this on first pass
//            if(!this.ids_added){
//              obj["id"]="item_"+i;
//            }

            //for (var a in obj){// use instead if we want to filter on all
            for (var j in filter_cols){
                a=filter_cols[j]
               //start with a check for numeric
               if ($.isNumeric(obj[a])){
                obj[a]=parseInt(obj[a])
               }
               // see if we hve and array
               if ($.isArray(obj[a])){
                    // need to add all the array items into the catalog
                    for (var j = 0; j<obj[a].length;j++){
                        this.add_to_catalog(a,obj[a][j])
                    }
               }else{
                    this.add_to_catalog(a,obj[a])
               }

            }

        }
        // sort all the items
        // create controls - Note column names are used for ids - spaces replaced with '__'
         for (var a in this.catalog){
                // join with counts and sort by prevalence
               var catalog_and_counts=[]
               for(var j=0;j<this.catalog[a].length;j++){
                    catalog_and_counts.push([this.catalog_counts[a][j],this.catalog[a][j]])
               }

                catalog_and_counts.sort(function (a, b) {
                    if (a[0] === b[0]) {
                        return 0;
                    }
                    else {
                        return (a[0] > b[0]) ? -1 : 1;
                    }
                });
               // now extract the values
               this.catalog[a]=[]
               this.catalog_counts[a]=[]
               for(var j=0;j<catalog_and_counts.length;j++){
                    this.catalog[a].push(catalog_and_counts[j][1])
                    this.catalog_counts[a].push(catalog_and_counts[j][0])
               }
               // generate control html based on data type (use last value to workaround blank first values)
               if (this.catalog[a].length>0 && $.inArray(a,$this.omit_filter_item)==-1){
                if( $.isNumeric(this.catalog[a][this.catalog[a].length-1])){
                    //create a range slider for numbers - https://jqueryui.com/slider/#range
                     this.catalog[a] = this.catalog[a].filter(item => item !== null);
                     var min = Math.min.apply(Math, this.catalog[a]);
                     var max = Math.max.apply(Math, this.catalog[a]);
                      console.log("date slider ",a,min,max)
                    console.log(this.catalog[a])
                     $("#filters").append(this.get_range_slider(a,min,max))
                     //to allow  fine-tuning - add min and max values
                     var ext="_slider"
                     $("#"+a.replaceAll(" ", "__")+ext).slider({
                      range: true,
                      min: min,
                      max: max,
                      values: [ min, max ],
                      change: function( event, ui ) {
                        var id = $(this).attr('id')
                        var _id= id.substring(0,id.length-ext.length)
                        //set handle values
                        $("#"+id+"_handle0").text(ui.values[ 0 ])
                        $("#"+id+"_handle1").text(ui.values[ 1 ])
                        //add the filter
                        $this.add_filter(_id,ui.values)
                        $this.filter()
                      },
                      slide: function( event, ui ) {
                        var id = $(this).attr('id')
                        var _id= id.substring(0,id.length-ext.length)
                        //set handle values
                        $("#"+id+"_handle0").text(ui.values[ 0 ])
                        $("#"+id+"_handle1").text(ui.values[ 1 ])
                      }

                    });
                    // add reference to input element to bind update
                }else{
                    $("#filters").append(this.get_multi_select(a,this.catalog[a],this.catalog_counts[a]))
                }
           }
         }
    }
    add_to_catalog(col,val){
        if(typeof(this.catalog[col])=="undefined"){
               this.catalog[col]=[val]
               this.catalog_counts[col]=[1]
            }else{
                //populate with any new value
                var array_index=$.inArray(val,this.catalog[col])
                if (array_index==-1){
                    this.catalog[col].push(val)
                    this.catalog_counts[col].push(1)
                }else{
                    this.catalog_counts[col][array_index]+=1
                }
            }
    }
     get_multi_select(id,options,counts){
        var html=""
        var _id = id.replaceAll(" ", "__");
        html+="<label class='form-label' for='"+_id+"'>"+id+"</label>"
        html+="<div class='form-group filter_list' name='"+_id+"' id='"+_id+"' >"
        for (var o in options){
            var val = options[o];
            var text=options[o];
            if(text==""){
                text=LANG.SEARCH.BLANK
            }
            var count = ""
            if (counts){
               count = counts[o]
            }
            html+='<label class="list-group-item d-flex justify-content-between list-group-item-action">'
            html+='<span><input class="form-check-input me-1 align-left" type="checkbox" value="'+val+'">'+text+'</span>'
            html+='<span class="badge bg-primary rounded-pill">'+count+'</span></label>'
        }

        html+=" </div>"
        return html

    }
     get_range_slider(id,min,max){
        var _id = id.replaceAll(" ", "__");
        var html=""
        html+="<label class='form-label' for='"+_id+"'>"+id+"</label>"
        html+="<div id='"+_id+"_slider' class='slider-range'><div id='"+_id+"_slider_handle0' class='ui-slider-handle'>"+min+"</div><div id='"+_id+"_slider_handle1' class='ui-slider-handle'>"+max+"</div>"
        html+="</div>"
        return html
    }

    //-----------
    show_section(section_id){
        var $this=this
        var section_id=section_id.replaceAll('section_id_', '')
        var data = $this.section_manager.get_match(section_id)

        var item_ids=[]

         var items_showing=$this.section_manager.json_data[section_id].items_showing
         if($('#'+"section_id_"+section_id).is(':checked')){
            for (var i=0;i<data.length;i++){
                if(data[i]?.feature){
                    if($.inArray( data[i]._id, items_showing)==-1){
                        item_ids.push(data[i]._id);
                    }else{
                        console.log("ALREADY IN ARRAY ",data[i]._id)
                    }
                }
            }
         }else{
            // we are hiding, take all showing features
            item_ids= [...items_showing]
         }
         $this.show_items(section_id,item_ids)
//         console.log("FIT THE BOUNDS ..........")
         if(!$this.has_earth_param){
         //layer_manager.map.fitBounds(layer_manager.layers[layer_manager.layers.length-1].layer_obj.getBounds());
         }
         $this.has_earth_param=false
    }
    list_results(section_id){
        var $this = this
        //set initial variables
        $this.showing_id=section_id;
        $this.filters={};// reset filters


        $this.section_manager.slide_position("results");
        //move to the results panel and list all the items
        // each items visibility is stored in the filter manager - if showing

        var items_showing=$this.section_manager.json_data[section_id].items_showing
        var data = $this.section_manager.get_match('section_id_'+section_id)

        $this.generate_filters(data,$this.section_manager.json_data[section_id].filter_cols)
        $this.add_filter_watcher();
        var title_col=$this.section_manager.json_data[section_id]["title_col"]
        $this.sort_data(data,title_col)
    }
    show_sorted_results(section_id){
       //take the subset and short by title

        if(!this.subset_data){
            this.subset_data=this.section_manager.json_data[section_id].all_data
        }
        this.sort_data(this.subset_data)
    }
    sort_data(data,sort_col){
        if(!sort_col){
            // use the default if none is provided
            sort_col="_sort_col"
        }

        var sort_dir=$('#list_sort').val()

        var sorted_data= [...data]

       if(sort_dir!=''){
           sorted_data= sorted_data.sort((a,b) => (a[sort_col] > b[sort_col] ) ? 1 : ((b[sort_col]  > a[sort_col] ) ? -1 : 0))
        }
        if (sort_dir=='desc'){
              sorted_data.reverse()
        }

        this.show_results(sorted_data)
    }

    show_items(_id,item_ids){
        return
        //toggle the layer but only show the specific item id
        // note: we'll want to pass an array of ids to
        layer_manager.toggle_layer("section_id_"+_id,"csv_geojson",JSON.parse(this.section_manager.json_data[_id].drawing_info.replaceAll('\n', '')),false,100,item_ids)
    }
    zoom_item(_id,item_id){
          var data = this.section_manager.get_match('section_id_'+_id)
            for (var i=0;i<data.length;i++){
                if(item_id==data[i]._id){
                    if(data[i]?.feature){
                      map_manager.map_zoom_event(L.geoJSON(data[i].feature).getBounds())
                    }

                    break
                }

            }
    }
    click_item(_id,item_id){
          var data = this.section_manager.get_match('section_id_'+_id)
            for (var i=0;i<data.length;i++){
                if(item_id==data[i]._id){
                    if(data[i]?.feature){
                        console.log(data[i].feature)
                           // map_manager.map_click_event(L.geoJSON(data[i].feature).getBounds().getCenter())
                           // map_manager.show_popup_details(data[i].feature.features)
                         map_manager.click_lat_lng=L.geoJSON(data[i].feature).getBounds().getCenter()
                         map_manager.popup_show(data[i].feature.features[0])
                    }

                    break
                }

            }
    }

    get_child_ids(data,list){
        //loop over the filtered data and if a child id exists - add it to the array
         var children =[];

         for (var i=0;i<data.length;i++){

           if(list.includes(Number(data[i]._id))){
                // note we are checking the parent "children" values against the the child '_id'
                // this ._id value is only unique per collection
                children.push(data[i]._id)
           }
         }
         return children
    }
    get_add_button(section_id,item_id){
        // A reusable button group that shows the add button
        var text = LANG.RESULT.ADD
         var id = "item_"+section_id+"_"+item_id;
         var item = this.get_item(section_id,item_id);
         var func ="layer_manager.add_layer_toggle"
         //console.log(section_id,item_id,item)
        // check if the layer has been added
        if(layer_manager.is_on_map(section_id+"_"+item_id)){
            text = LANG.RESULT.REMOVE
        }

        if(item.child_ids.length>0){
            text = this.get_parent_text(section_id,item_id)
            func="filter_manager.show_layers"
        }

       return "<button type='button' id='"+id+"_toggle' class='btn btn-primary "+id+"_toggle' onclick='"+func+"("+section_id+","+item_id+")'>"+text+"</button>"+"<br/>"
        +"<button type='button' class='btn btn-primary "+id+"_zoom' style='display:none;' onclick='layer_manager.zoom_layer(\""+section_id+"\",\""+item_id+"\")'>"+LANG.RESULT.ZOOM+"</button>"
    }
    get_parent_text(section_id,item_id){
        var item = this.get_item(section_id,item_id);
        var displayed=0

        // we need to get the count of the children that are on the map
         for (var i=0;i<item.child_ids.length;i++){
            if(layer_manager.is_on_map(section_id+"_"+item.child_ids[i])){
                displayed+=1
            }
         }

        return LANG.RESULT.ADD+" - "+displayed+"/"+item.child_ids.length
    }
    update_parent_but(section_id,item_id){
        // when a child layer is added, update the parent text to reflect the number of children on the map
        if(item_id){
            var id = "item_"+section_id+"_"+item_id;
            $("."+id+"_toggle").html(this.get_parent_text(section_id,item_id));

        }
    }
    show_layers(section_id,item_id){
         // create a panel allowing the individual layers to be added
        // the thumbnail should be shown along with the name
        var $this=this;
        var title_col=$this.section_manager.json_data[section_id]["title_col"];

        // Assume other metadata is the same - todo populate this child record metadata from parent records
        var item = this.get_item(section_id,item_id);
        var section=section_manager.get_section_details(section_id)
        var html=""

        html+='<b>'+item[section.title_col]+"</b><br/>";// add the title column
        html+= '<ul class="list-group"' +'">'

        for (var i=0;i<item.child_ids.length;i++){
            var child = this.get_item(section_id,item.child_ids[i]);
            var thumb_url=section.base_url+child["CONTENTdm number"]+"/thumbnail"
            var iiif_url = child["IIIF"];
            //
            html += "<li class='list-group-item  list-group-item-action'>"
            html+='<b>'+child[section.title_col]+"</b><br/>";// add the title column
            html+='<img class="thumbnail" src="'+thumb_url+'">'+"<br/>";
            html+='<a href="javascript:void(0);" onclick="image_manager.show_image(\''+iiif_url+'\',\''+child[section.title_col]+'\',\''+child["Reference URL"]+'\');">'+LANG.DETAILS.IMAGE_VIEW+'</a>'+"<br/>";
            html+=this.get_add_button(section_id,item.child_ids[i]);
            html+="</li>";
        }
        html+="</ul>";
        $("#layers_view").html(html)
        $this.section_manager.slide_position("layers");
    }
    //
    //--
     show_results(sorted_data){
        // hide all the items
        var $this = this;
        try{
             var section_id=sorted_data[0].section_id
             // todo hide the ids better
             $this.show_items(section_id,[...$this.section_manager.json_data[section_id].items_showing])
        }catch(e){}

          var item_ids =[]
         // the sorted data could be a mix of items from multiple sections

         var html= '<ul class="list-group"' +'">'

         var title_col=$this.section_manager.json_data[section_id]["title_col"]
         for (var i=0;i<sorted_data.length;i++){
            var obj = sorted_data[i]
            obj.child_ids=[]; //keep track of the filtered child ids
            item_ids.push(obj._id)
            var items_showing = this.section_manager.json_data[obj.section_id].items_showing

            var section_id = obj.section_id
            var but_id="item_"+section_id+'_'+obj._id+"_toggle"

//             if($.inArray( sorted_data[i]._id, items_showing)>-1){
//                //check if the item is showing
//
//             }
            if(typeof(obj["children"]) !="undefined" && obj["children"]!=""){

              obj.child_ids = this.get_child_ids(sorted_data,obj["children"].split(",").map(Number))

            }
            // make sure the item isn't a child that should be nested under a parent

             if(typeof(obj.parent_id) =="undefined" || obj.parent_id==""){
                // if the item doesn't have a parent
                 var item_html = "<li class='list-group-item d-flex justify-content-between list-group-item-action'>"

                 item_html+='<a href="#">'+obj[title_col]+'</a>'
                 item_html+='<button type="button" class="btn btn-primary" onclick="filter_manager.select_item('+section_id+','+obj._id+')">Details</button>'
                 item_html+=this.get_add_button(section_id,obj._id)


                 item_html+="</span>";

                 item_html+="</li>";
                // skip adding the parent if it has not children
//                if(obj["children"]!="" && obj.child_ids.length==0){
//                    item_html=""
//                }
                html+=item_html;
             //}else{


             }
        }
        html+="</ul>";

        $("#results_view").html(html)
        // todo show the ids better
        if(item_ids.length>0){
            $this.show_items(section_id,item_ids)
        }

        //
        $('#result_wrapper').animate({
                scrollTop: 0
            }, 1000);
         $this.update_results_info(sorted_data.length)

    }
    get_item(_id,item_id){
        var data = this.section_manager.get_match('section_id_'+_id)
        var item;
        for (var i=0;i<data.length;i++){
                if(item_id==data[i]._id){
                    return data[i]
                }
         }

    }
    select_item(section_id,item_id){
     //analytics_manager.track_event("side_bar","show_details","layer_id",_resource_id)
        // use the id of the csv
         var item= this.get_item(section_id,item_id)
         var section=section_manager.get_section_details(section_id)
         console.log(item)
         //return
//        this.show_match(match)
//        //for reference track the selected page
//        this.page_id=id
//        this.page_num=this.get_page_num(id)
//        // add the page number to the address for quicker access via link sharing
//        //this.filters['p']=this.page_num
//        this.save_filter_params()

        //
        this.show_details(item,section)
        section_manager.slide_position("details")
    }

    show_details(match,section){
        // @param match: a json object with details (including a page path to load 'path_col')
        //create html details to show
        var html="";
        var section_id = match.section_id;
        var item_id=match._id;

        var thumb_url=section.base_url+match["CONTENTdm number"]+"/thumbnail"
        var iiif_url = match["IIIF"];
        html+=this.get_add_button(section_id,item_id);
        html+='<span class="fw-bold">Title:</span> '+match[section.title_col]+"<br/>";// add the title column
        html+='<img src="'+thumb_url+'">'+"<br/>";
        html+='<a href="javascript:void(0);" onclick="image_manager.show_image(\''+iiif_url+'\',\''+match[section.title_col]+'\',\''+match["Reference URL"]+'\');">'+LANG.DETAILS.IMAGE_VIEW+'</a>'+"<br/>";

        for (var i in match){
            if ($.inArray(i,section.show_cols)!=-1){
                var link = match[i]
                if ((typeof link === 'string' || link instanceof String) && link.indexOf("http")==0){
                   link="<a href='"+link+"' target='_blank'>"+link+"</a>"
                }
                // only show if not blank
                if(link!=""){
                    html+="<span class='fw-bold'>"+i+":</span> "+link+"<br/>"
                }
            }
        }
        // generate a table from the table_data_cols
        // these could be any number of columns of the same size so they can be combined into a table
        var table_data =[]
        for (var c in this.table_data_col){
            if(match[this.table_data_col[c]].indexOf(",")>-1){
                table_data.push(match[this.table_data_col[c]].split(','))
            }else{
                table_data.push(match[this.table_data_col[c]])
            }

        }

      //check that there is data
//      if(table_data[0].length==1 && match.usable_links.length>0){
//         // temporarily get the details from the ESRI metadata
//         this.load_json(match.usable_links[0][0]+"?f=json",this.show_loaded_columns)
//
//      }else{
//            html+=this.table_manager.get_combined_table_html(this.table_data_col,table_data)
//
//        }
        $("#details_view").html(html)
    }

}
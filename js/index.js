

//
var map_manager;
var map_layer;
var layer_manager;
var table_manager;
var click_marker;
var side_by_side_control
var rects;// the layer group
var layer_rects=[]
var rect_requests=[];// used to store all the rectangles requests
var image_manager

var field_data_post_url// from the app.csv

var transcription
var transcription_mode =false;

var params={}
var last_params={}
var usp={};// the url params object to be populated
var browser_control=false; //flag for auto selecting to prevent repeat cals
var show_hidden_controls=true;


function setup_params(){
     usp = new URLSearchParams(window.location.search.substring(1).replaceAll("~", "'").replaceAll("+", " "))

    if (window.location.search.substring(1)!="" && $.isEmptyObject(params)){
       if (usp.get('f')!=null){
            params['f'] = rison.decode("!("+usp.get("f")+")")
        }
        if (usp.get('e')!=null){
            params['e'] =  rison.decode(usp.get('e'))
        }

        if (usp.get('l')!=null && usp.get('l')!="!()"){
            params['l'] =  rison.decode(usp.get('l'))
        }

        // debug mode
        if (usp.get('d')!=null){
           DEBUGMODE=true
        }
    }
}
$( function() {

    $.getJSON('i18n/en.json', function(data){
            LANG=data
            initialize_interface()
    });
  //  $(".hidden_controls").hide();

});

function initialize_interface() {

    var sort_str=""
    if(!$.isEmptyObject(usp) && usp.get("sort")){
        sort_str=usp.get("sort")
    }
    $("#filter_date_label").text(LANG.SEARCH.DATE_LABEL)
    $("[for='filter_bounds_checkbox']").text(LANG.SEARCH.LIMIT)
    $("#filter_date_to").text(LANG.SEARCH.TO)
    $("[for='filter_date_checkbox']").text(LANG.SEARCH.LIMIT_DATE)

    $("#radio_data_label").text(LANG.SEARCH.RADIO_DATA_LABEL)

    $("#radio_place_label").text(LANG.SEARCH.RADIO_PLACE_LABEL)


    $('#toggle_hidden_checkbox').change(function() {
        if($(this).prop('checked') == true){
            show_hidden_controls=true
              $(".hidden_controls").show();
        }else{
             show_hidden_controls=false
             $(".hidden_controls").hide();
        }
       run_resize();
    });

    $("#map_search").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: "https://nominatim.openstreetmap.org/search?format=json",
                dataType: "json",
                data: {
                    q: request.term
                },
                success: function(data) {
                    var data = $.map(data, function(obj) {
                        return {
                            label: obj.display_name
                        };
                    });
                    response(data);
                }

            });
        },
         select: function( event, ui ) {
                $("#search_but").trigger("click");
            },
        minLength: 1,
    });

    setup_params()


    map_manager = new Map_Manager(
     {params:params['e'] ,
        lat:40.111,
        lng: -104.1378635,
        z:7
        })
      table_manager = new Table_Manager({
        elm_wrap:"data_table_wrapper",
          elm:"data_table"})


    map_manager.init()


     // allow for iiif viewing
     image_manager=new Image_Manager({})
     image_manager.init()

     if(params['id']){
        //todo need to capture the variable
       //image_manager.show_image(iiif_base_url+params['id']+"/info.json","")
     }
     layer_manager = new Layer_Manager({
        map:map_manager.map,
        layers_list:params['l'],
        service_method:services//loaded in html

      })

      layer_manager.add_basemap_control()


    section_manager=new Section_Manager({config:"app.csv",map_manager:map_manager})
    filter_manager = new Filter_Manager({
        section_manager:section_manager,
        params:params['f'],
        place_url:'https://nominatim.openstreetmap.org/search?format=json',
    });
    section_manager.init();

}
function after_filters(){
    run_resize()
    add_back_but_support();
     analytics_manager = new Analytics_Manager();


    init_tabs();
    setTimeout(() =>{

        if ( layer_manager.layers_list){
            browser_control = true
             for (var i =0;i<params['l'].length;i++){
                var parts=params['l'][i].id.split("_")
                layer_manager.add_layer_toggle(parts[0],parts[1])
            }
            browser_control = false
        }
        },1000)
}




function save_marker_data(_data){
    map_manager.data = $.csv.toObjects(_data);
    check_all_loaded();

}


function save_params(){
    if (browser_control){
        return
    }
    var p = "/?f="+encodeURIComponent(rison.encode(filter_manager.filters))
    +"&e="+rison.encode(map_manager.params)

    if(layer_manager && typeof(layer_manager.layers_list)!="undefined"){
        p+="&l="+rison.encode(layer_manager.layers_list)
    }

    //p+='&t='+$("#tabs").find(".active").attr("id")
    if(typeof(filter_manager.panel_name)!="undefined"){
        // add the panel if available
        p+="/"+filter_manager.panel_name;
    }
    if(typeof(filter_manager.display_resource_id)!="undefined"){
        // add the display_resource_id if available
        p+="/"+filter_manager.display_resource_id;
    }


    if (filter_manager.sort_str){
        p +="&sort="+filter_manager.sort_str
    }

    // retain debug mode
    if (DEBUGMODE){
        p +="&d=1"
    }


    // before saving the sate, let's make sure they are not the same
    if(JSON.stringify(p) != JSON.stringify(last_params) && !browser_control){
        window.history.pushState(p, null, p.replaceAll(" ", "+").replaceAll("'", "~"))
        last_params = p
    }
}


load_annotation_geojson= function(url,extra){
    rect_requests.push(url)

    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        extra:extra,
        success: function(json) {
         parse_annotation(json,extra);
         //when all the rects have been requested
            create_rect_group();
         }
     });
}
create_rect_group=function(){
    if(layer_rects.length==rect_requests.length){
        rects=L.layerGroup(layer_rects , {pane: 'left'})
        rects.addTo(map_manager.map);
     }
}
parse_annotation= function(json,extra){
         var rect = L.geoJson(json, {pane: 'left',color: 'blue'})//todo get this from app.csv
         rect.title=extra["title"]
         rect.tms=extra["tms"]
         rect.url=extra["Image URL"]
         rect['annotation_url']=extra['annotation_url'];
         rect.toggle="<i class='bi bi-map'></i>"
         layer_rects.push(rect)
         rect.id=layer_rects.length-1
         rect.on('click', function () {
            toggle_layer(this.id)
            this.off('click')
         });

}

update_layer_list=function(){
    var html=""
    var map_bounds=map_manager.map.getBounds()
    for(var i =0;i<layer_rects.length;i++){
        if(map_bounds.intersects(layer_rects[i].getBounds())){

            html+=layer_rects[i].title+"  <a target='_blank' title='Show Original Overlay Map' href='"+layer_rects[i].url+"'><i class='bi bi-image'></i></a> <a id='layer_but_"+i+"' href='#' onclick='toggle_layer("+i+");' title='Show Overlay Map in View'>"+layer_rects[i].toggle+"</a>"
            html+=" <div id='layer_but_spin_"+i+"' style='display:none;' class='spinner-border spinner-border-sm' ></div>"+"<br/>"

        }

    }
    $("#layer_list").html(html)
}

remove_side_by_side = function(){
    var hide_control=true
    for(var i = 0; i<layer_rects.length;i++){
       if(layer_rects[i].toggle=='hide'){
            hide_control=false
       }
    }

    if(hide_control){
         side_by_side_control.remove(map_manager.map);
        side_by_side_control = null
    }
}


function connect_transcription(_data){
     var data = $.csv.toObjects(_data);
     for(var i=0;i<data.length;i++){
            console.log(data[i])
     }
}


function copyElementToClipboard(element) {
  window.getSelection().removeAllRanges();
  let range = document.createRange();
  range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
}

function init_tabs(){
    $("#search_tab").text(LANG.TAB_TITLES.BROWSE_TAB)
    $("#map_tab .label").text(LANG.TAB_TITLES.MAP_TAB)
    $("#download_tab").text(LANG.TAB_TITLES.DOWNLOAD_TAB)
    $(".tab_but").click(function() {
        $(".tab_but").removeClass('btn-primary').addClass('btn-secondary');
        $(this).removeClass('btn-secondary').addClass('btn-primary');
        // hide all tab_panels
         $(".tab_panel").hide()
         // show only this one by assuming it's name from the button
         var tab_panel_name = $(this).attr("id").substring(0,$(this).attr("id").indexOf("_"))+"_panel_wrapper"

         $("#"+tab_panel_name).show()
         save_params()

    });

     setTimeout(function(){
        section_manager.slide_position()
    }, 1000);
    // click the tab and slide to the panel as appropriate
    if( !$.isEmptyObject(usp) && usp.get("t")){

       move_to_tab(usp.get("t"))
    }
}
function move_to_tab(tab_str){
    var tab_parts = tab_str.split("/")

    // move to the set search panel
    if(tab_parts.length>1){
        section_manager.slide_position(tab_parts[1])
    }
    if(tab_parts.length>2){
       filter_manager.display_resource_id = tab_parts[2]
    }

   //auto click the tab for state saving
   $("#"+tab_parts[0]).trigger("click")
}
function add_back_but_support(){
    // enable back button support
    window.addEventListener('popstate', function(event) {
        var _params={}
        usp = new URLSearchParams(window.location.search.substring(1).replaceAll("~", "'").replaceAll("+", " "))

            if (usp.get('f')!=null){
                _params['f'] = rison.decode("!("+usp.get("f")+")")
            }
            if (usp.get('e')!=null){
                _params['e'] =  rison.decode(usp.get('e'))
            }

            if (usp.get('l')!=null && usp.get('l')!="!()"){
                _params['l'] =  rison.decode(usp.get('l'))
            }
            browser_control=true
             console.log("BACK buttton handeler")
    //        filter_manager.remove_filters()
    //        filter_manager.filters=[]
    //        $("#filter_bounds_checkbox").prop("checked", false)
    //        filter_manager.set_filters(_params['f'])
    //        filter_manager.filter()

            move_to_tab( usp.get("t"))


            map_manager.move_map_pos( _params['e'])
            browser_control=false

    }, false);
}


//prevent calling many times during window resize
var timeout_resizer;

function run_resize() {
    if(timeout_resizer){
        clearTimeout(timeout_resizer)
        clearTimeout(timeout_resizer)
    }
    timeout_resizer= setTimeout(function(){
        run_resize_do()
        window_resize_do();
    },200)
 }
 $(window).resize(run_resize)
function run_resize_do(){
         // leave on the dynamic links - turn off the hrefs
         $("#browse_panel .card-body a").attr('href', "javascript: void(0)");

         // rely on scroll advance for results
         $("#next_link").hide();


        // update paging
//            filter_manager.update_parent_toggle_buttons(".content_right")
//            filter_manager.update_parent_toggle_buttons("#details_panel")
//            filter_manager.update_toggle_button()
        if(! DEBUGMODE){
            $("#document .page_nav").hide()
        }else{
            //append d=1, so that debug mode remains
            $("#document .page_nav a").each(function() {
               $(this).attr("href",  $(this).attr("href") + '&d=1');
            });
        }
        $("#content").show();
        map_manager.map.invalidateSize()

        image_manager.image_map.invalidateSize()
}

 function window_resize_do(){
     var data_table_height=0
         if( $("#data_table_wrapper").is(":visible")){
           data_table_height= $("#data_table_wrapper").height()
        }
        var header_height=$("#header").outerHeight()+100;
        var footer_height=15//$("#footer").height()
        var window_height= window.innerHeight
        var window_width=window.innerWidth
        var minus_height=header_height+footer_height
//        console.log(window.innerHeight,"CONTENT HEIGHT",window_height,minus_height,header_height,footer_height)
       $("#content").height(window_height-minus_height)

       $("#map_wrapper").height()
       //this gets out of hand with too many results
       var scroll_height=window_height-minus_height-$("#side_header").outerHeight()
       if(scroll_height>800){
        scroll_height=800;
       }
       //-$("#tabs").outerHeight()-$("#nav_wrapper").outerHeight()
       $("#panels").height(scroll_height)
       $(".panel").height(scroll_height);

       if(!show_hidden_controls){
            $(".filter_list").height(scroll_height-40);
        }else{
            $(".filter_list").height(200);
        }

//        $("#map_panel_wrapper").height(window_height-$("#tabs").height()-minus_height)
//        $("#map_panel_scroll").height(window_height-$("#tabs").height()-minus_height)

            //
//       $("#tab_panels").css({'top' : ($("#tabs").height()+header_height) + 'px'});

//       .col-xs-: Phones (<768px)
//        .col-sm-: Tablets (≥768px)
//        .col-md-: Desktops (≥992px)
//        .col-lg-: Desktops (≥1200px)


       if (window_width >768){

            // hide the scroll bars
            $('html, body').css({
                overflow: 'hidden',
                height: '100%'
            });
            $("#map_wrapper").width(window_width-$("#side_bar").width()-1)
            $("#data_table_wrapper").width(window_width-$("#side_bar").width()-1)

            map_manager.map.scrollWheelZoom.enable();
            $("#side_bar").show();
       }else{
             //mobile view

             // scroll as needed
             $('html, body').css({
                overflow: 'auto',
                height: 'auto'
            });

            // drop the map down for mobile
            $("#map_wrapper").width(window_width)
            $("#data_table_wrapper").width(window_width)

            map_manager.map.scrollWheelZoom.disable();
             $("#side_bar").hide();
       }
        //final sets
        $("#panels").width($("#side_bar").width())
        $(".panel").width($("#side_bar").width())
        if(map_manager){
            map_manager.map.invalidateSize()
        }
        // slide to position
         $("#panels").stop(true, true)
         // if we are on the search tab, make sure the viewable panel stays when adjusted
        if("search_tab"==$("#tabs").find(".active").attr("id")){
            section_manager.slide_position(section_manager.panel_name)
        }

        $("#result_wrapper").css({"height":scroll_height-$("#filter_area").height()})
 }

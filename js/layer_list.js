L.Control.LayerList = L.Control.extend({
    onAdd: function(map) {
        var div = L.DomUtil.create('div');
        div.id = 'layer_list_wrapper';
        var div_title = L.DomUtil.create('div','',div);
        div_title.id = 'layer_list_title';
        var div_content = L.DomUtil.create('div','',div);
        div_content.id = 'layer_list';


        L.DomEvent.disableClickPropagation(div)
//        console.log(div)
        return div;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.layer_list = function(opts) {
    return new L.Control.LayerList(opts);
}


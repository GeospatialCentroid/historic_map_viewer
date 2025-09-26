L.Control.LocationSearch = L.Control.extend({
    onAdd: function(map) {
        var div = L.DomUtil.create('div');

        div.id = 'location_search';
        L.DomEvent.disableClickPropagation(div)
        return div;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.location_search = function(opts) {
    return new L.Control.LocationSearch(opts);
}


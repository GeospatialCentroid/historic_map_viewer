//https://github.com/usablica/intro.js

const tourSteps = [
  {
    intro: "Colorado State University Libraries Historic Map Explorer allows you to browse maps in our collection. The interface is composed of two main areas."
  },
  {
   element: "#side_bar",
    intro: "The sidebar on the right is were you can filter and navigate the collection. To view a historic map, click the <b>Add</b> button in the results pane.",
    position: "right"
  },
  {
    element:"#map",
    intro: "The map area is where historic maps are displayed. The map points represent available maps matching your search.",
    position: "top"
  },
  {
    element: "#map_tab",
    intro: "The map tab shows all the layers added to the map. This tab allows you to control layer transparency, drawing order, and enable split view.",
    position: "bottom",
    onafterchange: () => {
      document.querySelector("#map_tab")?.click();
    }

  },
  {
    intro: "Thanks for taking the tour! If you notice anything interesting while exploring the collection, be sure to let us know, and share a copy of the URL from the address bar along with your email.",
    position: "center"
  }
];

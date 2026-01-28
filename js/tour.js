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
    intro: "The map area is where historic maps are displayed.",
    position: "top"
  },
  {
    element: "#map_tab",
    intro: "The map tab tab shows all the layers in the map view.",
    position: "bottom",
    onafterchange: () => {
      document.querySelector("#map_tab")?.click();
    }

  },
  {
    intro: "That’s the walkthrough! You’re ready to explore!",
    position: "center"
  }
];

//https://github.com/usablica/intro.js

const tourSteps = [
  {
    intro: "Colorado State University Libraries Historic Map Explorer allows you to browse selected maps in our collection. The interface is composed of two main areas."
  },
  {
   element: "#side_bar",
    intro: "The \"Search\" tab on the left is where you can search for maps by keyword, location, year or topic. Scanned maps can be added to the dynamic map using the <b>Add</b> button. (They can be removed in the \"Map\" tab.) For non-georeferenced maps, click <b>View</b> to display the scanned map.",
    position: "right",
    action: "run",
    fn: "show_results"
  },
  {
    element:"#map",
    intro: "The dynamic map area is where the scanned maps are displayed in their geographic location. The colored points indicate the locations of where scanned maps exist.",
    position: "top"
  },
  {
    element: "#map_tab",
    intro: "The \"Map\" tab lists the layers that have been added to the map and allows you to adjust layer transparency, drawing order, and enable split view. You can also change the base maps here.",
    position: "bottom",
    action: "run",
    fn: "show_map_tab",

  },
  {
    intro: 'Thanks for taking the tour! Please <a href=mailto:archives@colostate.libanswers.com">email</a> us if you notice anything interesting while exploring the collection, and be sure to include a copy of the URL from the address bar along with your email.',
    position: "center",
     action: "run",
    fn: "show_browse",
  }
];

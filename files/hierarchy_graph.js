var dat, layout; // Global debugging variables.

var width = 960,
    height = 500;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("defs").selectAll("marker")
    .data(["arrow-head"])
  .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");

var viewport = svg.append("g")
  .attr("id", "viewport");

// PuppetDB spent a lot of blood and sweat decomposing the resource titles...
// but we're going to stick them back together because we need a scalar value
// to identify nodes.
//
// TODO: This should probably be replaced with a titlehash function that
// computes the resource SHA used to order graph traversal.
var resource_ref = function(object){
  return object.type + "[" + object.title + "]"
}

// Classify resources based on a couple of types and whether or not they
// contain children.
var classify_resource = function(resource) {
  if (resource.type === "Node" || resource.type === "Stage") {
    return "node";
  } else if (resource.type === "Class") {
    return "class";
  } else if (_.has(resource, "children")) {
    return "defined_type"; // Guess it could also be Schedule or something...
  } else {
    return "resource";
  }
}

d3.json("data/catalog.json", function(error, catalog){
  // For Puppet catalogs, the top level contains two objects: data and
  // metadata. Currently, metadata isn't that interesting so we peel it off.
  catalog = catalog.data;
  dat     = catalog; // Global debugging variable.

  // Used to match edge source and targets to resources. Uses the underscore
  // find method to return the first match and the memoize method to avoid
  // scanning the resource list more than once for each resource.
  //
  // Using resource_ref as a hash function is important. The default hasher for
  // memoize will cause one value to be looked up and then always returned.
  var find_resource = _.memoize(function(query){
    return _.find(catalog.resources, function(resource){
      return (query.type === resource.type) && (query.title === resource.title);
    });
  }, resource_ref);

  _.each(catalog.edges, function(edge){
    // Resolve the lightweight references in the edge array to full references
    // to objects in the resources array.
    edge.source = find_resource(edge.source);
    edge.target = find_resource(edge.target);
  });

  // Create an index that can be used to quickly look up all edges of a given
  // type grouped by source node.
  catalog.edge_index = d3.nest()
    .key(function(d){ return d.relationship; })
    .key(function(d){ return resource_ref(d.source); })
    .map(catalog.edges, d3.map);

  // Containment is special as it imposes a hierarchy. Walk all nodes with
  // "containment" edges and add a reference to their children.
  //
  // forEach is safe here as the object is a d3 map.
  catalog.edge_index.get('contains').forEach(function(key, values){
    source = values[0].source;
    source.children = _.pluck(values, 'target');
  });

  // Assumption: The containment graph is rooted at `Stage[main]`.
  // This isn't always true, but holds in most cases.
  catalog.root = find_resource({"type": "Stage", "title": "main"});

  draw_graph(catalog);

});

var draw_graph = function(catalog) {

  viewport.attr("transform", "translate(40,0) rotate(-90," + height / 2 + "," + height / 2 + ")" );

  layout = d3.layout.tree()
    .size([height, width - 160]);

  layout.nodes(catalog.root);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y]; });

  var node_colors = d3.scale.ordinal()
    .domain(["node", "resource", "class", "defined_type"])
    .range(colorbrewer.Set1[4]);

  var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d) { return _.escape(resource_ref(d)); });
  svg.call(tool_tip);

  var link = viewport.selectAll(".link")
      .data(_.flatten(catalog.edge_index.get("contains").values())) // Equivalent to filtering the edge array.
    .enter().append("path")
      .attr("class", "link")
      .attr("d", diagonal)

  var node = viewport.selectAll(".node")
      .data(catalog.resources)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .attr("fill", function(d) { return node_colors(classify_resource(d)); })
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .on("mouseover", tool_tip.show)
      .on("mouseout", tool_tip.hide);
}

var transition_to_cartesian = function(){
  d3.select("#viewport")
    .transition()
    .duration(2000)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ") rotate(-90)")
    .transition()
    .duration(2000)
    .attr("transform", "translate(40,0) rotate(-90," + height / 2 + "," + height / 2 + ")" );

  layout = d3.layout.tree()
    .size([height, width - 160]);

  layout.nodes(dat.root);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y]; });

  d3.selectAll(".link")
    .transition()
    .duration(2000)
    .delay(2000)
    .attr("d", diagonal);

  d3.selectAll(".node")
    .transition()
    .duration(2000)
    .delay(2000)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

}

var transition_to_polar = function(){

  d3.select("#viewport")
    .transition()
    .duration(2000)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ") rotate(-90)")
    .transition()
    .duration(2000)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  // The sign on the 360 controls which direction nodes lay in the resulting
  // circle.
  layout = d3.layout.tree()
    .size([-360, width / 2 - 120])
    .separation(function(a, b) { return (a.parent === b.parent ? 1 : 2) / a.depth; });

  layout.nodes(dat.root);

  var diagonal = d3.svg.diagonal.radial()
    .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

  d3.selectAll(".link")
    .transition()
    .duration(2000)
    .attr("d", diagonal);

  d3.selectAll(".node")
    .transition()
    .duration(2000)
    .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

}

d3.selectAll("input").on("change", function(){
  if (this.value === "cartesian") {
    transition_to_cartesian();
  } else if (this.value === "polar"){
    transition_to_polar();
  }
});

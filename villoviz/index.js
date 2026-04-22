const url = 'https://bruxellesdata.opendatasoft.com/api/records/1.0/search/?dataset=villo-stations-beschikbaarheid-in-real-time&rows=500';
fetch(url)
  .then(response => response.json())
  .then(data => {
    render(data)
  })

function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function render(data) {
  //Width and height
  const w = 800;
  const h = 800;
  const stations = data.records

  //Define map projection
  var projection = d3.geoConicConformal()
      .center([4.37, 50.84])
      .scale(250000)
      .translate([400, 400]);

  //Define path generator
  var path = d3.geoPath()
            .projection(projection);

  //Create SVG
  var svg = d3.select("#villoviz")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  var slider = d3.select("#villoviz")
    .append("input")
    .attr("style", `width: 100%;`)
    .attr("type","range")
    .attr("id","time-slider")
    .attr("value","0")
    .attr("min","1")
    .attr("max","43")
    .attr("step","1")

  var div = d3.select("#villoviz")
    .append("div")
    .attr("style", `
        position: fixed;
        text-align: center;
        width: auto;
        height: auto;
        padding: 2px;
        font: 12px sans-serif;
        background: lightsteelblue;
        border: 0px;
        border-radius: 8px;
        pointer-events: none;
    `)
    .style("opacity", 0);

  d3.json("/villoviz/output.geojson", function(json) {
    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill","#ccc")
        .attr("stroke", "#3f87a6")

    svg.selectAll("circle")
        .data(stations).enter()
        .append("circle")
        .attr("cx", d => projection(d.geometry.coordinates)[0])
        .attr("cy", d => projection(d.geometry.coordinates)[1])
        .attr("r", d => dotSize(d.fields))
        .attr("fill", d => "#4682b4")
        .on("mouseover", function(d) {
          div.transition()
             .duration(200)
             .style("opacity", .9);
          div.html(d.fields.name + "<br/>" + d.fields.available_bikes + " Free Bikes")
             .style("left", (d3.event.clientX +5) + "px")
             .style("top", (d3.event.clientY +5) + "px");
		    })
  });

  function getFrame(stations, i) {
    return stations.slice((i-1)*348, i*348);
  }

  d3.csv("/villoviz/sorted.csv", function(stations) {
    $("#time-slider").on("input", e => {
      const i = e.target.value;
      const frame =  getFrame(stations, i);
      $("#time-indicator").text(new Date(frame[0].last_update));
      svg.selectAll("circle")
        .data(frame)
        .attr("cx", d => projection(findStation(d).geometry.coordinates)[0])
        .attr("cy", d => projection(findStation(d).geometry.coordinates)[1])
        .on("mouseover", function(d) {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html(d.name + "<br/>" + d.available_bikes + " Free Bikes")
            .style("left", (d3.event.clientX +5) + "px")
            .style("top", (d3.event.clientY +5) + "px");
          })
        .transition()
        .attr("fill", d => "#4682b4")
        .duration(1000)
        .attr("r",  d => dotSize(d))
    })
  })

  function findStation(station) {
    return stations.filter(s => s.fields.number == station.number)[0]
  }

  function color(station, i) {
    const free = (station.available_bikes / station.bike_stands);
    return station.status === "CLOSED" || !free ? "red" : colorBySlope(station, i);
  }

  let previousData = d3.local();

  function colorBySlope(station, i) {
    const prev = previousData.get(this);
    previousData.set(this, station);
    if (!prev) {
      return "blue";
    }
    if (prev.available_bikes - station.available_bikes === 0) {
      return "#4682b4"
    } else if (prev.available_bikes - station.available_bikes > 0) {
      return "tomato"
    } else {
      return "green"
    }
  }

  function colorByAvailability(station) {
    const free = (station.available_bikes / station.bike_stands);
    const r = 0;
    const g = Math.round(map_range(free, 0, 1, 127, 255));
    const b = Math.round(map_range(free, 0, 1, 0, 127));
    const a = Math.round(map_range(free, 0, 1, 0.5, 1));
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  function dotSize(station) {
    if (station.status === "CLOSED") {
      return 2;
    } else return map_range((station.available_bikes / station.bike_stands), 0, 1, 2, 12);
  }
}


var mapboxAccessToken = 'pk.eyJ1IjoibWpib3ZlZSIsImEiOiJjanMyZmEwd2cwMDB1NDRsN29wczE4MWJnIn0.z_32ibKt2idp3gdsLE4QDg'

// make leaflet base map
var map = L.map('map').setView([39, -105.547222], 7)

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.light'
}).addTo(map)

// overlay d3 svg onto leaflet base map
var svg = d3.select(map.getPanes().overlayPane).append('svg')
var g = svg.append('g').attr('class', 'leaflet-zoom-hide')

// assign color to census block based on income - can change values as seen fit
var color = d3.scaleLinear()
    .domain([20000, 150000])
    .range(['#e6deff', '#58508d'])

// load data to lay on top of basemap
queue()
    .defer(d3.json, '../colorado-data/tracts.json')
    .defer(d3.csv, '../colorado-data/incomeData.csv')
    .defer(d3.json, '../colorado-data/secData.json')
    .await(ready)

function ready(error, tracts, income, firms) {
    if (error) return console.log(error)

    // apply income data from csv to census tract geojson
    var incomeByTractId = {}

    income.forEach(function(d) {
        incomeByTractId[d.GEOID] =+ d.HC03_EST_VC02
    })

    tracts.features.forEach(function(d) {
        d.income = incomeByTractId[d.properties.GEOID]
    })

    // make d3 and leaflet play together
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x))
        this.stream.point(point.x, point.y)
    }

    var transform = d3.geoTransform({
        point: projectPoint
    })

    var path = d3.geoPath().projection(transform)

    var tractFeature = g.selectAll('tracts')
        .data(tracts.features)
        .enter().append('path')

    var firmsFeature = g.selectAll('firms')
        .data(firms.features)
        .enter().append('path')

    // draw layers
    map.on('moveend', reset)
    reset()

    function reset() {
        var bounds = path.bounds(tracts)
        var topLeft = bounds[0]
        var bottomRight = bounds[1]
    
        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px")
            

        g.attr("transform", "translate(" + -topLeft[0] + ","  + -topLeft[1] + ")")

        tractFeature.attr('d', path)
            .attr('class', 'tracts')
            .style('fill-opacity', 0.65)
            .attr('fill', function(d) {
                return d.income ? color(d.income) : '#eee'
            })
            .attr('stroke-opacity', 0.85)
            .attr('stroke-width', 0.5)
            .attr('stroke', function(d) {
                return d.income ? color(d.income) : 'none'
            })


        firmsFeature.attr('d', path)
            .attr('class', 'points')
            .style('fill-opacity', 0.65)
            .attr('fill', '#211e35')
            .attr('stroke', '#211e35')
            .attr('stroke-width', 0.25)
            .attr('pointer-events', 'all')
       
    }

    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x))
        this.stream.point(point.x, point.y)
    }
    
}


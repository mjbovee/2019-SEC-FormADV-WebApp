var width = document.querySelector('#map').offsetWidth
var height = document.querySelector('#map').offsetHeight

d3.select(window).on('resize', resize)
d3.select('#map').on('resize', resize)

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        console.log(d)
        return d.properties.MainOfficeCity + ' ' + d.geometry.coordinates
    })

// assign color to census block based on income - can change values as seen fit
var color = d3.scaleLinear()
    .domain([20000, 150000])
    .range(['#e6deff', '#58508d'])

var projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2.25])
    .scale(width)

var path = d3.geoPath()
    .projection(projection)

var svg = d3.select('#map').append('svg')
    .attr('width', width)
    .attr('height', height )
    .call(d3.zoom()
        .scaleExtent([1, 40])
        .extent([[0, 0], [width, height]])
        .on('zoom', function() {
            svg.attr('transform', d3.event.transform)
        }))
    .append('g')
    .attr('class', 'map')

function resize() {
    width = parseInt(d3.select('#map').style('width'))
    width = document.querySelector('#map').offsetWidth
    height = document.querySelector('#map').offsetHeight

    projection
        .translate([width / 2, height / 2.25])
        .scale(width)

    d3.select('#map')
        .attr('width', width)
        .attr('height', height)

    d3.select('svg')
        .attr('width', width)
        .attr('height', height)

    d3.selectAll('path').attr('d', path)
}

svg.call(tip)

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

    svg.append('g')
        .attr('class', 'tracts')
        .selectAll('path')
        .data(tracts.features)
        .enter().append('path')
        .attr('d', path)
        .style('fill-opacity', 0.65)
        .attr('fill', function(d) {
            return d.income ? color(d.income) : '#eee'
        })
        .attr('stroke-opacity', 0.85)
        .attr('stroke-width', 0.05)
        .attr('stroke', function(d) {
            return d.income ? color(d.income) : 'none'
        })

    svg.append('g')
        .attr('class', 'points')
        .selectAll('path')
        .data(firms.features)
        .enter().append('path')
        .attr('d', path)
        .style('fill-opacity', 0.65)
        .attr('fill', '#211e35')
        .attr('stroke', '#211e35')
        .attr('stroke-width', 0.25)
        .attr('r', '3px')

                // tooltips
                .style('stroke', '#eee')
                .style('stroke-width', 0.25)
                .on('mouseover', function(d) {
                    tip.show(d)
    
                    d3.select(this)
                        .style('opacity', 1)
                        .style('stroke', '#eee')
                        .style('stroke-width', 2)
                })
                .on('mouseout', function(d) {
                    tip.hide(d)
    
                    d3.select(this)
                        .style('opacity', 0.7)
                        .style('stroke', '#eee')
                        .style('stroke-width', 0.25)
                })
             
}


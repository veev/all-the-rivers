import * as d3 from 'd3';
import { exploder } from 'd3-exploder';
import * as topojson from 'topojson'; // why does this way of importing work?
import * as turf from 'turf';
import * as _ from 'lodash';

const width = 960;
const height = 500;
let animation;

const projection = d3.geoNaturalEarth1().scale(width / 4);
console.log(projection.scale());

function scaleToMatchProjection (scaleFactor, width, height) {
	return d3.geoTransform({
		point: function(x, y) {
			this.stream.point( (x - width/2) * scaleFactor + width/2 , (y - height/2) * scaleFactor + height/2);
		}
	});
}

// const path = d3.geoPath().projection(scaleToMatchProjection(1.0,width,height))
const path = d3.geoPath().projection(projection)

let svg = d3.select("#map").append("svg")
	.attr("width", width)
	.attr("height", height);

let g = svg.append("g");

d3.json("./data/merged-rivers-topo-quantized.json", (error, data) => {
	if (error) throw error;

	console.log(data);

	const rivers = topojson.feature(data, data.objects["-"]).features
		.filter( function(d) {
			if (+d.properties.scalerank < 7) {
				return d;
			}
	});

	console.log(rivers);

	let river_map = {};
	rivers.forEach(function(feature) {
		// trying to make a hashmap where every river num (there are dups)
		// is the key, and that maps to an array of features
		// plan is to merge the features with more than one in the array
		if (!river_map.hasOwnProperty(feature.properties.name)) {
			//console.log("no key", feature.properties.rivernum)
			river_map[feature.properties.name] = [];
			river_map[feature.properties.name].push(feature);
		} else {
			//console.log("key dup", river_map[feature.properties.rivernum]);
			river_map[feature.properties.name].push(feature);
		}
	});

	// console.log(river_map);

	let rivers_all = [];
	// let setRiverNums = d3.set(d3.keys(river_map));
	// console.log(setRiverNums);

	Object.keys(river_map).forEach(function(key) {
		//console.log(key);
		//let tempObjs = topojson.feature(data, data.objects["-"].geometries.filter)
		let filtered = rivers.filter(function(d, i) {
			// console.log(i, key, d.properties.name);
			return d.properties.name === key;
		});
		
		let tempRiver = topojson.mesh(data, filtered);
		// console.log(tempRiver);
		rivers_all.push(tempRiver);
	});

	// console.log(rivers_all);

// let's get an organic list of fips
// var fips = {};
// counties.forEach(function(county) { fips[county.id - county.id % 1000] = 1; });

// var states = [];
// // and merge by fips
// Object.keys(fips).forEach(function(fip) {
// var state = topojson.merge(topology, topology.objects.counties.geometries.filter(function(d) { 
// 	return d.id - d.id % 1000 == fip; }));
// 	states.push(state);
// });

// svg_merged.append("g")
// 	.attr("id", "states")
// .selectAll(".state").append("path")
// 	.data(states)
// .enter().append("path")
// 	.attr("class", "state")
// 	.attr("d", function(d) {
// 	return path(d);
// });

	const polarScale = d3.scaleLinear()
					.domain([0, rivers.length])
					.range([0, 360])

	let riverPaths = g.append("g")
			.attr("id", "rivers")
		.selectAll("path")
			.data(rivers)
		.enter().append("path")
			.attr("d", path)
			.attr("stroke", "blue")
			.attr("fill", "none")
		.on("mouseover", function(d) {
			console.log(d.properties.name);
		});

	// g.append("g")

	// let mergedPaths = g.append("g")
	// 	.attr("id", "merged-rivers")
	// 	.selectAll("path")
	// 	.data(rivers)
	// 	.enter().append("")

	// riverPaths.append("g")
	// 		.attr("id", "merged")
	// 	.selectAll("path")
	// 		.datum(topojson.mesh(data, data.objects["-"].geometries.filter( function(d, i) {
	// 			console.log(d, i);
	// 		}))
	// 	// .data(rivers_all)
	// 	.enter().append("path")
	// 	// .classed("river", true)
	// 	.attr("d", path)
	// 	.attr("stroke", "red");

	let default_size = function(d, i) { return 100; };
	let myExploder = exploder()
					.projection(projection)
					.size(default_size);

	function addButton(text, callback) {
		d3.select("#buttons").append('button')
			.text(text)
			.on('click', function() {
				animation = clearTimeout(animation);
				myExploder.size(default_size);
				callback.call(this);
			});
	}

	function circle(d, i) {
		let t = polarScale(i);
		let r = (height/2) * 0.8;
		let x = width/2 + r * Math.cos(t);
		let y = height/2 + r * Math.sin(t);
		return [x, y];
	}
	addButton('circle', function(d, i) {
		console.log('adding button');
		rivers.transition()
			.duration(500)
			.call(myExploder.position(circle));
	});

	// let myExploder = exploder()
	// 				// use same projection as map
	// 				.projection(projection)
	// 				// provide a function to determine the size of each feature
	// 				.size(function(d, i) { return 40; })
	// 				// provide a function to determine the
	// 				// new (grid) positions of the features
	// 				// -> returns an [x, y] array (in pixels)
	// 				.position(function(d, i) {
	// 					let px = Math.max(0, width - (9 * 60))/2;
	// 					console.log([px + (i%60) * 40, 60 + Math.floor(i/60) * 60]);
	// 					return [px + (i%60) * 40, 60 + Math.floor(i/60) * 60];
	// 				});
	// transition to the grid
	// rivers
	// 	.transition()
	// 	.duration(500)
	// 	.call(myExploder);
});
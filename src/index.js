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

function scaleToMatchProjection(scaleFactor, width, height) {
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

	// fiter out smaller rivers
	// first get the geojson features from topojson
	// then return rivers if their scalerank is smaller than a number
	const river_features = topojson.feature(data, data.objects["-"]).features
		.filter( function(d) {
			if (+d.properties.scalerank < 6) {
				return d;
			}
	});

	console.log(river_features);

	const polarScale = d3.scaleLinear()
					.domain([0, river_features.length])
					.range([0, 360])

	let riverPaths = g.append("g")
			.attr("id", "rivers")
		.selectAll("path")
			.data(river_features)
		.enter().append("path")
			.attr("d", path)
			.attr("stroke", "blue")
			.attr("fill", "none")
		.on("mouseover", function(d) {
			console.log(d.properties.name);
		});

	const default_size = function(d, i) { return 100; };
	const myExploder = exploder()
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
	
	// --------------------------
	//
	// Circle Plot
	//
	// --------------------------
	function circle(d, i) {
		let t = polarScale(i);
		let r = (height/2) * 0.8;
		let x = width/2 + r * Math.cos(t);
		let y = height/2 + r * Math.sin(t);
		return [x, y];
	}
	addButton('circle', function(d, i) {
		riverPaths.transition()
			.duration(500)
			.call(myExploder.position(circle));
	});

	// --------------------------
	//
	// randomly ordered grid
	//
	// --------------------------
	addButton('random grid', function() {
		var rand = d3.shuffle(d3.range(river_features.length));
		riverPaths.transition()
			.duration(500)
			.call(
			myExploder.position(function(d, index) {
				var i = rand[index];
				var px = Math.max(0, width - 9*60)/2
				return [px + (i%10)*60, 70 + Math.floor(i/10)*60];
			})
		);
	});

	// --------------------------
	//
	// Realign map
	//
	// --------------------------
	addButton('reset', function() {
		riverPaths.transition()
			.duration(500)
			.attr("d", path)
			.attr("transform", "translate(0,0)");
	});
});
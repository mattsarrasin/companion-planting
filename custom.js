// general structure of custom JS was adapted from https://github.com/christophergandrud/networkD3

function(el, x) { 
	var link = d3.selectAll(".link")
	link.style("opacity", 0);
	var node = d3.selectAll(".node")
	node.select("text")
		.attr("x", function(d) { return Math.sqrt(d.nodesize)/2; });
	var lh = d3.set(d3.select(el).select('svg').selectAll('.legend').data()).size()
	var legend = d3.select(".legend")

	var g = d3.select('g')
	var height = d3.select('svg').attr('height');
	var width = d3.select('svg').attr('width');

	var legendx1 = 0
	var legendx2 = legendx1 + 30
	var legendy = 10 + lh*22
	var legendysep = 18
	var legendtextxstart = legendx2 + 5
	var legendtextystart = legendy + 5
	var pr = "Peer-reviewed"
	var susp = "Suspected"
	var ben = "beneficial"
	var det = "detrimental"
	for (i=0; i<=3; i++) {
		legend.append("line")
			.attr("x1", legendx1)
			.attr("x2", legendx2)
			.attr("y1", legendy + i*legendysep)
			.attr("y2", legendy + i*legendysep)
			.style("stroke-dasharray", function(d) {
				if(i/2<1) { return "1,0"; }
				else { return "6,6"; }})
			.style("stroke-width", 9)
			.style("opacity", 0.6)
			.style("stroke", function(d) {
				if(i%2==0) {return "#4DAF4A"; }
				else {return "#E41A1C"; }});
		legend.append("text")
			.attr("font-size", 13)
			.attr("font-family", "sans-serif")
			.attr("x", legendtextxstart)
			.attr("y", legendtextystart + i*legendysep)
			.text( function(d) {
				if(i/2<1) {
					if(i%2==0) { return pr + " " + ben; }
					else { return pr + " " + det; }
				}
				else {
					if(i%2==0) { return susp + " " + ben; }
					else { return susp + " " + det; }
				}
			});
	}

	var options = {
		opacity: 1,
		clickTextSize: 10,
		opacityNoHover: 0.1,
		radiusCalculation: "Math.sqrt(d.nodesize)+6"
	}

	var unfocusDivisor = 4;

	var links = HTMLWidgets.dataframeToD3(x.links);
	var nodes = HTMLWidgets.dataframeToD3(x.nodes);
	var nodeIndex = {};
	var linkedByIndex = {};

	for (i=0; i<nodes.length; i++) {
		nodeIndex[nodes[i]['name']] = i
		nodes[i]['index'] = i
	}

	links.forEach(function(d) {
		linkedByIndex[d.source + "," + d.target] = 1;
		linkedByIndex[d.target + "," + d.source] = 1;
	});

	function neighboring(a, b) {
		return linkedByIndex[a.index + "," + b.index];
	}

	function nodeSize(d) {
		return eval(options.radiusCalculation);
	}

	function nodemouseover(d) {
		var unfocusDivisor = 4;
		link.transition().duration(200)
			.attr("stroke-dasharray", function(l) { 
				return (l.PeerReviewed == "Yes") ? "1,0" : "6,6"; })
			.style("opacity", function(l) { return d != l.source ? 0 : 0.60 });

		node.transition().duration(200)
			.style("opacity", function(o) { return d.index == o.index || neighboring(d, o) ? +options.opacity : +options.opacity / unfocusDivisor; });
		d3.select(this).select("circle").transition()
			.duration(250)
			.attr("r", function(d){return nodeSize(d) + 3;});

		node.select("text").transition()
			.duration(250)
			.attr("x", function(d) { return Math.sqrt(d.nodesize)/2; })
			.style("stroke-width", ".5px")
			.style("font", 24 + "px ")
			.style("opacity", function(o) { return d.index == o.index || neighboring(d, o) ? 1 : 1; });

		d3.select(this).select("text").transition()
			.duration(250)
			.attr("x", nodeSize(d))
			.style("stroke-width", ".5px")
			.style("font", options.clickTextSize + "px ")
			.style("opacity", 1);
	}

	function nodemouseout() {
		node.style("opacity", +options.opacity);
		link.transition()
			.duration(250)
			.style("opacity", 0);

		d3.select(this).select("circle").transition()
			.duration(250)
			.attr("r", function(d){return nodeSize(d);});
		node.select("text").transition()
			.duration(250)
			.attr("x", function(d) { return Math.sqrt(d.nodesize)/2; })
			.style("font", options.fontSize + "px ")
			.style("opacity", 1);
	}
	// function suggested by @cjyetmen on SO: https://stackoverflow.com/questions/44110370/implementing-tooltip-for-networkd3-app/44134845#44134845
	function nodemouseclick(d) {
		d3.selectAll(".xtooltip").remove(); 
		d3.select("body").append("div")
			.attr("class", "xtooltip")
			.style("position", "absolute")
			.style("border", "1px solid #999")
			.style("border-radius", "3px")
			.style("padding", "5px")
			.style("opacity", "0.85")
			.style("background-color", "#ffff")
			.style("box-shadow", "2px 2px 6px #888888")
			.html("<b>Latin name:</b> " + "<a href=\"" + d.WikiLink + "\" target=\"_blank\">" + d.LatinName + "</a>" + "<br>" + "<b>Properties:</b>" + "<br>" + d.Properties)
			.style("left", (d3.event.pageX) + "px")
			.style("top", (d3.event.pageY - 28) + "px");
		d3.event.stopPropagation()
	}

	// function suggested by @altocumulus at SO: https://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4/38230545
	function getTransformation(transform) {
		var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
		g.setAttributeNS(null, "transform", transform);
		var matrix = g.transform.baseVal.consolidate().matrix;
		var {a, b, c, d, e, f} = matrix;   // ES6, if this doesn't work, use below assignment
		var scaleX, scaleY, skewX;
		if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
		if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
		if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
		if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
		return {
			translateX: e,
			translateY: f,
			rotate: Math.atan2(b, a) * 180 / Math.PI,
			skewX: Math.atan(skewX) * 180 / Math.PI,
			scaleX: scaleX,
			scaleY: scaleY
		};
	}
	// function suggested by @edencorbin at SO: https://stackoverflow.com/questions/46015179/d3-click-to-center-content-at-position-of-element-or-click
	function centerNode(xx, yy){
		g.transition()
			.duration(1250)
			.attr("transform", "translate(" + (width/2 - xx) + "," + (height/2 - yy) + ")scale(" + 1 + ")");
	}

	Shiny.addCustomMessageHandler("nodehl", function(l) {
		var nodeSelect = node.filter(function(d, i) { return i == nodeIndex[l];});
		var transl = getTransformation(nodeSelect.attr("transform"));
		var nodex = transl['translateX'],
			nodey = transl['translateY']
		var rel = centerNode(nodex, nodey)
		nodeSelect.dispatch('mouseover');
	});
	d3.selectAll(".node")
		.on("mouseover", nodemouseover)
		.on("mouseout", nodemouseout)
		.on("click", nodemouseclick);
	d3.selectAll(".link")
		.on("mouseover", function(o) {d3.select(this).style("opacity", 0)})
		.on("mouseout", function(o) {d3.select(this).style("opacity", 0)});
	d3.select("body").on("click", function() {
		d3.selectAll(".xtooltip").remove(); 
	});
}

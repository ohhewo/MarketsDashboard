import * as d3 from 'd3';
import './styles.css';

const width = 960;
const height = 500;
const margin = 20;
const whiteBoxPadding = 20;
const whiteBoxWidth = width - whiteBoxPadding * 2;
const whiteBoxHeight = height - whiteBoxPadding * 2;

// Colors for labs
const labColors = {
    "Lab 1": "#FFDDC1",
    "Lab 2": "#C1FFD7",
    "Lab 3": "#C1D4FF",
    "Lab 4": "#FFD1C1",
    "Lab 5": "#D4FFC1",
    "Lab 6": "#FFC1C1",
    "Lab 7": "#C1FFC1",
    "Lab 8": "#C1C1FF",
    "Lab 9": "#FFD1FF",
    "Lab 10": "#D1FFC1"
};

const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().scaleExtent([0.5, 2]).on("zoom", function(event) {
        svg.attr("transform", event.transform);
    }))
    .append("g");

const g = svg.append("g");

g.append("rect")
    .attr("x", whiteBoxPadding)
    .attr("y", whiteBoxPadding)
    .attr("width", whiteBoxWidth)
    .attr("height", whiteBoxHeight)
    .attr("fill", "#fff")
    .attr("stroke", "#ccc");

d3.json("systems.json").then(data => {
    const nodes = data.nodes;
    const links = data.links;

    // Group nodes by lab
    const labs = d3.groups(nodes, d => d.lab);

    const labBoxes = g.selectAll(".lab-box")
        .data(labs)
        .enter().append("rect")
        .attr("class", "lab-box")
        .attr("x", (d, i) => (i % 2) * (width / 2) + margin)
        .attr("y", (d, i) => Math.floor(i / 2) * (height / 2) + margin)
        .attr("width", width / 2 - 2 * margin)
        .attr("height", height / 2 - 2 * margin)
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4")
        .attr("fill", "none");

    const labBoxCoords = {};
    labBoxes.each(function (d, i) {
        labBoxCoords[d[0]] = {
            x: (i % 2) * (width / 2) + margin,
            y: Math.floor(i / 2) * (height / 2) + margin,
            width: width / 2 - 2 * margin,
            height: height / 2 - 2 * margin
        };
    });

    // Add lab names
    g.selectAll(".lab-name")
        .data(labs)
        .enter().append("text")
        .attr("class", "lab-name")
        .attr("x", (d, i) => (i % 2) * (width / 2) + margin)
        .attr("y", (d, i) => Math.floor(i / 2) * (height / 2) + margin - 5)
        .text(d => d[0])
        .style("font-weight", "bold")
        .style("font-size", "14px");

    // Filter out standalone systems with no links
    const linkedNodes = new Set(links.flatMap(l => [l.source, l.target]));
    const filteredNodes = nodes.filter(n => linkedNodes.has(n.id));

    const simulation = d3.forceSimulation(filteredNodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("x", d3.forceX(d => labBoxCoords[d.lab]?.x + labBoxCoords[d.lab]?.width / 2 || whiteBoxWidth / 2))
        .force("y", d3.forceY(d => labBoxCoords[d.lab]?.y + labBoxCoords[d.lab]?.height / 2 || whiteBoxHeight / 2))
        .force("collision", d3.forceCollide().radius(d => Math.sqrt(d.footprint) * 4 + margin)); // Increase size

    const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", 2)
        .attr("stroke", d => d.type === "upstream" ? "green" : "red");

    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(filteredNodes)
        .enter().append("circle")
        .attr("r", d => Math.sqrt(d.footprint) * 4) // Increase size
        .attr("fill", "steelblue")
        .on("click", handleClick)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    const labels = g.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(filteredNodes)
        .enter().append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(d => d.name);

    simulation
        .nodes(filteredNodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(links);

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    function handleClick(event, d) {
        const isActive = d3.select(this).classed("active");
        d3.selectAll("circle").classed("active", false).attr("fill", "steelblue");
        d3.selectAll("line").classed("highlight", false).attr("stroke-width", 2);

        if (!isActive) {
            d3.select(this).classed("active", true).attr("fill", "orange");
            link.filter(l => l.source.id === d.id || l.target.id === d.id)
                .classed("highlight", true)
                .attr("stroke-width", 4);
        }
    }

    // Create custom cursor
    const customCursor = svg.append("circle")
        .attr("r", 10)
        .attr("fill", "black")
        .attr("opacity", 0.5)
        .style("pointer-events", "none")
        .attr("visibility", "hidden");

    svg.on("mousemove", function(event) {
        customCursor
            .attr("cx", event.pageX - svg.node().getBoundingClientRect().left)
            .attr("cy", event.pageY - svg.node().getBoundingClientRect().top)
            .attr("visibility", "visible");
    });

    svg.on("mouseout", function() {
        customCursor.attr("visibility", "hidden");
    });
});

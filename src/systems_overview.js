import * as d3 from 'd3';
import './styles.css';

const width = window.innerWidth;
const height = window.innerHeight;
const margin = 20;
const whiteBoxPadding = 20;
const whiteBoxWidth = width - whiteBoxPadding * 2;
const whiteBoxHeight = height - whiteBoxPadding * 2;

// Colors for labs
const labColors = {
    "Trading Systems": "#FFDDC1",
    "Cloud": "#C1FFD7",
    "Product and Data": "#C1D4FF",
    "Lab 6": "#FFD1C1",
};

const svgContainer = d3.select("#chart");

if (svgContainer.select("svg").empty()) {
    const svg = svgContainer.append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().scaleExtent([0.5, 1]).on("zoom", function(event) {
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

        // Calculate lab box dimensions dynamically based on thenumber of labs
        const numCols = Math.ceil(Math.sqrt(labs.length));
        const numRows = Math.ceil(labs.length / numCols);
        const labBoxWidth = width / numCols;
        const labBoxHeight = height / numRows;
        const labBoxCoords = {};
        labs.forEach((lab, i) => {
            labBoxCoords[lab[0]] = {
                x: (i % numCols) * labBoxWidth + margin,
                y: Math.floor(i / numCols) * labBoxHeight + margin,
                width: labBoxWidth - 2 * margin,
                height: labBoxHeight - 2 * margin
            };
        });

        // Filter out standalone systems with no links
        const linkedNodes = new Set(links.flatMap(l => [l.source, l.target]));
        const filteredNodes = nodes.filter(n => linkedNodes.has(n.id));

        const simulation = d3.forceSimulation(filteredNodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-50))
            .force("x", d3.forceX(width / 2))
            .force("y", d3.forceY(height / 2))
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
            .selectAll("circle")  // Change to circle
            .data(filteredNodes)
            .enter().append("circle")  // Change to circle
            .attr("r", d => Math.sqrt(d.footprint) * 2)  // Change to circle
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
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
            .text(d => `${d.name} (${d.type})`);

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
                .attr("cx", d => d.x)  // Change to circle
                .attr("cy", d => d.y);  // Change to circle

            labels
                .attr("x", d => d.x + Math.sqrt(d.footprint) * 2 + 5)
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

        // Add filters functionality
        d3.select("#labFilter").on("change", function() {
            updateBorders();
        });

        d3.select("#featureFilter").on("change", function() {
            updateBorders();
        });

        function updateBorders() {
            const showLabBorders = d3.select("#labFilter").property("checked");
            const showFeatureBorders = d3.select("#featureFilter").property("checked");

            // Remove existing borders
            g.selectAll(".lab-box, .feature-box, .lab-name, .feature-name").remove();

            if (showLabBorders) {
                // Draw lab borders
                const labBoxes = g.selectAll(".lab-box")
                    .data(labs)
                    .enter().append("rect")
                    .attr("class", "lab-box")
                    .attr("x", (d, i) => (i % numCols) * labBoxWidth + margin)
                    .attr("y", (d, i) => Math.floor(i / numCols) * labBoxHeight + margin)
                    .attr("width", labBoxWidth - 2 * margin)
                    .attr("height", labBoxHeight - 2 * margin)
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4")
                    .attr("fill", "none");

                labBoxes.each(function (d, i) {
                    labBoxCoords[d[0]] = {
                        x: (i % numCols) * labBoxWidth + margin,
                        y: Math.floor(i / numCols) * labBoxHeight + margin,
                        width: labBoxWidth - 2 * margin,
                        height: labBoxHeight - 2 * margin
                    };
                });

                // Add lab names
                g.selectAll(".lab-name")
                    .data(labs)
                    .enter().append("text")
                    .attr("class", "lab-name")
                    .attr("x", (d, i) => (i % numCols) * labBoxWidth + margin)
                    .attr("y", (d, i) => Math.floor(i / numCols) * labBoxHeight + margin - 5)
                    .text(d => d[0])
                    .style("font-weight", "bold")
                    .style("font-size", "14px");
            }

            if (showFeatureBorders) {
                // Draw feature borders within each lab
                labs.forEach((lab, i) => {
                    const features = d3.groups(lab[1], d => d.feature);

                    const featureBoxWidth = labBoxCoords[lab[0]].width / Math.ceil(Math.sqrt(features.length));
                    const featureBoxHeight = labBoxCoords[lab[0]].height / Math.ceil(features.length / Math.ceil(Math.sqrt(features.length)));

                    features.forEach((feature, j) => {
                        const featureBoxX = labBoxCoords[lab[0]].x + (j % Math.ceil(Math.sqrt(features.length))) * featureBoxWidth;
                        const featureBoxY = labBoxCoords[lab[0]].y + Math.floor(j / Math.ceil(Math.sqrt(features.length))) * featureBoxHeight;

                        g.append("rect")
                            .attr("class", "feature-box")
                            .attr("x", featureBoxX)
                            .attr("y", featureBoxY)
                            .attr("width", featureBoxWidth - 2 * margin)
                            .attr("height", featureBoxHeight - 2 * margin)
                            .attr("stroke", "blue")
                            .attr("stroke-dasharray", "4")
                            .attr("fill", "none");

                        g.append("text")
                            .attr("class", "feature-name")
                            .attr("x", featureBoxX + 5)
                            .attr("y", featureBoxY + 15)
                            .text(feature[0])
                            .style("font-weight", "bold")
                            .style("font-size", "12px");
                    });
                });
            }

            if (showLabBorders || showFeatureBorders) {
                // Constrain nodes to lab or feature boxes
                simulation.force("x", d3.forceX(d => labBoxCoords[d.lab]?.x + labBoxCoords[d.lab]?.width / 2 || whiteBoxWidth / 2))
                    .force("y", d3.forceY(d => labBoxCoords[d.lab]?.y + labBoxCoords[d.lab]?.height / 2 || whiteBoxHeight / 2));
            } else {
                // Spread nodes freely
                simulation.force("x", d3.forceX(width / 2))
                    .force("y", d3.forceY(height / 2));
            }

            simulation.alpha(0.3).restart();
        }

        // Initial call to updateBorders to draw borders if filters are checked
        updateBorders();
    });
}

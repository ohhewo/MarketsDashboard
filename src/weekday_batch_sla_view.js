d3.json("weekday_batchdata.json").then(data => {
    const nodes = data.nodes;

    // Calculate duration for each node
    nodes.forEach(node => {
        const [startHours, startMinutes] = node.startTime.split(':').map(Number);
        const [finishHours, finishMinutes] = node.finishTime.split(':').map(Number);
        const startTimeInMinutes = startHours * 60 + startMinutes;
        const finishTimeInMinutes = finishHours * 60 + finishMinutes;
        node.duration = finishTimeInMinutes - startTimeInMinutes; // Duration in minutes
        node.startTimeInMinutes = startTimeInMinutes;
    });

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const width = 1000;
    const height = 600;

    const margin = {top: 40, right: 20, bottom: 50, left: 100};

    const x = d3.scaleLinear()
        .range([margin.left, width - margin.right])
        .domain([0, 24 * 60]);

    const y = d3.scaleBand()
        .range([margin.top, height - margin.bottom])
        .padding(0.1)
        .domain(nodes.map(d => d.batchName));

    const xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .ticks(24)
            .tickFormat(d => {
                const hours = Math.floor(d / 60);
                const minutes = d % 60;
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            })
        )
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    const yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Add day labels below the time
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom + 20})`)
        .call(d3.axisBottom(x)
            .ticks(7)
            .tickFormat((d, i) => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i])
        );

    // Add bars
    svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .enter().append("rect")
        .attr("x", d => x(d.startTimeInMinutes))
        .attr("y", d => y(d.batchName))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.startTimeInMinutes + d.duration) - x(d.startTimeInMinutes))
        .attr("class", "bar")
        .on("mouseover", function(event, d) {
            d3.select(this).classed("hover", true);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Batch Name: ${d.batchName}<br/>Start Time: ${d.startTime}<br/>Finish Time: ${d.finishTime}<br/>Duration: ${d.duration} mins<br/>SLA Time: ${d.slaTime}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            d3.select(this).classed("hover", false);
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add x-axis
    svg.append("g")
        .call(xAxis);

    // Add y-axis
    svg.append("g")
        .call(yAxis);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add chart border
    svg.append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("class", "chart-border");
});

document.addEventListener("DOMContentLoaded", function () {
    let chartDiv = document.getElementById("portfolio-chart")
    const userId = chartDiv.getAttribute("userId")
    fetch(`/dashboard/chart/${userId}`)
        .then((response) => response.json())
        .then((data) => {
            const parseDate = d3.timeParse("%Y-%m-%d");
            data.forEach(d => d.date = parseDate(d.date));

            //setting dimensions
            const margin = { top: 20, right: 30, bottom: 30, left: 60 };
            const width = 400 - margin.left - margin.right;
            const height = 250 - margin.top - margin.bottom;

            //creating svg inside the chartDiv
            const svg = d3.select(chartDiv)
                .append("svg")
                .attr("class", "portfolio-svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            const g = svg.append("g")
                .attr("class", "chart-group")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            //scales
            const x = d3.scaleTime()
                .domain(d3.extent(data, d => d.date))
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.totalValue)])
                .range([height, 0]);

            //Axis
            g.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(5));

            g.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y));
            
            //area
            const area = d3.area()
                .x(d => x(d.date))
                .y0(height)
                .y1(d => y(d.totalValue))

            g.append("path")
            .datum(data)
            .attr("class", "portfolio-area")
            .attr("d", area)

            //line
            const line = d3.line()
                .x(d => x(d.date))
                .y(d => y(d.totalValue));

            g.append("path")
                .datum(data)
                .attr("class", "portfolio-line")
                .attr("d", line);
            })
        .catch((error) => {
            console.error(`Could not display chart because of error: ${error}`)
        })

    let username = document.getElementById("userNameDisplay")
    let pwButton = document.getElementById("recomputePortfolioWorth")

    pwButton.addEventListener("click", function (event) {
        event.preventDefault();
        console.log("Button pressed for Recompute Profile Worth")
    })

})


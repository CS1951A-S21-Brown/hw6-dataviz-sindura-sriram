// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2), graph_1_height = 300;
let graph_2_width = (MAX_WIDTH / 2), graph_2_height = 350;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;

// Graph 1 : Bar Plot, titles per genre
function graph1() {
    // set up SVG
    let graph_1_svg = d3.select("#barplot1")
        .append("svg")
        .attr("width", graph_1_width)
        .attr("height", graph_1_height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("./data/netflix.csv").then(function (data) {
        // only consider genres types of movie titles
        let attr = "type";
        let type = "Movie";
        data = filterData(data, attr, type);
        // desired data is genre, at 'listed_in'
        data = data.map(function (d) { 
            let genre_list = d["listed_in"].split(", ");
            return { genre: genre_list, count: 1 } })
        
        var all_genres = [];
        data.forEach(function (d) {
            d.genre.forEach(function (a) {
                all_genres.push({genre: a, count:1 });
            });
        });

        console.log(all_genres);

        // now we have list of all genres, and we need to map this to an array w all possible genres and count of each one
        data = d3.nest().key(function (d) { return d.genre; })
            .rollup(function (counts) {
                return d3.sum(counts, function (d) {
                    return d.count;
                });
            }).entries(all_genres);
        
        console.log(data);

        // now we can sort genres by count high to low
        data = sortData(data, compare, `${NUM_EXAMPLES}`);

        let x = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return d.value })])
            .range([0, graph_1_width - `${margin.left}` - `${margin.right}`]);

        var genres = data.map(function (d) { return d.key });
        let y = d3.scaleBand()
            .domain(genres)
            .range([0, graph_1_height - `${margin.top}` - `${margin.bottom}`])
            .padding(0.05);  // Improves readability

        graph_1_svg.append("g")
            .call(d3.axisLeft(y).tickSize(0).tickPadding(10));

        let color = d3.scaleOrdinal()
            .domain(data.map(function (d) { return d.value }))
            .range(d3.quantize(d3.interpolateHcl("#32A02E", "#B2DF8A"), NUM_EXAMPLES));

        let bars = graph_1_svg.selectAll("rect").data(data);

        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", function (d) { return color(d.value) })
            .transition()
            .duration(1000)
            .attr("x", x(0))
            .attr("y", function (d) { return y(d.key) })
            .attr("width", function (d) { return x(d.value) })
            .attr("height", y.bandwidth());

        let countRef = graph_1_svg.append("g");

        let counts = countRef.selectAll("text").data(data);

        counts.enter()
            .append("text")
            .merge(counts)
            .transition()
            .duration(1000)
            .attr("x", function (d) { return x(d.value) })   // x offset    
            .attr("y", function (d) { return y(d.key) + y.bandwidth() })      // y offset
            .style("text-anchor", "start")
            .text(function (d) { return d.value })

        // x-axis label
        graph_1_svg.append("text")
            .attr("transform", `translate(35, 235)`)
            .style("text-anchor", "middle")
            .text("Count");

        // y-axis label
        graph_1_svg.append("text")
            .attr("transform", `translate(-180, 100) rotate(-90)`)
            .style("text-anchor", "middle")
            .text("Genre");
        // title
        graph_1_svg.append("text")
            .attr("transform", `translate(100, -5)`)
            .style("text-anchor", "middle")
            .style("font-size", 15)
            .text("Number of Titles per Genre");

    });
}

// Graph 2 : Bar Plot, avg movie runtime per year
let graph_2_svg = d3.select("#barplot2")
    .append("svg")
    .attr("width", graph_2_width)
    .attr("height", graph_2_height)
    .append("g")
    .attr("transform", `translate(200, ${margin.top})`);

let countRef = graph_2_svg.append("g");
let y_axis_label = graph_2_svg.append("g");

// x-axis label
graph_2_svg.append("text")
    .attr("transform", `translate(85, 285)`)
    .style("text-anchor", "middle")
    .text("Runtime Average (minutes)");

// y-axis label
graph_2_svg.append("text")
    .attr("transform", `translate(-50, 130) rotate(-90)`)
    .style("text-anchor", "middle")
    .text("Release Year");

// title
graph_2_svg.append("text")
    .attr("transform", `translate(150, -5)`)
    .style("text-anchor", "middle")
    .style("font-size", 15)
    .text("Average Runtime of Movies by Release Year");

// description
graph_2_svg.append("text")
        .attr("transform", `translate(237, 300)`)
        .style("text-anchor", "middle")
        .style("font-size", 10)
        .text("Change the latest year value on the slider to view the full range of average movie runtimes/year on Netflix!");


function setRuntimeData(end_year) {
    d3.csv("./data/netflix.csv").then(function (data) {
        // we only want movies, not tv shows.
        let attr = "type";
        let type = "Movie";
        data = filterData(data, attr, type);
        // duration is a string written as "# min", we just want num
        data = data.map(function (d) { return { year: d["release_year"], runtime: parseInt(d.duration.split(" ")[0], 10) } })

        // calculate average runtimes for each year
        var data = d3.nest().key(function (d) { return d.year; })
            .rollup(function (runtimes) {
                return d3.mean(runtimes, function (d) {
                    return d.runtime;
                }).toFixed(1);
            }).entries(data);


        // filter data again, get movies released <= startYear                   
        data = filterYr(data, end_year);
        data = sortData(data, compareKey, NUM_EXAMPLES);

        let x = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return d.value })])
            .range([0, graph_2_width - `${margin.left}` - `${margin.right}`]);

        var years = data.map(function (d) { return d.key });
        let y = d3.scaleBand()
            .domain(years)
            .range([0, graph_2_height - `${margin.top}` - `${margin.bottom}`])
            .padding(0.05);  // Improves readability

        y_axis_label.call(d3.axisLeft(y).tickSize(0).tickPadding(10));

        let color = d3.scaleOrdinal()
            .domain(data.map(function (d) { return d.key }))
            .range(d3.quantize(d3.interpolateHcl("#A6CEE4", "#2178B4"), NUM_EXAMPLES));

        let bars = graph_2_svg.selectAll("rect").data(data);
        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", function (d) { return color(d.key) })
            .transition()
            .duration(1000)
            .attr("x", x(0))
            .attr("y", function (d) { return y(d.key) })
            .attr("width", function (d) { return x(d.value)/1.5 })
            .attr("height", y.bandwidth());

        let counts = countRef.selectAll("text").data(data);

        counts.enter()
            .append("text")
            .merge(counts)
            .transition()
            .duration(1000)
            .attr("x", function (d) { return x(d.value)/1.5 })   // x offset    
            .attr("y", function (d) { return y(d.key) + y.bandwidth() })      // y offset
            .style("font-size", "12px")
            .text(function (d) { return d.value })

        // Remove elements not in use if fewer groups in new dataset
        bars.exit().remove();
        counts.exit().remove();

    });
}

// Graph 3 : Flow Chart
function graph3() {
    // Set up reference to tooltip
    let tooltip = d3.select("#flowchart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    let graph_3_svg = d3.select("#flowchart")
        .append("svg")
        .attr("width", graph_3_width)
        .attr("height", graph_3_height);

    var color = d3.scaleOrdinal(d3.schemePaired);

    d3.forceSimulation().force("link", d3.forceLink())
        .force('charge', d3.forceManyBody()
            .strength(-20)
            .theta(0.8)
            .distanceMax(100)
        )
        .force("center", d3.forceCenter(graph_3_width / 2, graph_3_height / 2));


    d3.csv("./data/netflix.csv").then(function (data) {
        // before acquiring list of actor connections, filter to only include titles from the U.S.
        let attr = "country";
        let country = "United States";
        data = filterData(data, attr, country);
        // convert cast into a list of actors --> combinations of all the actors
        data = data.map(function (d) {
            let cast = d.cast;
            let actors = cast.split(", ");
            return { cast: combinations(actors) };
        });
        // for each list of actors, return all combinations of actors: [actor1, actor2] should be alphabetically ordered

        var all_actors = [];
        data.forEach(function (d) {
            d.cast.forEach(function (a) {
                all_actors.push(a);
            });
        });

        //now aggregate count!
        all_actors = d3.nest().key(function (d) { return d.actors; })
            .rollup(function (counts) {
                return d3.sum(counts, function (d) {
                    return d.count;
                });
            }).entries(all_actors);
        all_actors = sortData(all_actors, compare, 200);
        // now, for each entry in all_actors we need to make two nodes and form a link between them
        // Actor1, Actor2 = source, target
        // reduce duplicates --> taken care of in createNetworkGraph, duplicate nodes/links are not added
        all_actors = all_actors.map(function (d) {
            let str = d.key;
            let nodes = str.split(",");

            var source = nodes[0];
            var target = nodes[1];
            return { source: source, target: target, value: d.value };
        });
        createNetworkGraph(all_actors);
    });

    function createNetworkGraph(json) {
        var nodes = [];
        var links = [];

        json.forEach(function (d) {
            if (nodes.indexOf(d.source.trim()) < 0) {
                //source node does not exist in nodes list so add
                nodes.push(d.source.trim())
            }
            if (nodes.indexOf(d.target.trim()) < 0) {
                //target node does not exist in nodes list so add
                nodes.push(d.target.trim())
            }
            links.push({ source: nodes.indexOf(d.source.trim()), target: nodes.indexOf(d.target.trim()), value: d.value })
        });
        nodes = nodes.map(function (n) {
            return { name: n, group: n.length % 5 }
        });

        let simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(-600))
            .force("center", d3.forceCenter(graph_3_width / 2, graph_3_height / 2))
            .force("x", d3.forceX(graph_3_width / 2).strength(1))
            .force("y", d3.forceY(graph_3_height / 2).strength(1))
            .force("link", d3.forceLink(links).distance(50).strength(1))
            .on("tick", ticked)

        var link = graph_3_svg.append("g")
            .style("stroke", "#aaa")
            .selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        var node = graph_3_svg.append("g")
            .selectAll(".node")
            .data(nodes)
            .enter().append("circle")
            .attr("r", 5)
            .attr("fill", function (d) { return color(d.group); })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        function ticked() {
            link
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node
                .attr("r", 5)
                .style("fill", function (d) { return color(d.group); })
                .style("stroke", "#000")
                .style("stroke-width", "1px")
                .attr("cx", function (d) { return d.x + 5; })
                .attr("cy", function (d) { return d.y - 3; })
        }

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

    }

    // title
    graph_3_svg.append("text")
        .attr("transform", `translate(360, 40)`)
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("US Actors With the Most Collaborations*");

    // description
    graph_3_svg.append("text")
        .attr("transform", `translate(360, 550)`)
        .attr("class", "text")
        .style("text-anchor", "middle")
        .style("font-size", 10)
        .text("*Collaboration is defined as two actors appearing in the same title.");

    graph_3_svg.append("text")
        .attr("transform", `translate(360, 560)`)
        .attr("class", "text")
        .style("text-anchor", "middle")
        .style("font-size", 10)
        .text("Hover over each actor and their links to see how many projects they have shared!");

    let mouseover = function (d) {
        var html;
        if (d.name) {
            html = `${d.name}<br/>`;
        }
        if (d.value) {
            html = `Titles: ${d.value}<br/>`;
        }
        // Show the tooltip and set the position relative to the event X and Y location
        tooltip.html(html)
            .style("left", `${(d3.event.pageX) - 700}px`)
            .style("top", `${(d3.event.pageY) - 100}px`)
            .transition()
            .duration(200)
            .style("opacity", 1);
    };

    // Mouseout function to hide the tool on exit
    let mouseout = function (d) {
        // Set opacity back to 0 to hide
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    };

}

function compare(a, b) {
    return b.value - a.value;
}

function compareKey(a, b) {
    return parseInt(b.key, 10) - parseInt(a.key, 10);
}

function sortData(data, comparator, numExamples) {
    // TODO: sort and return the given data with the comparator (extracting the desired number of examples)
    // data is array of objects
    // sort data by count according to comparator
    data = data.sort(comparator);
    // return [:numExamples] of data
    return data.splice(0, numExamples);
}

function filterData(data, attr, filt) {
    return data.filter(function (a) { return a[attr] === (filt); });
}

function filterYr(data, year) {
    return data.filter(function (a) { return parseInt(a.key) <= year });
}

function combinations(array) {
    var results = [];

    for (var i = 0; i < array.length - 1; i++) {
        for (var j = i + 1; j < array.length; j++) {
            results.push(({ actors: [array[i], array[j]], count: 1 }));
        }
    }
    return results;
}

graph1();
setRuntimeData(1970);
graph3();

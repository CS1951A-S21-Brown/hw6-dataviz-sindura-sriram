// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2), graph_1_height = 300;
let graph_2_width = (MAX_WIDTH / 2), graph_2_height = 350;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;

// Graph 1 : Bar Plot, titles per genre

// set up SVG
let graph_1_svg = d3.select("#barplot1")
                    .append("svg")
                    .attr("width", graph_1_width)
                    .attr("height", graph_1_height)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);                   

d3.csv("./data/netflix.csv").then(function(data){
    // desired data is genre, at 'listed_in'
    data = data.map(function(d){return {genre: d["listed_in"], count: 1}})
    
    
    // now we have list of all genres, and we need to map this to an array w all possible genres and count of each one
    var data = d3.nest().key(function(d) { return d.genre; })
                        .rollup(function(counts) { 
                            return d3.sum(counts, function(d){
                                return d.count;
                            }); 
                        }).entries(data);
    
    // now we can sort genres by count high to low
    data = sortData(data, compare, `${NUM_EXAMPLES}`);
        
    let x = d3.scaleLinear()
        .domain([0, d3.max(data, function(d){return d.value})]) 
        .range([0, graph_1_width - `${margin.left}` - `${margin.right}`]);

    var genres = data.map(function(d){return d.key});
    let y = d3.scaleBand()
        .domain(genres) 
        .range([0, graph_1_height - `${margin.top}` - `${margin.bottom}`])
        .padding(0.05);  // Improves readability

    graph_1_svg.append("g")
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    let color = d3.scaleOrdinal()
        .domain(data.map(function(d) { return d.value }))
        .range(d3.quantize(d3.interpolateHcl("#3aeb34", "#e2eb34"), NUM_EXAMPLES));
    
    let bars = graph_1_svg.selectAll("rect").data(data);

    bars.enter()
        .append("rect")
        .merge(bars)
        .attr("fill", function(d) { return color(d.value) })
        .transition()
        .duration(1000)
        .attr("x", x(0))
        .attr("y", function(d){ return y(d.key)})          
        .attr("width", function(d){ return x(d.value)})
        .attr("height",  y.bandwidth());    
    
    let countRef = graph_1_svg.append("g"); 
    
    let counts = countRef.selectAll("text").data(data);
    
    counts.enter()
        .append("text")
        .merge(counts)
        .transition()
        .duration(1000)
        .attr("x", function(d){ return x(d.value)})   // x offset    
        .attr("y", function(d){ return y(d.key) + y.bandwidth()})      // y offset
        .style("text-anchor", "start")
        .text(function(d){ return d.value})

    // x-axis label
    graph_1_svg.append("text")
        .attr("transform", `translate(35, 235)`) 
        .style("text-anchor", "middle")
        .text("Count");
                           
    // y-axis label
    graph_1_svg.append("text")
        .attr("transform", `translate(-30, -5)`) 
        .style("text-anchor", "middle")
        .text("Genre");
    // title
    graph_1_svg.append("text")
        .attr("transform", `translate(130, -5)`)      
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Number of Titles per Genre");

});


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
let x_axis = graph_2_svg.append("text")
 .attr("transform", `translate(100, 300)`) 
 .style("text-anchor", "middle")
 .text("Runtime Average");
                    
// y-axis label
let y_axis = graph_2_svg.append("text")
 .attr("transform", `translate(-50, 130) rotate(-90)`) 
 .style("text-anchor", "middle")
 .text("Release Year");

// title
let title = graph_2_svg.append("text")
 .attr("transform", `translate(130, -5)`)      
 .style("text-anchor", "middle")
 .style("font-size", 15)
 .text("Average Runtime of Movies by Release Year");

function setData(end_year){
    d3.csv("./data/netflix.csv").then(function(data){
        // we only want movies, not tv shows.
        let type = "Movie";
        data = filterData(data, type);
        // duration is a string written as "# min", we just want num
        data = data.map(function(d){return {year: d["release_year"], runtime: parseInt(d.duration.split(" ")[0], 10)}})
    
        var data = d3.nest().key(function(d) { return d.year; })
                            .rollup(function(runtimes) { 
                                return d3.mean(runtimes, function(d){
                                    return d.runtime;
                                }); 
                            }).entries(data);
        

        // filter data again, get movies released <= startYear                   
        data = filterYr(data, end_year); 
        data = sortData(data, compareKey, NUM_EXAMPLES);                
    
        let x = d3.scaleLinear()
            .domain([0, d3.max(data, function(d){return d.value})]) 
            .range([0, graph_2_width - `${margin.left}` - `${margin.right}`]);
    
        var years = data.map(function(d){return d.key});
        let y = d3.scaleBand()
            .domain(years) 
            .range([0, graph_2_height - `${margin.top}` - `${margin.bottom}`])
            .padding(0.05);  // Improves readability
    
        y_axis_label.call(d3.axisLeft(y).tickSize(0).tickPadding(10));
    
        let color = d3.scaleOrdinal()
            .domain(data.map(function(d) { return d.value }))
            .range(d3.quantize(d3.interpolateHcl("#ebe134", "#eb7734"), NUM_EXAMPLES));
        
        let bars = graph_2_svg.selectAll("rect").data(data);
        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", function(d) { return color(d.value) })
            .transition()
            .duration(1000)
            .attr("x", x(0))
            .attr("y", function(d){ return y(d.key)})          
            .attr("width", function(d){ return x(d.value)})
            .attr("height",  y.bandwidth()); 
        
        let counts = countRef.selectAll("text").data(data);
        
        counts.enter()
            .append("text")
            .merge(counts)
            .transition()
            .duration(1000)
            .attr("x", function(d){ return x(d.value)})   // x offset    
            .attr("y", function(d){ return y(d.key) + y.bandwidth()})      // y offset
            .style("font-size", "10px")
            .text(function(d){ return d.value})
        
        // Remove elements not in use if fewer groups in new dataset
        bars.exit().remove();
        counts.exit().remove();
        
    });
}

// Graph 3 : Flow Chart


// Sort by genre ascending
function compare(a, b){
    return b.value - a.value;
}

function compareKey(a, b){
    return parseInt(b.key,10) - parseInt(a.key, 10);
}

function sortData(data, comparator, numExamples) {
    // TODO: sort and return the given data with the comparator (extracting the desired number of examples)
    // data is array of objects
    // sort data by count according to comparator
    data = data.sort(comparator);
    // return [:numExamples] of data
    return data.splice(0, numExamples);
}

function filterData(data, type) {
    return data.filter(function(a) { return a.type === (type); });
}

function filterYr(data, year){
    return data.filter(function(a){ return parseInt(a.key) <= year });
}

setData(1970);
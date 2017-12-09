// TOOLS brodé main ou/et chopé sur le oueb
String.prototype.sansAccent = function(){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];
    var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];

    var str = this;
    for(var i = 0; i < accent.length; i++){
        str = str.replace(accent[i], noaccent[i]);
    }

    return str;
};

function identifying(str){
    return str.replace(/'|"|-/gi, "").sansAccent().toLowerCase()
}


var total_ALIMENTATION = 0, total_FABRICATION = 0, total_BATIMENT = 0, total_SERVICES = 0, total_ENTREPRISE = 0 ;
var dataBarChart;

// Dataviz 1 - Carte de la France
var width = 600, height = 550;
var path = d3.geoPath();

var projection = d3.geoConicConformal()
    .center([2.454071, 46.279229])
    .scale(2600)
    .translate([width / 2, height / 2]);
	
path.projection(projection); 
var svg = d3.select('#dataviz1').append("svg")
    .attr("id", "svg1")
    .attr("class", "Blues")         // colorbrewer nuancier
    .attr("width", width)
    .attr("height", height);
 
var deps = svg.append("g");

// La petite tooltip qu'on aime bien !
var div = d3.select("#dataviz1").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Définition de la Dataviz 2
var width2 = 600, height2 = 550;

var svg2 = d3.select('#dataviz2').append("svg")
    .attr("id", "svg2")
    .attr("width", width2)
    .attr("height", height2);

var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
    y = d3.scaleLinear().rangeRound([height, 0]);

var margin = {top: 20, right: 20, bottom: 30, left: 40};
    width2 = 960 - margin.left - margin.right;
    height2 = 500 - margin.top - margin.bottom;

var g = svg2.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json('./departments.json', function(req, geojson) {
    var features = deps.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("id", function(d) {return identifying(d.properties.NOM_DEPT)});

    d3.csv("./donnees_artisans.csv", function(csv){
        // Dataviz 1
        var data = [];

        // Formatage et recalcule des datas
        csv.forEach(function(row){
            data.push({
                id: identifying(row.Departement),
                departement: row.Departement,
                alimentation: parseInt(row.ALIMENTATION)/parseInt(row.Total),
                batiment: parseInt(row.BATIMENT)/parseInt(row.Total),
                fabrication: parseInt(row.FABRICATION)/parseInt(row.Total),
                services: parseInt(row.SERVICES)/parseInt(row.Total),
                caParEntreprise: parseInt(row.CA)/(parseInt(row.Total)+parseInt(row.Entreprise_Artisanale)),
                vaParEntreprise: parseInt(row.VA)/(parseInt(row.Total)+parseInt(row.Entreprise_Artisanale)),
                ca: parseInt(row.CA),
                va: parseInt(row.VA)
            });

            total_ALIMENTATION += parseInt(row.ALIMENTATION);
            total_BATIMENT += parseInt(row.BATIMENT);
            total_FABRICATION += parseInt(row.FABRICATION);
            total_SERVICES += parseInt(row.SERVICES);
            total_ENTREPRISE += parseInt(row.Entreprise_Artisanale)+parseInt(row.Total)
        });

        // mise en %
        total_ALIMENTATION = total_ALIMENTATION / total_ENTREPRISE;
        total_BATIMENT = total_BATIMENT / total_ENTREPRISE;
        total_FABRICATION = total_FABRICATION / total_ENTREPRISE;
        total_SERVICES = total_SERVICES / total_ENTREPRISE;


        // Création du nuancier
        var quantile = d3.scaleQuantile()
            .domain([57, 400])      // D'après l'échelle réglé sur tableau
            .range(d3.range(6));    // D'après le nombre d'échellons déterminé sur tableau


        // Création de la légende à droite
        var legend = svg.append('g')
            .attr('transform', 'translate(525, 150)')
            .attr('id', 'legend');

        legend.selectAll('.colorbar')
            .data(d3.range(6))
            .enter().append('svg:rect')
            .attr('y', function(d) { return d * 20 + 'px'; })
            .attr('height', '20px')
            .attr('width', '20px')
            .attr('x', '0px')
            .attr("class", function(d) { return "q" + d + "-9"; });

        var legendScale = d3.scaleLinear()
            .domain([57, 400])      // D'après l'échelle réglé sur tableau
            .range([0, 6 * 20]);

        var legendAxis = svg.append("g")
            .attr('transform', 'translate(550, 150)')
            .call(d3.axisRight(legendScale).ticks(6));

        // Il est temps de jeter le pot de peinture sur la carte monsieur dame
        data.forEach(function(row){
            try{
                d3.select("#" + identifying(row.departement))
                    .attr("class", function(d) { return "department q" + quantile(+row.caParEntreprise) + "-9"; })
                    .on("mouseover", function(d) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html("<b>Département : </b>" + row.departement + "<br>"
                            + "<b>Chiffre D'Affaire moyen : </b>" + Math.round(row.caParEntreprise) + "<br/>")
                            .style("left", (d3.event.pageX + 30) + "px")
                            .style("top", (d3.event.pageY - 30) + "px");
                    })
                    .on("mouseout", function(d) {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
;
                    });
            }
            catch(e){
                console.log("Erreur: "+e+" <br\> Probablement on a pas réussi à retrouver l'identifiant :#"+identifying(row.departement))
            }

        });

        // Dataviz 2
// define the axis
        var xAxis = d3.axisBottom(x);


        var yAxis = d3.axisLeft(y)
            .ticks(10);

        dataBarChart =
            [{
                "x" : "Alimentation",
                "total": total_ALIMENTATION
            },{
                "x" : "Fabrication",
                "total": total_FABRICATION
            },{
                "x" : "Batiment",
                "total": total_BATIMENT
            },{
                "x" : "Service",
                "total": total_SERVICES
            }
            ];

            console.log(dataBarChart);
            dataBarChart.forEach(function(d) {
                d.x = d.x;
                d.total = +d.total;
            });

            // scale the range of the data
            x.domain(dataBarChart.map(function(d) { return d.x; }));
            y.domain([0, d3.max(dataBarChart, function(d) { return d.total; })]);

            // add axis
            svg2.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", "-.55em")
                .attr("transform", "rotate(-90)" );

            svg2.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 5)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Fréquence");


            // Add bar chart
            svg2.selectAll("bar")
                .data(dataBarChart)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.x); })
                .attr("width", x.bandwidth)
                .attr("y", function(d) { return y(d.total); })
                .attr("height", function(d) { return height2 - y(d.total); });


    });
});



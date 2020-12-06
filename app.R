library(networkD3)
library(htmlwidgets)
library(htmltools)
library(shiny)
library(shinythemes)
library(readr)

# load data
source('data-processing.R')
# load in colour schemes
source('colours.R')
# load in the custom js to override forceNetwork defaults
customjs <- read_file("custom.js") 

# shiny setup
server <- function(input, output, session) {
	output$associations <- renderForceNetwork({
		if (input$nodes == "PlantType") {
			sortedNet <- networkSort("PlantType")
			num.cats <- sortedNet[[1]] %>% select(PlantType) %>% unique %>% nrow
			colhex <- Dark2[1:num.cats]
			colhex[length(colhex)-1] <- Dark2[length(Dark2)-1]
			colourScale <- paste0(
				"d3.scaleOrdinal().range(['",
				paste0(colhex, collapse="','"),
				"'])")
		} else {
			sortedNet <- networkSort("Height")
			num.cats <- sortedNet[[1]] %>% select(Layer) %>% unique %>% nrow
			colhex <- Set1[seq(1, num.cats)]
			colourScale <- paste0(
				"d3.scaleOrdinal().range(['",
				paste0(colhex, collapse="','"),
				"'])")
		}
		nodes <- sortedNet[[1]]
		links <- sortedNet[[2]]
		fn <- forceNetwork(
			Links=links, Nodes=nodes, Source='Source', Target='Target',
			NodeID='Name', Group=input$nodes, Value='Value', linkColour=links$Impact,
			Nodesize='Links', opacity=1, linkWidth=5, fontSize=15, zoom=TRUE,
			legend=TRUE, charge=-500, bounded=FALSE, opacityNoHover=1,
			colourScale=JS(colourScale), fontFamily='sans-serif')
		fn$x$nodes$LatinName <- nodes$LatinName
		fn$x$nodes$Properties <- nodes$Properties
		fn$x$nodes$WikiLink <- nodes$WikiLink
		fn$x$links$Effect <- links$Effect
		fn$x$links$PeerReviewed <- links$PeerReviewed
		onRender(fn, customjs)
	})
	observe({
		session$sendCustomMessage(type="nodehl", message=input$search)
	})
}

ui <- fluidPage(
	navbarPage("The Interactive Companion Planting Map", theme=shinytheme("simplex"),
		tabPanel("Explore",
			fluidRow(
				column(1,
					selectInput("nodes", "Colour nodes by:",
						choices=list("Plant type"="PlantType", "Height"="Layer"),
						selected="PlantType"),
					selectInput("search", "Find:", c(None='', dat.nodes$Name))),
				column(11, forceNetworkOutput("associations", height="750px"), hr())
			)
		),
		tabPanel("About",
			fluidRow(
				column(12,
					h4(p("Background")),
					h5(p("My goal is to turn the ecological desert of my urbain yard into a biodiverse and productive garden/food forest. A great way to achieve that is through polyculture/companion/permaculture guild planting. While I have some knowledge of the subject, I'm not an expert, so I started digging through the internet, handbooks, textbooks and academic publications. The problem is that I was completely overhwelmed by the amount of information. There is a lot of rich information out there, but sometimes it's conflicting, or dubious, or incomplete, or not backed by references, or all of the above. I wanted a way to quickly access and filter that information, but there aren't any great tools out there besides huge tables like you would find on ", a("Wikipedia", href="https://en.wikipedia.org/wiki/List_of_companion_plants"), ". So, I compiled a basic dataset (still a work in progress!) of common garden plants, shrubs and trees and got to work on visualising it in a way that I found intuitive. It was mostly for my own use, but I figured others might find it useful so I turned this project into a web application.")),
					br(),
					h4(p("How it works")),
					h5(p("Each plant is represented as a node within a network tied together (the links) by their respective association, be it beneficial or detrimental. Mouse over the nodes to reveal their associations. The solid links connecting two nodes indicate that there is peer-reviewed experimental data to support the connection. A broken line suggests there is an association, but it hasn't verified in a peer-reviewed academic journal (to my current knowledge). Each node can be coloured either by botanical classification of lifecycle (artificially simplified for visualisation purposes since many varieties of the same plant can be annuals, biennials or perennials) or by maximum plant height or length (typical varieties that thrive in Canadian-like climates). You can also drag nodes around to rearrange the network, click on nodes for additional information, or quickly search for a specific plant in the drop-down menu.")),
					br(),
					h4(p("Code")),
					h5(p("Source code available at ", a("GitHub", href="https://github.com/mattsarrasin"), ".")),
					br(),
					h4(p("Author")),
					h5(p("Matt Sarrasin")),
					br(),
					h4(p("Contact")),
					h5(p("Questions? Comments? Suggestions? Send me an ", a("email", href="mailto:matt@mjsw.io"), "."))
				)
			)
		)
	)
)

shinyApp(ui, server)

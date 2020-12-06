library(dplyr)
library(tidyr)
library(readr)
library(stringr)
library(magrittr)
library(RColorBrewer)

# load data
dat.nodes <- read_tsv('plant-associations-nodes.tsv', col_names=TRUE) %>%
	mutate(Height=as.numeric(Height))
dat.links <- read_tsv('plant-associations-links.tsv', col_names=TRUE)
# add number of links per type
dat.nodes <- dat.links[1:2] %>%
	unlist %>%
	table %>%
	as.data.frame %>%
	dplyr::rename(Name=".", Links="Freq") %>%
	left_join(dat.nodes, ., by='Name') %>%
	replace_na(list(effect="Unknown", Links=0)) 
single.nodes <- dat.nodes %>% filter(Links==0)
# filter out nodes and links where there are no connections
dat.nodes <- dat.nodes %>% filter(Links>0)
# create hyperlink to wikipedia for node
dat.nodes <- dat.nodes %>% mutate(WikiLink=paste0("https://en.wikipedia.org/wiki/", str_replace(LatinName, " ", "_")))
# add markup on properties for tooltip display
dat.nodes$Properties <- str_replace(dat.nodes$Properties, "^", "<ul><li>") %>%
	str_replace("$", "</li></ul>") %>%
	str_replace_all("; ", "</li><li>")
# add italics markup to latin name
dat.nodes$LatinName <- str_replace(dat.nodes$LatinName, "^", "<i>") %>%
	str_replace("$", "</i>")
# break up plant heights into rough ranges
dat.nodes <- dat.nodes %>%
	mutate(Layer=ifelse(
		Height>25, ">25m",
			ifelse(Height<=25 & Height>10, "10-25m",
				ifelse(Height<=10 & Height>3, "3-10m",
					ifelse(Height<=3 & Height>0.6, "0.6-3m", "0-0.6m")
				)
			)
		)
	)

# function to sort nodes by plant type or by height
networkSort <- function(sortVar) {
	if (sortVar == 'PlantType') {
		dat.nodes <- dat.nodes %>%
			arrange(PlantType) %>%
			mutate(ID=row_number()-1, Group=1)
	} else {
		dat.nodes <- dat.nodes %>%
			arrange(Height) %>%
			mutate(ID=row_number()-1, Group=1)
	}
	dat.links <- read_tsv('plant-associations-links.tsv', col_names=TRUE)
	# change values for colours
	link.cols <- brewer.pal(9, "Set1")
	dat.links <- dat.links %>%
		mutate(Impact=ifelse(Value==-1, link.cols[1], link.cols[3]), Value=1)
	dat.links <- dat.links %>%
		left_join(dat.nodes, by=c('Source'='Name')) %>%
		left_join(dat.nodes, by=c('Target'='Name')) %>%
		select(ID.x, ID.y, Impact, PeerReviewed, Value, Effect) %>%
		rename(Source=ID.x, Target=ID.y) %>%
		arrange(Source, Target)
	return(list(dat.nodes, dat.links))
}

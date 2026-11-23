---
title: Queries
description: View, edit, copy, and delete existing queries or create a new corpus query.
navigationOrder: 5
---

# Queries

## Existing queries

This page lists your previous queries. The controls ![Queries](/assets/documentation/de/image16.png) let you edit a query (first option), copy it to create a new query (second option), delete it (third option), or open it (fourth option).

## Create a query

You can also create new queries here.

To start a new query, click ![Queries](/assets/documentation/de/image17.png).

Give your query a descriptive title in the **Name** field. If you leave it blank, CorpSum assigns a name based on the date.

Use the **NoSketch instance** dropdown to choose an instance. Select **AMC** to work with the Austrian Media Corpus.

Next, use the **Corpus** dropdown to select a corpus from that instance. Starting in 2023, versions are named by year and updated quarterly. As of Q4 2026, the latest version is amc_5.25q4LTS. The final quarter closes out the year, and its version receives the LTS (*Long Term Support*) suffix and remains available. Versions with the WWW suffix contain online editions of the included media sources. See the [AMC release notes](https://amc.acdh.oeaw.ac.at/dokumentation/release-notes/) to find the latest corpus version.

To work with only part of a corpus, create a subcorpus in the [NoSketch Engine interface](https://noske-amc.acdh.oeaw.ac.at/). Define it in the [AMC NoSketch Engine](https://amc.acdh.oeaw.ac.at/access-conditions/), then select it in CorpSum when setting up a query.

## Query type and input

Use the **Type** field to specify the search method:

- charrow: returns tokens containing the specified sequence of characters
- cqlrow: supports complex queries in Corpus Query Language (CQL). See the [CQL tutorial](https://amc.acdh.oeaw.ac.at/dokumentation/nosketchengine-query-language/).
- iquery: performs a basic, case-insensitive search
- lemmarow: includes all word forms associated with the specified lemma
- phraserow: supports multiword queries
- wordrow: matches only the exact word form entered

Enter the term or phrase you want to search for in the **Input** field.

## Facetting filters

Use **Facetting values (JSON)** to narrow a query with filters based on the corpus's annotated metadata. For example, in the amc you can filter by region (doc.region), time period (doc.year, doc.yymm), or publication source (doc.src). See the [AMC corpus attributes documentation](https://amc.acdh.oeaw.ac.at/dokumentation/korpusinhalt-attribute/) for details.

![Queries](/assets/documentation/de/image18.png)

Click **Edit** to change the facetting values.

![Queries](/assets/documentation/de/image19.png)

To select the region **agesamt**, choose the **doc.region** filter. Its available options appear in the right column. Click **agesamt** to add it beneath the filter in the left column. Click **Remove** to remove the option.

![Queries](/assets/documentation/de/image18.png)

To reuse facetting values from an earlier query, click **Copy from** and select that query.

## Run and save the query

Once you have entered the required information, click **Run query** ![Queries](/assets/documentation/de/image20.png). To keep the query, you must then click **Create** ![Queries](/assets/documentation/de/image21.png).

## Visualize the results

After you click **Run query**, CorpSum opens several charts that visualize the results in different ways. To save a visualization, click ![Queries](/assets/documentation/de/image22.png) and give it a name. Saved visualizations are also available under **Visualizations**.

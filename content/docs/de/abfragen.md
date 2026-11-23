---
title: Abfragen
description: Auf dieser Seite findet sich einerseits eine Übersicht bisheriger Abfragen. Diese können wahlweise  bearbeitet (erste Option), für eine neue Abfrage kopiert (zweite Option), gelöscht (dritte Option) oder aufgerufen (vierte Option) werden.
navigationOrder: 5
---

# Abfragen

## Bestehende Abfragen

Auf dieser Seite findet sich einerseits eine Übersicht bisheriger Abfragen. Diese können wahlweise ![Abbildung: Abfragen](/assets/documentation/de/image16.png) bearbeitet (erste Option), für eine neue Abfrage kopiert (zweite Option), gelöscht (dritte Option) oder aufgerufen (vierte Option) werden.

## Neue Abfrage erstellen

Andererseits können hier neue Abfragen erstellt werden.

Um eine neue Abfrage durchzuführen, klicken Sie auf ![Abbildung: Abfragen](/assets/documentation/de/image17.png).

Im Feld „Name“ können Sie Ihre Abfrage mit einem aussagekräftigen Titel benennen, ansonsten wird die Abfrage per Default mit Datumsangaben benannt.

Unter „NoSketch-Instanz“ haben Sie per Drop-Down-Menü eine Auswahl der verfügbaren Instanzen. Um mit dem Austrian Media Corpus zu arbeiten, wählen Sie „AMC“ aus.

Anschließend müssen Sie im Feld „Korpus“ ein Korpus dieser Instanz auswählen. Die verfügbaren Korpora werden per Drop-Down-Menü angezeigt. Ab 2023 sind die Versionen mit dem jeweiligen Jahr benannt sowie quartalsaktuell. Die (Stand Q4/2026) aktuellste Korpusversion lautet amc_5.25q4LTS. Das letzte Quartal schließt das jeweilige Jahr ab und bekommt abschließend das Kürzel LTS, das für *Long Term Support*, also 'langfristige Unterstützung', steht und dauerhaft verfügbar ist. Überdies existieren Korpusversionen mit dem Kürzel WWW, diese beinhalten den Online-Auftritt der darin enthaltenen Medien. Beachten Sie die [Release Notes auf der amc-Seite](https://amc.acdh.oeaw.ac.at/dokumentation/release-notes/), um bei Bedarf immer das jeweils aktuellste Korpus zu nutzen.

Subkorpus: Für den Fall, dass Sie nur einen Teil des Korpus untersuchen wollen, können Sie im [Interface der NoSketch-Engine](https://noske-amc.acdh.oeaw.ac.at/) eigene Subkorpora erstellen. Die Erstellung von Subkorpora direkt in CorpSum ist gegenwärtig jedoch noch nicht möglich. Subkorpora müssen derzeit über die [NoSketch Engine des AMC](https://amc.acdh.oeaw.ac.at/access-conditions/) definiert werden. Danach können sie auch direkt in CorpSum ausgewählt und für Abfragen verwendet werden.

## Suchtyp und Eingabe

Im Feld „Typ“ kann die Suchanfrage spezifiziert werden:

- charrow: liefert jene Token, in denen die gesuchte Buchstabenkombination vorkommt
- cqlrow: ermöglicht komplexe Abfragen mittels Corpus Query Language (CQL). Ein Tutorial zum Schreiben einer Suchanfrage mittels CQL findet sich [hier](https://amc.acdh.oeaw.ac.at/dokumentation/nosketchengine-query-language/).
- iquery: dies ist die Basissuchfunktion, sie ist nicht case-sensitiv
- lemmarow: berücksichtigt alle diesem Lemma zugeordneten Wortformen
- phraserow: ermöglicht Mehrwortabfragen
- wordrow: berücksichtigt ausschließlich das spezifisch eingetippte Wort

Das Feld „Eingabe“ dient der Eingabe des gesuchten Begriffs/der gesuchten Phrase.

## Facettierungsfilter

Mithilfe der Option „Facettierungswerte (JSON)“ kann die jeweilige Suchanfrage spezifisch durch Filter angepasst werden. Diese Filter beruhen auf den annotierten Metadaten des Korpus. In Bezug auf das amc kann mit diesen Filtern beispielsweise die Suche auf eine bestimmte Region (doc.region), einen bestimmten Zeitraum (doc.year, doc.yymm) oder ein bestimmtes Publikationsmedium (doc.src) eingegrenzt werden. Die Annotation der Daten des amc wird [detailliert hier](https://amc.acdh.oeaw.ac.at/dokumentation/korpusinhalt-attribute/) beschrieben.

![Abbildung: Abfragen](/assets/documentation/de/image18.png)

Um die Facettierungswerte anzupassen, muss auf „Bearbeiten“ geklickt werden.

![Abbildung: Abfragen](/assets/documentation/de/image19.png)

Beispiel: Um die Region „agesamt“ auszuwählen, muss der entsprechende Facettierungsfilter – in diesem Fall „doc.region“ – ausgewählt werden. Die für diesen Filter verfügbaren Optionen finden sich in der Spalte rechts. Ein Klick auf „agesamt“ wählt die Filteroption aus, die anschließend unter dem Filter in der linken Spalte angezeigt wird. Durch Klick auf „Entfernen“ kann die Filteroption wieder gelöscht werden.

![Abbildung: Abfragen](/assets/documentation/de/image18.png)

Bereits eingestellte Facettierungswerte einer früheren Abfrage können durch Klicken auf „Kopieren von“ plus anschließender Auswahl der gewünschten Abfrage für neue Abfragen übernommen werden.

## Abfrage ausführen und speichern

Wurden alle notwendigen Angaben eingegeben, kann die Abfrage durch Klick auf „Abfrage ausführen“ ![Abbildung: Abfragen](/assets/documentation/de/image20.png) durchgeführt werden. Wenn die Abfrage gespeichert werden soll, muss anschließend auf „Erstellen“ ![Abbildung: Abfragen](/assets/documentation/de/image21.png) geklickt werden. Wichtig: Die Abfrage wird nur gespeichert, wenn dieser Schritt durchgeführt wird.

## Ergebnisse visualisieren

Nach dem Klicken auf „Abfrage ausführen“ öffnen sich mehrere Charts, die die Daten auf vielfältige Weise visualisieren – das Herzstück von CorpSum. Die Visualisierungen können gespeichert werden durch Klick auf ![Abbildung: Abfragen](/assets/documentation/de/image22.png) und der Eingabe einer beliebigen Bezeichnung der Visualisierung. Diese gespeicherten Visualisierungen stehen anschließend auch im Menüpunkt „Visualisierungen“ (Details siehe dort) zur Verfügung.

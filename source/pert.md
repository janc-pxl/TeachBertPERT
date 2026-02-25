## Inleiding
![](https://i.imgur.com/humdHtI.png)

> [!note] DEFINITIE: Projectplanning
> Een projectplanning is een hulpmiddel om de voortgang en de resultaten van een project te bewaken en te sturen. Een projectplanning is niet hetzelfde als een projectplan, dat de scope en de doelstellingen van het project bepaalt.

Een projectplanning bestaat uit verschillende onderdelen, zoals:
- Het volgen van het **project scope statement (PSS)**, dat de verwachtingen en eisen van de opdrachtgever en de stakeholders vastlegt.
- De **fasering**, die aangeeft uit welke stappen of fases het project bestaat en wat er in elke fase gebeurt. Een bekende methode voor fasering is PRINCE 2, die zeven fases onderscheidt: starten, initiëren, sturen, beheersen, managen productoplevering, managen faseovergang en afsluiten.
- De **tijd**, die aangeeft wanneer elke fase of activiteit moet beginnen en eindigen, hoeveel speling er is per fase of activiteit en wat het kritieke pad is. Het kritieke pad is de langste route van activiteiten die bepalend is voor de duur van het hele project. Als er vertraging optreedt op het kritieke pad, heeft dat direct invloed op de einddatum van het project.
- Het **geld**, dat aangeeft welk budget er beschikbaar is voor het project, welk budget er nodig is voor elke fase of activiteit, wanneer het geld nodig is en wat de verwachte opbrengsten zijn. Het geld wordt ook gebruikt om de kosten en baten van het project te analyseren en te bewaken.
- De **informatie**, die aangeeft hoe er gecommuniceerd wordt over het project met alle betrokkenen. Dit omvat onder andere hoe vaak er gerapporteerd wordt over de voortgang en eventuele knelpunten van het project, wie verantwoordelijk is voor welke informatie en welke communicatiemiddelen er gebruikt worden.

Om een goede projectplanning te maken kan gebruik gemaakt worden van software voor projectplanning. Deze software kan helpen om alle aspecten van een project in kaart te brengen, te visualiseren en te beheren. [[@kypproject_2023]] [[@teamleader_2018]]

## PERT
![](https://i.imgur.com/7khHgSS.png)

> [!note] DEFINITIE: PERT
> PERT (Program Evaluation and Review Technique) is een hulpmiddel voor de bedrijfsleiding bij de analyse en planning van projecten. Hierbij wordt gebruik gemaakt van een grafische voorstelling, het netwerk, om de samenhang tussen de verschillende werkzaamheden aan te geven. [[@schegget.hamelink_1993]]

Projecten zijn opgebouwd uit een aantal activiteiten. Sommige activiteiten dienen achter elkaar te worden uitgevoerd, andere mogen gelijktijdig worden uitgevoerd. Meestal is het zo dat de duur van het project globaal genomen afhankelijk is van een aantal op elkaar aansluitende activiteiten. Indien de tijd voorzien voor de uitvoering van deze activiteiten kan ingekort worden, kan heel het project vroeger klaar zijn. Van andere activiteiten mag de uitvoeringstijd variëren zonder de duur van het project te beïnvloeden.

Belangrijke voordelen van netwerkplanning zijn:

- Goede voortgangscontrole
- Verbetering van de communicatie via het netwerk
- Het opsporen van bottlenecks

> [!INFO] Geschiedenis
> De PERT methode is uitgevonden door de United States Department of Defense's US Navy Special Projects Office in 1958 als een onderdeel van het Polaris project. De PERT methode lijkt sterk op de kritieke pad methode. Bij de kritische pad methode wordt uitgegaan van de gesommeerde duur van het kritieke pad, terwijl in de PERT methode een kansberekening wordt toegepast.
[[@geeksforgeeksDifferencePERT2025]]

### Hoofdbegrippen
#### Knooppunt
- Gebeurtenis
- Aanvang of einde van een taak, werkzaamheid of bewerking
- Neemt geen tijd, arbeid of grondstoffen in beslag
- Voorgesteld door een cirkel

![](https://i.imgur.com/i1yrEop.png)

#### Activiteit 

- Uitvoering van een taak
- Er zijn mensen, materialen, hulpmiddelen en tijd voor nodig
- Voorgesteld door een pijl met willekeurige lengte tussen twee knooppunten

![](https://i.imgur.com/4l0mSXc.png)

#### Netwerk:

- Brengt de logische opeenvolging van de activiteiten in beeld
- Welke activiteiten gaan vooraf of volgen of verlopen simultaan

![](https://i.imgur.com/w6iVctQ.png)

#### Schijnactiviteit

- Een technisch noodzakelijke wachttijd veroorzaakt door een natuurlijk proces of een noodzakelijke wachttijd veroorzaakt door afspraken met derden
- Neemt alleen tijd, geen mankracht of hulpmiddelen in beslag

![](https://i.imgur.com/MeK1nfw.png)

#### Relatielijn (of 0-lijn)

- Geeft een noodzakelijk verband aan
- Neemt geen tijd in beslag, geen mankracht en geen hulpmiddelen
- Voorgesteld met een stippellijn tussen twee knooppunten met een 0
- Handige oplossing voor tekenproblemen

![](https://i.imgur.com/UAnJVmQ.png)

Voor een goede uitleg, zie volgende filmpjes

<iframe width="560" height="315" src="https://www.youtube.com/embed/ChF6FkW4I6c?si=SeOOBYwy3jkfx5Ht" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<iframe width="560" height="315" src="https://www.youtube.com/embed/J2YJwGa4rsc?si=YzRRjTJM29Jcq9kC" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

##### Handig referentieschema
![](https://i.imgur.com/nnauqcl.gif)
#### Afstemmingslijn

- Geeft een gewenst verband weer
- Voorgesteld door een stippellijn met een A


### Tijdsfactor

Eens het netwerk opgesteld moet men bepalen hoeveel tijd elk van de activiteiten in beslag neemt. 

Voor het berekenen van de verwachte tijd van een activiteit gebruiken we drie schattingen:

1. t$_o$ = optimistische schatting (most optimistic time)
2. t$_l$ = gemiddelde schatting (most likely time)
3. t$_p$ = pessimistische schatting (most pessimistic time)

formule verwachte tijd:

$$t_e= \frac{(t_o+ 4t_l + t_p)}{6}$$

### Verwachte tijdstippen

Eens alle activiteiten en knooppunten getekend zijn, gaan we het netwerk analyseren.

*T$_E$ = Earliest expected time*

In de voorwaartse gang berekenen we het vroegst mogelijke begin. Dit is het vroegst mogelijke tijdstip waarop een bepaald knooppunt kan bereikt worden, en meteen ook het vroegste begin van de activiteiten die vertrekken in dit knooppunt.

Voor elk pad (aaneenschakeling van activiteiten) dat in een bepaald knooppunt toekomt berekenen wij de som van de T$_E$’s van de activiteiten op dat pad. De grootste som wordt de T$_E$ van het beschouwde knooppunt.

*T$_L$ = Latest allowable time*

In de achterwaartse gang berekenen we het laatst toelaatbare eindtijdstip. Als een activiteit niet voltooid is op dit tijdstip wordt de globale duur van het project overschreden.

De T$_L$ wordt bepaald door de berekening te beginnen vanaf het laatste knooppunt van het project. De T$_L$ van een bepaald knooppunt is dan gelijk aan de T$_L$ van het volgende knooppunt, min de duurtijd van de activiteit die de twee knooppunten verbindt. Als er in een bepaald knooppunt verscheidene activiteiten vertrekken, dan maken wij de berekening langs de verschillende paden en gebruiken het kleinste getal als T$_L$ van het beschouwd knooppunt.

### Speling

Speling of “slack” is de maximale vertraging die een bepaalde activiteit mag oplopen, zonder dat een vertraging voor het hele project ontstaat.

$${Slack} = T_L – T_E$$

De speling kan zowel positief, nul als negatief zijn:

| positieve speling                                                                                  | geen speling                                            | negatieve speling                                                                                                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| de start van deze activiteit kan uitgesteld worden                                                 | bij deze activiteit geen vertraging mag optreden        | de uitvoering van de activiteit moet worden versneld indien we het project binnen de gestelde tijdsduur willen beëindigen |
| de uitvoering van deze activiteit mag vertraagd worden door minder mensen en middelen in te zetten | de juiste hoeveelheid mankracht en materiaal is ingezet | meer mensen en middelen moeten ingezet worden                                                                             |
|                                                                                                    |                                                         |                                                                                                                           |


### Kritieke pad

In het netwerk lopen verscheidene paden van de aanvangsfase naar de eindfase. Het pad dat de grootste tijdsduur vraagt om te doorlopen is het kritieke pad (Critical Path). Een vertraging op dit pad heeft een vertraging van heel het project tot gevolg.

De CPM-techniek is een methode om die activiteiten te bepalen en te coördineren, die uitgevoerd worden om vastgestelde doeleinden te bereiken binnen een voorgeschreven tijd.

Indien de T$_L$ en de T$_E$ van het hele project aan elkaar gelijk gesteld worden, is de speling op het kritieke pad overal gelijk aan 0.

### Oefeningen

Maak die, afhankelijk van je creatief talent, op papier, op een tablet of door middel van een tekenapplicatie zoals https://app.diagrams.net/

#### Oefening 1
![](https://i.imgur.com/JdvdiUn.png)

1. Bepaal de doorlooptijd
2. Duid het kritieke pad aan

#### Oefening 2
![](https://i.imgur.com/cfBQHVI.png)

1. Bepaal de doorlooptijd
2. Duid het kritieke pad aan

#### Oefening 3

De volgende activiteiten kwamen van pas toen een farao een piramide wenste te bouwen. Hij gebruikte drie raadgevers (architecten) die hem een schatting gaven van de vermoedelijke tijdsduur van de activiteiten. De Nubiër Aboe Simpel schatte erg optimistisch. De Babyloniër Catastrofix voorzag het ergste. De Egyptenaar Constuxes had al ervaring en gaf zijn erg gewaardeerde mening te kennen.

| act. | beschrijving                                                           | voorafgaand | optimistische tijd (jaren)(t<sub>o</sub>) | pessimistische tijd (jaren)(t<sub>p</sub>) | realistische tijd (jaren)(t<sub>l</sub>) |
| ---- | ---------------------------------------------------------------------- | ----------- | ----------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| A    | Maak de plannen                                                        | /           | 1                                         | 3                                          | 2                                        |
| B    | Zoek voldoende dienaren                                                | /           | 3                                         | 3                                          | 3                                        |
| C    | Hak en transporteer voldoende rotsen voor de beelden en de fundamenten | A, B        | 8                                         | 14                                         | 8                                        |
| D    | Leid voldoende dienaren op als beeldhouwers                          | B           | 2                                         | 4                                          | 3                                        |
| E    | Beeldhouw de figuren van de farao                                      | C,D         | 8                                         | 12                                         | 10                                       |
| F    | Leg de fundamenten                                                     | C           | 5                                         | 15                                         | 10                                       |
| G    | Verplaats het beeld naar de voet van de piramide                       | E,F         | 3                                         | 7                                          | 5                                        |
| H    | Vorm nu met de rotsblokken de piramide                                 | G           | 27                                        | 43                                         | 32                                       |


1. Stel de activiteiten voor als een netwerk.
2. Bepaal het kritieke pad.

#### Oefening 4

Een grote digitaliseringsproject bij het transportbedrijf *“H. Oessers”* omvat 14 activiteiten :

1. Het uitvoeren van de **projectanalyse** (act1) moet zijn gebeurd voordat de andere activiteiten kunnen starten. (10 weken)
2. Na de projectanalyse kan men beginnen met :
	 - de **probleemanalyse** van het **CRM**-systeem(act 2; 10 weken)
	 - de **probleemanalyse** van het **ERP**-systeem (act 3; 5 weken)
	 - het **aanvragen** van **offertes** voor de computerinstallatie (act 4; 5 weken)
	 - **werving en selectie** van **personeel** (act 5; 10 weken)
3. Na voltooiing van act 2 kan men beginnen met :
	 - de **bouw** van het **CRM**-systeem (act 6; 30 weken)
	 - de **invoeringsvoorbereiding** van het **CRM**-systeem (act 7;20 weken)
4. Na voltooiing van act 3 kan men beginnen met :
	 - de **bouw** van het **ERP**-systeem (act 8; 30 weken)
	 - de **invoeringsvoorbereiding** van het **ERP**-systeem (act 9; 20 weken)
5. Na voltooiing van act 4 kan men beginnen met act 10 : de **laptopkeuze**, gevolgd door de **levering** van de laptops. (45 weken)
6. Nadat de laptops geleverd zijn en act 5 is voltooid, kan men act 11 uitvoeren: de **installatie** van de software. (5 **weken**)
7. Na voltooiing van de activiteiten 6, 7, 11 kan men beginnen met act 12 : de **invoering** van het **CRM**-systeem. (10 weken)
8. Na voltooiing van de activiteiten 8, 9, 11 kan men beginnen met de act 13 : de **invoering** van het **ERP**-systeem. (10 weken)
9. Na invoering van beide systemen kan men act 14 starten: de **integratie** van het **ERP en CRM** systeem (10 weken)


**Gevraagd**

1. Teken het netwerk en duidt het kritieke pad aan.
2. Vermeld in het netwerk de nummers van de activiteiten, T$_E$ en T$_L$ bij elk knooppunt en de speling bij de activiteiten.

#### Extra oefening 5 (wordt niet uitgewerkt in de lessen, enkel het resultaat)

Het bedrijf WalkerWhite wil een applicatie maken voor smartphones over de serie Game of Thrones. De televisiezender HBO heeft voorlopig de goedkeuring gegeven aan het bedrijf indien zij de voorgestelde deadline halen.

Voor de ontwikkeling van de app heeft het bedrijf een kosten-batenanalyse uitgewerkt. De resources en tijd zijn echter beperkt.

Op vraag van de zender stelt het bedrijf een planning op om een overzicht te krijgen van de verwachte opleverdatum. 3 projectmanagers van WalkerWhite gaan na de laatste meeting met HBO samen naar de lokale McDonald’s om een PERT-planning op te stellen.


| Activiteit: Beschrijving     | Voorgaand | Junior ProjMgr Optimistic | Senior ProjMgr Most Likely | Junior ProjMgr Pessimistic |
| ---------------------------- | --------- | ------------------------- | -------------------------- | -------------------------- |
| Act 1: Analyse DevOps        | /         | 2                         | 6                          | 4                          |
| Act 2: Servers opzetten      | 1         | 2                         | 3                          | 4                          |
| Act 3: Dev omgeving opzetten | 1         | 1                         | 5                          | 3                          |
| Act 4: Uitwerken mockup’s    | 1         | 2                         | 8                          | 8                          |
| Act 5: DevOps finetunen      | 2,3       | 1                         | 2                          | 3                          |
| Act 6: Verwerken feedback    | 4         | 2                         | 3                          | 10                         |
| Act 7: Ontwikkeling iOS      | 5         | 3                         | 4                          | 5                          |
| Act 8: Ontwikkeling Android  | 5         | 6                         | 7                          | 8                          |
| Act 9: SW naar live-omgeving | 6         | 2                         | 9                          | 10                         |
| Act 10: Testen software      | 4         | 10                        | 20                         | 30                         |
| Act 11: Regressietesten      | 7,8,9     | 3                         | 10                         | 11                         |
| Act 12: Afwerking/oplevering | 10,11     | 6                         | 15                         | 18                         |
> [!remark] Opmerking
> Ingeschatte duur per projectmanager in **dagen**


**Gevraagd:**

- Werk een PERT-planning uit voor de applicatie: iGame of Thrones
- Bereken de verwachte tijd (t$_e$). Solution: 47 dagen
- Bepaal het kritieke pad. Solution : Act 1 – 4 – 6 – 9 – 11 – 12
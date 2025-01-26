Seperate docs for block and plot report! No way all that stuff is fitting in one doc. Reader itself will feel intimidated and stop midway.
Also, better have seperate doc for 

Data Categorization:
- Vector Types
- Area
- Occupancy

Block Report:
- Table of Contents
- Structure of Block Report
- Overview
  - Diagram
  - Message Queue => RabbitMQ
    - Block Request Queue
      - Message Structure
    - Block Response Queue
      - Message Structure
  - Client
    - Dashboard -> Missions -> Select mission -> Mission Details page -> Report Generation -> Block Report -> Generate report (try adding GIF)
    - Sends mission id to server
  - Server Service
    - mission data
    - layer data
    - processed layer data (area, length, type) (using TurfJS)
    - area and occupancy categorization
    - final data preparation (and structure) and send to report service
    - receive response from report service, and save mongodb document
  - Report Service
    - capture screenshots
    - generate docx document (using Docx)
      - cover page
      - sumamry page
      - insights page 1 => list and remarks on various key facilities in the block
      - insights page 2 => area and occupancy categorization and comparison
      - delivarable pages (for each layer)
    - save document to minio
    - send response to server

Plot Report:
- Table of Contents
- Structure of Plot Report
- Overview
  - Diagram
  - Message Queue => RabbitMQ
    - Plot Request Queue
      - Message Structure
    - Plot Response Queue
      - Message Structure
  - Client
    - Dashboard -> Missions -> Select mission -> Mission Details page -> Report Generation -> Plot Report -> Generate report (try adding GIF)
    - Sends mission id to server
  - Server Service
    - mission data
    - specific layer(s) data collected and processed (using TurfJS)
      - ORTHO Layer => for ortho image of area captured by the drone
      - Block Boundary Layer => for block data insights
      - Plot Layer => plots connected to block by `blockName`
      - Building Footprint Layer => buildings connected to plot by `premiseNo`
      - Waterbody Layer => area intersection with block for waterbody %
      - Jungle Layer => area intersection with block for tree cover %
      - Green Verge Layer => area intersection with block for greenery %
      - Garbage Collection Point Layer => feature intersection with block count for number of garbage collection points
    - final data preparation (and structure) and send to report service
    - receive response from report service, and save mongodb document
  - Report Service
    - capture screenshots
    - generate docx document (using Docx)
      - cover page
      - block image page
      - plot image page
      - front view image page
      - annual invoice commitment page
    - save document to minio
    - send response to server

TODO List:
- Plot report page screenshots sample for "Structure of Plot Report"
- 
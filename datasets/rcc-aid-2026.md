# RCC-AID Data

## Preprocessing
- 1. automatic filtering of TCGA data based on scan metadata
- 2. automatic segmentation with the RUMC kidney/lesion segmentation tool
- 3. manual selection of primary tumours and all cysts by student annotators
- 4. manual review of hard cases by a board-certified radiologist
- 5. Rejection of: non-contrast phases, uncertain cases, bad segmentations

## Known issues
Students selected a primary lesion plus cysts. In some cases there seem to be a secondary tumour that remains unsegmented, because the students didnt select it.
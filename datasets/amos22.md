# Data Structure

```
|--- imagesTr/
|    |--- amos_<patient_id>.nii.gz             # CT scan
|
|--- labelsTr/
|    |--- amos_<patient_id>.nii.gz             # Organ segmentation mask
|
|--- imagesVa/
|--- labelsVa/
|--- imagesTs/
|--- labelsTs/
```

# Organ Segmentation Mask

The organ segmentation mask contains voxel-wise organ segmentations with the following semantics:

```
"0": "background"
"1": "spleen"
"2": "right kidney"
"3": "left kidney"
"4": "gall bladder"
"5": "esophagus"
"6": "liver"
"7": "stomach"
"8": "arota"
"9": "postcava"
"10": "pancreas"
"11": "right adrenal gland"
"12": "left adrenal gland"
"13": "duodenum"
"14": "bladder"
"15": "prostate/uterus"
```
# Longitudinal Melanoma CT Dataset

A publicly annotated dataset of longitudinal whole-body CT studies designed for AI-based lesion detection, segmentation, and therapy response assessment in oncology.

---

## Overview

| Property | Details |
|---|---|
| **Modality** | Computed Tomography (CT) |
| **Patients** | 300 melanoma patients |
| **Timepoints** | 2 per patient — baseline staging scan + post-therapy follow-up |
| **Site** | Single site (UKT) |
| **Format** | Anonymized NIfTI (.nii.gz), CSV, JSON |
| **Annotation** | Manual segmentation by two experienced radiologists |

---

## Data Structure

```
|--- inputsTr/
|    |--- <patient_id>.csv                      # Lesion metadata for patient
|    |--- <patient_id>_BL_00.json              # Baseline lesion centers of gravity (Grand-Challenge JSON)
|    |--- <patient_id>_BL_img_00.nii.gz        # Baseline CT image
|    |--- <patient_id>_BL_mask_00.nii.gz       # Baseline lesion segmentation mask (integer)
|    |--- <patient_id>_FU_00.json              # Follow-up lesion centers of gravity
|    |--- <patient_id>_FU_01.json              # Second follow-up (if available)
|    |--- <patient_id>_FU_img_00.nii.gz        # Follow-up CT image (first body region)
|    |--- <patient_id>_FU_img_01.nii.gz        # Follow-up CT image (second body region, if available)
|
|--- targetsTr/
     |--- <patient_id>_FU_mask_00.nii.gz       # Follow-up lesion mask (first body region)
     |--- <patient_id>_FU_mask_01.nii.gz       # Follow-up lesion mask (second body region, if available)
```

Patient IDs are 10-digit alphanumeric strings (e.g., `c6f057b865`). File suffixes `_00`, `_01` correspond to body region image IDs (0, 1, or 2).

---

## CSV File Reference

Each patient has an accompanying `.csv` file containing per-lesion metadata with the following columns:

| Column | Type | Description |
|---|---|---|
| `lesion_id` | int | Continuous lesion ID for the patient |
| `cog_bl` | 3D coordinate | Lesion center of gravity in baseline image (pixel coordinates) |
| `cog_backpropagated` | 3D coordinate | Center of gravity backpropagated from follow-up to baseline via registration *(newly appearing lesions only)* |
| `img_id_bl` | int (0–2) | Baseline image ID |
| `cog_propagated` | 3D coordinate | Center of gravity propagated from baseline to follow-up via registration *(not available for all lesions)* |
| `cog_fu` | 3D coordinate | Lesion center of gravity in follow-up image (pixel coordinates) |
| `img_id_fu` | int (0–2) | Follow-up image ID |
| `lesion_type` | string | Anatomical location — one of: `Adrenals`, `CNS`, `Heart`, `Kidney`, `Liver`, `Lung`, `Lymph node`, `Others`, `Skeleton`, `Soft tissue / Skin`, `Spleen`, `unclear` |
| `topology_class` | string | Lesion change between timepoints — one of: `DISAPPEARING`, `MERGING`, `NEWLYAPPEARING`, `UNCHANGED` |
| `merged_into` | int | Follow-up lesion ID for `MERGING` cases |
| `volume_bl` | float (mm³) | Lesion volume in baseline image |
| `volume_fu` | float (mm³) | Lesion volume in follow-up image |
| `target_lesion` | bool | Whether the reader identified this as a target lesion |
| `use_for_challenge` | bool | Whether the case was included in the autoPET/CT IV challenge |
| `linking_unclear` | bool | Reader flag indicating uncertain lesion linking between timepoints |

---

## Annotation Protocol

Segmentations were produced by two experienced radiologists following a standardized three-step protocol:

1. **Lesion identification** — visual assessment of CT data alongside clinical examination reports
2. **Manual segmentation** — free-hand delineation of lesions in axial slices
3. **Longitudinal review** — baseline and follow-up segmentations reviewed side-by-side to confirm lesion correspondence

---

## CT Acquisition

All scans were acquired on Siemens CT scanners (Sensation 64, SOMATOM Definition AS/Flash/Force, Biograph128) using a standardized whole-body staging protocol (portal-venous phase, contrast-enhanced, supine with arms raised). Fixed tube voltage: 120 kV; slice thickness and increment: 3 mm.

---

## Resources

- Pre-trained deep learning model and processing scripts: [autopet.org](https://www.autopet.org)
- Additional conversion scripts available for DICOM, MHA, and HDF5 formats
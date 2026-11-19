# Service catalogue review files

All CSVs in this folder are review drafts generated from the supplied `Service_Departments_and_Price_Ranges.xlsx`. They have not been uploaded or applied to any database.

## Files

- `services-import-review.csv`: 15 department rows from the Departments sheet after excluding Registration and Mortuary Services, plus an Outpatient `Emergency and Casualty Services` group for non-transfer items categorized as emergency in the Items sheet. Verify that this department name and grouping match the hospital's preferred terminology.
- `service-items-import-1.csv` through `service-items-import-3.csv`: 1,351 individual service items, split into batches of at most 500 rows to fit the import workflow. Each row links to its department by name and contains its own SHA coverage flag, cash price, and SHA price.
- `ambulance-services-import-review.csv`: 17 inter-facility transfer options identified by `Transfer To`, `Transport to`, and `Local Transport` names. These belong on the ambulance page, not in the main services catalogue.

## Review before importing

- The workbook has 71 service items without a cash/mobile price. Those cells are left blank; verify or fill them before import.
- The source marks all 17 transfer options as not covered by SHA. Confirm those classifications with the hospital.
- Department-head, contact, location, cash/SHA summary range, item-total, publication, and sort-order fields are intentionally absent from the new service CSV schema. Item prices are stored on individual service entries.
- The extra emergency/casualty grouping preserves the non-transfer emergency rows without presenting them as ambulance offerings. Its name and outpatient placement need hospital review.
- `Specialist Clinics` remains the stored division value for compatibility; the site labels it **Clinics (Specialized Clinics)**.

Import the department CSV first, then the three service-item CSVs, then the ambulance options. Run validation and review the preview for each file before committing. No production database is changed by these files.

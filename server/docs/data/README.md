# Service import data review draft

`services-import-review.csv` is a draft transformed from the workbook `Service_Departments_and_Price_Ranges.xlsx` supplied for the bulk-import rollout. It is for review only and has not been uploaded or applied to any database.

Before using it, the hospital should verify the descriptions, tariff ranges, and SHA item counts against current approved source records. The workbook did not provide department heads, contacts, service hours, or locations, so those cells are blank. Registration and Mortuary Services are marked unpublished for initial review. `sortOrder` follows the workbook order.

SHA coverage is derived from the workbook's `itemsShaCovered` and `itemsTotal` counts. The legacy `nhifCovered` flag is intentionally omitted and will be retained for existing records until reviewed.

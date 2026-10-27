export const LEGACY_PATTERNS = {
  update_end_date: {
    title: 'LoadEndDate updated in place',
    code: `UPDATE sat_customer
SET LoadEndDate = @LoadDate
WHERE CustomerHashKey = @CustomerHashKey
  AND LoadEndDate = '9999-12-31';
INSERT INTO sat_customer (..., LoadEndDate)
VALUES (..., '9999-12-31');`,
  },
  transient_staging: {
    title: 'Transient staging',
    code: `TRUNCATE TABLE stage_customer;
BULK INSERT stage_customer FROM 'delivery.csv';
EXEC raw_vault.load_customer_h;`,
  },
  cloned_procedures: {
    title: 'One procedure per target and source',
    code: `EXEC load_customer_h_from_crm;
EXEC load_customer_h_from_shop;
EXEC load_customer_h_from_erp;`,
  },
  inline_hashes: {
    title: 'Inline hashes with mixed casts',
    code: `HASHBYTES('MD5', UPPER(CAST(c_custkey AS VARCHAR(20))));
HASHBYTES('MD5', UPPER(CONVERT(NVARCHAR(100), c_custkey)));`,
  },
  cloned_business_vault: {
    title: 'Business-vault objects cloned per source',
    code: `EXEC bv_customer_from_crm;
EXEC bv_customer_from_shop;`,
  },
  rules_in_raw: {
    title: 'Rules inside raw staging',
    code: `INSERT INTO raw_customer (...)
SELECT ..., CASE WHEN c_mktsegment = 'BUILDING'
                 THEN 'priority' ELSE 'standard' END
FROM stage_customer;`,
  },
  no_snapshot_control: {
    title: 'No snapshot control',
    code: `SELECT customer_h.hk_customer_h, sat_customer.*
FROM customer_h
JOIN sat_customer ON ...;`,
  },
} as const

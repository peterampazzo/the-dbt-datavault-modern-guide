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
  temp_table_procedure: {
    title: 'Order totals built with temp tables',
    code: `CREATE PROCEDURE reporting.refresh_customer_totals AS
BEGIN
    SELECT
        LTRIM(RTRIM(CAST(o_orderkey AS VARCHAR(20)))) AS o_orderkey,
        CAST(LTRIM(RTRIM(CAST(o_custkey AS VARCHAR(20)))) AS INT) AS o_custkey,
        CAST(o_orderdate AS DATE) AS o_orderdate,
        CAST(o_totalprice AS DECIMAL(18, 2)) AS o_totalprice
    INTO #orders_clean
    FROM stage.stg_orders;

    SELECT
        o_custkey,
        COUNT(*) AS order_count,
        SUM(o_totalprice) AS total_price
    INTO #customer_totals
    FROM #orders_clean
    GROUP BY o_custkey;

    UPDATE reporting.customer_totals
    SET order_count = totals.order_count,
        total_price = totals.total_price
    FROM #customer_totals AS totals
    WHERE reporting.customer_totals.o_custkey = totals.o_custkey;
END;`,
  },
  no_snapshot_control: {
    title: 'No snapshot control',
    code: `SELECT customer_h.hk_customer_h, sat_customer.*
FROM customer_h
JOIN sat_customer ON ...;`,
  },
} as const

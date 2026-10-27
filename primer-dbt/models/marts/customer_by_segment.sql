select
    c_mktsegment,
    count(*) as customer_count,
    sum(c_acctbal) as total_account_balance
from {{ ref('stg_customer') }}
group by c_mktsegment

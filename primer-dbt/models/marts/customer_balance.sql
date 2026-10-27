select
    c_custkey,
    {{ round_amount('c_acctbal') }} as account_balance
from {{ ref('stg_customer') }}

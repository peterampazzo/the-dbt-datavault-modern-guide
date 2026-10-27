select
    cast(c_custkey as integer) as c_custkey,
    trim(c_name) as c_name,
    trim(c_address) as c_address,
    cast(c_acctbal as decimal(12, 2)) as c_acctbal,
    c_mktsegment,
    c_comment
from {{ source('landing', 'customer') }}

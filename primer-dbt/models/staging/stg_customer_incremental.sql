{{ config(materialized='incremental') }}

select c_custkey, c_name, c_acctbal, ldts
from {{ source('landing', 'customer') }}
{% if is_incremental() %}
where ldts > (select max(ldts) from {{ this }})
{% endif %}

{% macro round_amount(value) %}
cast({{ value }} as decimal(12, 2))
{% endmacro %}

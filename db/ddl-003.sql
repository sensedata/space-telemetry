-- replace telemetry stats function from 002, lower limit on sessions sampled
create or replace function get_telemetry_time_interval_avg_stddev(_idx int)
  returns table(a double precision, sd double precision) AS
  $func$
  declare
    _session_id bigint;
  begin
   for _session_id in
      -- select distinct session from telemetry order by session desc limit 10
      select session_id from session order by session_id desc limit 10
   loop
      return query execute
      'with
      ival_t as (
        select extract(epoch from (ts - lag(ts) over (order by ts))) as ival
        from telemetry where idx = $1 and status = 24 and session_id = ' || _session_id || ' order by ts
      )
      select avg(ival) as a, stddev_samp(ival) as sd
      from ival_t'
      using _idx;
   end loop;
end
$func$  language plpgsql;


-- remove status table that was created in 002
drop table if exists status;

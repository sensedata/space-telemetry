-- Assumes a database named 'iss_telemetry' exists already

-- create status table
create table if not exists status(connected smallint not null, ts timestamp without time zone not null);

-- create session table
create table if not exists session(session_id bigint not null);
  
-- create unique session constraint
alter table session add unique (session_id);

-- create telemetry table
create table if not exists telemetry(idx smallint not null, value double precision not null, value_calibrated text, ts timestamp without time zone not null, status smallint not null, session_id bigint not null);

-- create unique telemetry constraint
alter table telemetry add unique (idx, value, ts, status);

-- create telemetry table index
create index idx_telemetry_idx_ts on telemetry (idx, ts);
create index idx_telemetry_idx_status_session_id on telemetry (idx, status, session_id);

-- create telemetry stats function  
create or replace function get_telemetry_time_interval_avg_stddev(_idx int)
  returns table(a double precision, sd double precision) AS
  $func$
  declare
    _session_id bigint;
  begin
   for _session_id in
      -- select distinct session from telemetry order by session desc limit 20
      select session_id from session order by session_id desc limit 20
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

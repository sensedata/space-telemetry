-- drop index on materialized view, as it is now obsolete
drop index telemetry_stats_view_idx;

-- drop materialized view that was created in a previous iteration, as it is now obsolete
drop view telemetry_stats_view;

-- create telemetry session stats table
create table if not exists telemetry_session_stats(
  idx smallint not null,
  session_id bigint not null,
  value_min double precision not null,
  value_max double precision not null,
  value_avg double precision not null,
  value_stddev double precision not null,
  value_delta_count int not null,
  lag_min double precision not null,
  lag_max double precision not null,
  lag_avg double precision not null,
  lag_stddev double precision not null
);

-- create unique telemetry session stats constraint
alter table telemetry add unique (idx, session_id);

-- create telemetry session stats table index
-- create index idx_telemetry_idx_ts on telemetry (idx, session);

-- create telemetry stats calc function
create or replace function get_telemetry_session_stats( _session_id bigint, _idx int)
  returns table(
    session_id bigint,
    idx int,
    value_min double precision,
    value_max double precision,
    value_avg double precision,
    value_stddev double precision,
    value_delta_count bigint,
    lag_min double precision,
    lag_max double precision,
    lag_avg double precision,
    lag_stddev double precision
    ) AS $$
    with
    time_series as (
      select sec
      from generate_series(
        (select min(ts) from telemetry where session_id = $1 and idx = $2 and status = 24),
        (select max(ts) from telemetry where session_id = $1 and idx = $2 and status = 24),
        '1 sec'
      ) as sec
    ),
    telemetry_change_values as (
      select
        date_trunc('sec', ts) as sec,
        value
      from telemetry
      where session_id = $1 and idx = $2 and status = 24
    ),
    telemetry_filled_values as (
      select
        time_series.sec as sec,
        (select telemetry_change_values.value
         from telemetry_change_values
         where telemetry_change_values.sec <= time_series.sec
         order by telemetry_change_values.sec DESC
         limit 1)
      from
        time_series left outer join telemetry_change_values
          on telemetry_change_values.sec = time_series.sec
        order by time_series.sec
    ),
    telemetry_session_value_stats as (
      select
        $2 as idx,
        min(value) as value_min,
        max(value) as value_max,
        avg(value) as value_avg,
        stddev_samp(value) as value_stddev
      from telemetry_filled_values
    ),
    telemetry_session_lag_stats as (
      select
        $2 as idx,
        count(lag) as value_delta_count,
        min(lag) as lag_min,
        max(lag) as lag_max,
        avg(lag) as lag_avg,
        stddev_samp(lag) as lag_stddev
      from (
        select
          extract(epoch from (ts - lag(ts) over (partition by idx, session_id order by idx, session_id, ts))) as lag
        from telemetry
          where session_id = $1 and idx = $2 and status = 24
      ) as temp_lag
    )
    select
    $1 as session_id,
    $2 as idx,
    v.value_min as value_min,
    v.value_max as value_min,
    v.value_avg as value_avg,
    v.value_stddev as value_stddev,
    l.value_delta_count as value_delta_count,
    l.lag_min as lag_min,
    l.lag_max as lag_max,
    l.lag_avg as lag_avg,
    l.lag_stddev as lag_stddev
    from telemetry_session_value_stats v inner join telemetry_session_lag_stats l
    on v.idx = l.idx;
$$ language sql;


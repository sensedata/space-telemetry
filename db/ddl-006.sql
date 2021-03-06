drop index if exists idx_telemetry_idx_ts_session_id;

--create index on telemetry
create index idx_telemetry_idx_ts_session_id on telemetry (idx, ts, session_id) where status = 24;

--drop obsolete table
drop table if exists telemetry_session_stats;

--replace table
create table telemetry_session_stats(
  idx smallint not null,
  session_id bigint not null,
  tick_count int not null,
  delta_count int not null,
  delta_ts_min timestamp without time zone,
  delta_ts_max timestamp without time zone,
  value_min double precision,
  value_max double precision,
  value_avg double precision,
  value_stddev double precision,
  lag_min double precision,
  lag_max double precision,
  lag_avg double precision,
  lag_stddev double precision
);

-- create unique telemetry session stats constraint
alter table telemetry_session_stats add unique (idx, session_id);

-- create telemetry session stats table index
create index telemetry_session_stats_idx on telemetry_session_stats (idx);

--drop obsolete version of this function
drop function if exists get_telemetry_session_stats(bigint, int);

--replace obsolete version of this function
create or replace function get_telemetry_session_stats( _session_id bigint, _idx int)
  returns table(
    session_id bigint,
    idx int,
    tick_count bigint,
    delta_count bigint,
    delta_ts_min timestamp without time zone,
    delta_ts_max timestamp without time zone,
    value_min double precision,
    value_max double precision,
    value_avg double precision,
    value_stddev double precision,
    lag_min double precision,
    lag_max double precision,
    lag_avg double precision,
    lag_stddev double precision
    ) AS $$
    with
    min_max as (
      select
        case when min(a.ts) < min(b.ts)
        then min(a.ts)
        else min(b.ts) end as ts_min,
        case when max(a.ts) > max(b.ts)
        then max(a.ts)
        else max(b.ts) end as ts_max
      from telemetry a left outer join telemetry b
      on a.session_id = b.session_id and a.status = b.status
      where a.idx = 296 and b.idx = $2 and a.session_id = $1 and a.status = 24
      and a.ts > '2015-01-01' and b.ts > '2015-01-01'
    ),
    time_series as (
      select sec
      from generate_series(
        (select ts_min from min_max),
        (select ts_max from min_max),
        '1 sec'
      ) as sec
    ),
    telemetry_change_values as (
      select
        case when a=100 then date_trunc('sec', to_timestamp(0))
        else (select date_trunc('sec', ts_min) from min_max)
        end as sec,
        case when a=100 then 0
        else (select value from telemetry where idx = $2 and status = 24 and ts <= (select ts_min from min_max) order by ts desc limit 1)
        end as value
      from (select 1 as a) dummy
      union
      select
        date_trunc('sec', ts) as sec,
        value
      from telemetry
      where session_id = $1 and idx = $2 and status = 24 and ts > '2015-01-01'
    ),
    telemetry_filled_values as (
      select
        time_series.sec as sec,
        (select telemetry_change_values.value
         from telemetry_change_values
         where telemetry_change_values.sec <= time_series.sec
         order by telemetry_change_values.sec desc
         limit 1)
      from
        time_series left outer join telemetry_change_values
          on telemetry_change_values.sec = time_series.sec
        order by time_series.sec
    ),
    telemetry_session_value_stats as (
      select
        $2 as idx,
        count(*) as tick_count,
        min(value) as value_min,
        max(value) as value_max,
        avg(value) as value_avg,
        stddev_samp(value) as value_stddev
      from telemetry_filled_values
    ),
    telemetry_session_lag_stats as (
      select
        $2 as idx,
        count(*) as delta_count,
        min(lag) as lag_min,
        max(lag) as lag_max,
        avg(lag) as lag_avg,
        stddev_samp(lag) as lag_stddev,
        min(ts) as ts_min,
        max(ts) as ts_max
      from (
        select
          extract(epoch from (ts - lag(ts) over (partition by idx, session_id order by idx, session_id, ts))) as lag,
          ts
        from telemetry
          where session_id = $1 and idx = $2 and status = 24 and ts > '2015-01-01'
      ) as temp_lag
    )
    select
    $1 as session_id,
    $2 as idx,
    coalesce(v.tick_count, 0) as tick_count,
    coalesce(l.delta_count, 0) as delta_count,
    l.ts_min as delta_ts_min,
    l.ts_max as delta_ts_max,
    v.value_min as value_min,
    v.value_max as value_min,
    v.value_avg as value_avg,
    v.value_stddev as value_stddev,
    l.lag_min as lag_min,
    l.lag_max as lag_max,
    l.lag_avg as lag_avg,
    l.lag_stddev as lag_stddev
    from telemetry_session_value_stats v inner join telemetry_session_lag_stats l
    on v.idx = l.idx
$$ language sql stable;

-- drop index on materialized view, as it is now obsolete
drop index telemetry_stats_view_idx;

-- drop materialized view that was created in a previous iteration, as it is now obsolete
drop materialized view telemetry_stats_view;

-- create telemetry session stats table
create table if not exists telemetry_session_stats(
  idx smallint not null,
  session_id bigint not null,
  value_count int not null,
  value_min double precision,
  value_max double precision,
  value_avg double precision,
  value_stddev double precision,
  lag_min double precision,
  lag_max double precision,
  lag_avg double precision,
  lag_stddev double precision,
  ts_min timestamp without time zone,
  ts_max timestamp without time zone
);

-- create unique telemetry session stats constraint
alter table telemetry_session_stats add unique (idx, session_id);

-- create telemetry session stats table index
create index telemetry_session_stats_idx on telemetry_session_stats (idx);

-- create telemetry stats calc function
create or replace function get_telemetry_session_stats( _session_id bigint, _idx int)
  returns table(
    session_id bigint,
    idx int,
    value_count bigint,
    value_min double precision,
    value_max double precision,
    value_avg double precision,
    value_stddev double precision,
    lag_min double precision,
    lag_max double precision,
    lag_avg double precision,
    lag_stddev double precision,
    ts_min timestamp without time zone,
    ts_max timestamp without time zone
    ) AS $$
    with
    time_series as (
      select sec
      from generate_series(
        (select min(coalesce(ts, date '1970-01-01')) from telemetry where session_id = $1 and idx = $2 and status = 24 and ts > '2015-01-01'),
        (select max(coalesce(ts, date '1970-01-01')) from telemetry where session_id = $1 and idx = $2 and status = 24 and ts > '2015-01-01'),
        '1 sec'
      ) as sec
    ),
    telemetry_change_values as (
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
        count(*) as value_count,
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
    coalesce(l.value_count, 0) as value_count,
    v.value_min as value_min,
    v.value_max as value_min,
    v.value_avg as value_avg,
    v.value_stddev as value_stddev,
    l.lag_min as lag_min,
    l.lag_max as lag_max,
    l.lag_avg as lag_avg,
    l.lag_stddev as lag_stddev,
    l.ts_min as ts_min,
    l.ts_max as ts_max
    from telemetry_session_value_stats v inner join telemetry_session_lag_stats l
    on v.idx = l.idx
$$ language sql stable;


-- create stats gaps function
create or replace function get_telemetry_session_stats_gaps(_series_max int)
  returns table(
    session_id bigint,
    idx int
    ) AS $$
    with
    idx_series as (
       select idx from generate_series(0, $1 ,1) as idx
    ),
    all_idx_session as (
      select
        session_id,
        idx
      from session cross join idx_series
      -- exclude latest session, as it may still be in progress
      where session_id <> (select max(session_id) from session)
    ),
    session_idx_join as (
      select distinct
        ais.session_id as ais_sid,
        ais.idx as ais_idx,
        tss.session_id as tss_sid,
        tss.idx as tss_idx
      from all_idx_session ais left join telemetry_session_stats tss
        on ais.idx = tss.idx and ais.session_id = tss.session_id
    )
    select
      ais_sid as session_id,
      ais_idx as idx
    from session_idx_join
    where tss_sid is null and tss_idx is null
    order by ais_sid, ais_idx
$$ language sql stable;


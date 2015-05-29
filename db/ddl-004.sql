-- drop unused function
drop function if exists get_telemetry_time_interval_avg_stddev(int);

-- create a stats oriented materialized view
create materialized view telemetry_stats_view
  as select
      lag.idx as idx,
      val.vc as val_count,
      val.va as val_avg,
      val.vsd as val_sd,
      val.vmin as val_min,
      val.vmax as val_max,
      lag.a as lag_avg,
      lag.sd as lag_stddev
    from (
      select
        idx,
        avg(a) as a,
        avg(sd) as sd
      from (
        select
          avg(lag) as a,
          stddev_samp(lag) as sd,
          idx,
          session_id
        from (
          select
            extract(epoch from (ts - lag(ts) over (partition by idx, session_id order by idx, session_id, ts))) as lag,
            idx,
            session_id
          from telemetry
          where status = 24
        ) as temp_lag
        group by idx, session_id
        order by idx, session_id
      ) as temp_lag_session group by idx
    ) as lag
    inner join (
      select
        idx,
        count(value) as vc,
        avg(value) as va,
        stddev_samp(value) as vsd,
        min(value) as vmin,
        max(value) as vmax
      from telemetry
      where status = 24
      group by idx
    ) as val
    on lag.idx = val.idx
  with data;

-- create an unique index on view so that we many refresh it concurrently (see postgres docs for why)
create unique index telemetry_stats_view_idx on telemetry_stats_view (idx);

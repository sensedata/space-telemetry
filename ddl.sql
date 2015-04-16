--
-- 
--
-- Assumes a database named 'iss_telemetry' exists already

-- create data table
create table if not exists data(idx smallint, value double precision, ts timestamp without time zone);

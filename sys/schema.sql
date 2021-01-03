-- main table for wind, and other environmental parameters 
CREATE TABLE wind(
	tstamp TIMESTAMP NOT NULL, 	-- seconds since epoch
	period INTEGER NOT NULL, 	-- minutes
	direction INTEGER,			-- degrees
	revolutions INTEGER,		-- number per timeperiod
	illuminance INTEGER,		-- lux
	int_humidity INTEGER,		-- internal %RH
	int_pressure INTEGER,		-- millibars
	int_temperature INTEGER,	-- millidegrees Celsius
	ext_humidity INTEGER,		-- external %RH
	ext_pressure INTEGER,		-- millibars
	ext_temperature INTEGER		-- millidegrees Celsius
);
CREATE UNIQUE INDEX wind_tstamp_period ON wind(tstamp, period);

-- Particulate Matter data
CREATE TABLE particles(
	tstamp TIMESTAMP NOT NULL, 
	period INTEGER NOT NULL, 
	pm05_mc INTEGER,	-- PM0.5 mass concentration (µg/m3)
	pm1_mc  INTEGER,	-- PM1.0
	pm25_mc INTEGER,	-- PM2.5
	pm4_mc  INTEGER,	-- PM4.0
	pm10_mc INTEGER,	-- PM10 
	pm05_nc INTEGER,	-- PM0.5 number concentration (#/cm3)
	pm1_nc  INTEGER,	-- PM1.0
	pm25_nc INTEGER,	-- PM2.5
	pm4_nc  INTEGER,	-- PM4.0
	pm10_nc INTEGER,	-- PM10 
	tps INTEGER			-- typical particle size (nm)
);
CREATE UNIQUE INDEX pm_tstamp_period ON particles(tstamp, period);

-- convenient views
CREATE VIEW wind_hourly AS 
	SELECT 
		strftime('%Y-%m-%d %H:00', tstamp, 'unixepoch', 'localtime') AS date, 
		ROUND(9 * SUM(revolutions) / (4 * 60 * 60.0), 1) AS wind_mph, 
		ROUND(AVG(direction)) AS wind_dir, 
		ROUND(AVG(illuminance)) AS illuminance, 
		ROUND(AVG(int_humidity)) AS int_humidity,
		ROUND(AVG(int_pressure)) AS int_pressure,
		ROUND(AVG(int_temperature) / 1000, 1) AS int_temperature,
		ROUND(AVG(ext_humidity)) AS ext_humidity,
		ROUND(AVG(ext_pressure)) AS ext_pressure,
		ROUND(AVG(ext_temperature) / 1000, 1) AS ext_temperature	
	FROM wind 
		WHERE period = 1
	GROUP BY 1;

CREATE VIEW particles_hourly AS 
	SELECT 
		strftime('%Y-%m-%d %H:00', tstamp, 'unixepoch', 'localtime') as date, 
		ROUND(AVG(pm25_mc)) as pm25, 
		ROUND(AVG(pm10_mc)) as pm10, 
		ROUND(AVG(tps)) as tps 
	FROM 
		particles 
	WHERE 
		period = 2 
	GROUP BY 1;


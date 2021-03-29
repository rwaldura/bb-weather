# BB Weather Station

A weather station running on BeagleBone. 

## Current Status

July 2020: wind only, speed and direction. 

## Installation

```
cd sys
sudo ln -s $PWD/rc.local /etc
sudo ln -s $PWD/mini-httpd.conf /etc
sudo $VISUAL /etc/default/mini-httpd # change to START=1

gcc -fPIC -lm -shared -o libsqlfunctions.so sqlite-extension-functions.c
sudo cp libsqlfunctions.so /usr/lib

crontab -e
# m h  dom mon dow   command
* * * * * bb-weather/update-db.sh >>/tmp/update-db.out 2>&1
```

## Design

`rc.local`, executed at startup, starts `collect-wind-data.sh`.
This program runs the sensor reader `anemometer.js` and writes its output
to (a) files in `/var/weather/log` (for permanent archival), and 
(b) the program `populate-wind-db.sh`.

The latter inserts wind data into a local SQL database 
`/var/weather/weather.db` for querying, and further processing.

`anemometer.js` is a BoneScript ([docs](http://beagleboard.org/bonescript), 
[source](https://github.com/jadonk/bonescript)) program that continuously reads the
wind sensor, and outputs
the state of the sensor at regular time intervals. 
I.e. the vane direction, the wind speed. 

Periodically, this data is aggregated further by `update-db.sh`. This program 
reads wind data, and groups it by longer time periods, 
e.g. aggregated by hour, by day. 

Finally, the `www` directory contains the Web interface: `index.html` calls 
`getDataTable.cgi` to retrieve aggregated wind data from the database, 
and renders it as charts. Chart generation is done
with [Google Charts](https://developers.google.com/chart).

## Wifi

Without a [BeagleBone Wireless](https://beagleboard.org/black-wireless), here's what I did:

1. Find a Wifi adapter that is compatible. After trying out 3 different USB adapters, I finally located and bought a WL1835MOD cape off eBay. 
1. Edit `/boot/uEnv.txt` to load the overlay BB-BONE-WL1835MOD-00A0, plus associated random patches to get things to work right: see `sys/boot-uEnv.txt`. 
1. Disable `wpa_supplicant` by editing `/lib/systemd/system/wpa_supplicant.service`. `systemctl disable` doesn't do it for me. 
1. Edit `/etc/network/interfaces` and add:

```
auto wlan0
allow-hotplug wlan0
iface wlan0 inet dhcp
   wpa-ssid "my-ssid"
   wpa-psk "my-password"
```

## Dependencies

* [BeagleBone White](https://beagleboard.org/bone-original)
* [WL1835MOD cape](https://github.com/CircuitCo/WL1835MOD) — no longer available. 
* Wind sensor: [Davis Instruments Anemometer](https://www.amazon.com/Davis-Instruments-Anemometer-Vantage-Pro2/dp/B004GK9MFO/)
* Particulate Matter sensor: Sensirion SPS30

what | version
------------ | -------------
OS | beaglebone 4.19.94-ti-r55 armv7l GNU/Linux
Distro | Debian GNU/Linux 10.4 ; BeagleBoard.org Debian Buster IoT Image 2020-04-06
node | 10.19.0
bonescript | 0.7.3


## TODO

Calculate and display wind gusts, defined as: 

a sudden, brief increase in speed of the wind. According to U.S. weather observing practice, gusts are reported when the peak wind speed reaches at least 16 knots and the variation in wind speed between the peaks and lulls is at least 9 knots. The duration of a gust is usually less than 20 seconds. 

per https://en.wikipedia.org/wiki/Wind_gust 



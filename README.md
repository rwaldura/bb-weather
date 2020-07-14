# BB Weather Station

A weather station running on BeagleBone. 

## Current Status

July 2020: wind only, speed and direction. 

## Setup

```
sudo ln -s $PWD/sys/rc.local /etc
sudo ln -s $PWD/sys/mini_httpd.conf /etc
sudo $VISUAL /etc/default/mini-httpd # change to START=1
```

In crontab:

```
# m h  dom mon dow   command
* * * * * bb-weather/update-db.sh >>/tmp/update-db.out 2>&1
```

## Wifi

What a hassle! Truly, I recommend buying the [BeagleBone Wireless](https://beagleboard.org/black-wireless).
Otherwise, here's what I did:

1. Find a USB Wifi adapter that is compatible. I got a Realtek RTL8192.
1. To get the driver to autoload: `sudo rm /etc/modprobe.d/rtl8723bu-blacklist.conf`
1. Disable `wpa_supplicant` by editing `/lib/systemd/system/wpa_supplicant.service`. `systemctl disable` doesn't do it for me. 
1. Edit `/etc/network/interfaces` and add:

```auto wlan0
allow-hotplug wlan0
iface wlan0 inet dhcp
   wpa-ssid "my-ssid"
   wpa-psk "my-password"
```

## Dependencies

* [BeagleBone White](https://beagleboard.org/bone-original)
* Wind sensor: [Davis Instruments Anemometer](https://www.amazon.com/Davis-Instruments-Anemometer-Vantage-Pro2/dp/B004GK9MFO/)

what | version
------------ | -------------
OS | beaglebone 4.19.94-ti-r43 #1buster SMP PREEMPT Wed Apr 22 06:11:16 UTC 2020 armv7l GNU/Linux
Distro | Debian GNU/Linux 10.4 ; BeagleBoard.org Debian Buster IoT Image 2020-04-06
python | Python 2.7.16 ; Python 3.7.3
gcc | gcc (Debian 8.3.0-6) 8.3.0
node | 10.19.0
bonescript | 0.7.3



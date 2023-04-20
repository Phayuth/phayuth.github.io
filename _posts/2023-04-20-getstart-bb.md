---
title: Getting Started with Beaglebone Blue
categories: [Embeded System]
tags: [tutorial]     # TAG names should always be lowercase
---

Beaglebone Blue is a linux debian base OS device that allow user player around with robotic stuff. There are 3 ways to powering the board. You can plug all 3 power sources at the same time without any problem.

## Update BBB debian
- BBB can be run from 2 storage sources
    - SD Card
    - eMMC (embedded Mutli Media Card)(storage that directly solder onto board).
- Out of the box, BBB already has a pre-installed debian OS where user can easily use it right away.
- In a condition where we need to update the debian, we can follow the instruction below.

## Images Download

| MATLAB                      | [Image Link](https://beagleboard.org/latest-images)|
|:----------------------------|:-----------------|
|[Debian 9.5 2018-10-07 4GB SD IoT](https://debian.beagleboard.org/images/bone-debian-9.5-iot-armhf-2018-10-07-4gb.img.xz)|Allow the BBB directly boot from the SD card|
| Debian 9.5 2018-10-07 4GB SD IoT eMMC flasher | Require the BBB to flash the eMMC before use |

## Flash Image eMMC flasher
- Download [BalenaEtcher](https://www.balena.io/etcher/)
- Flash the downloaded Image to the SD card using BalenaEtcher
- Put SD card into the BBB card slot
- Hold SD button on the BBB while connect it to the PC
- Wait until the LED flashing then release the SD button
- When new storage appear on the PC, the BBB is ready to use

## Flash Image non eMMC flasher
Follow the precedure from Flash Image eMMC flasher section
- Connect to the BBB via browser Cloud9 IDE address : 192.168. 7.2:3000
- Navigate to /opt/scripts/tools/eMMC
```bash
cd
cd opt/scripts/tools/eMMC
```
Execute init-eMMC-flasher-v3.sh
```bash
sudo ./init-eMMC-flasher-v3.sh
```
- BBB will start to go in to flashing mode. Do not disconnect the power.
- Wait until the LED completely shutdown then unplug the power and replug back in.

## Connect WIFI
On Terminal Cloud9 IDE
```bash
connmanctl
tether wifi off
enable wifi
scan wifi
services
agent on
connect {wifi name ex:wifi_f45eab_.................}
password
exit
```

## Shutdown BBB
```bash
sudo shutdown now
```

## Auto Execute Program on Startup
Reference [Link1](https://stackoverflow.com/questions/28854705/executing-a-script-on-startup-using-beaglebone-black) | [Link2](https://gist.github.com/tstellanova/7323116)

1. Identify and Make sure you have a main compiled file that is ready to run by executed it via ```./name_program```

Case Simulink generated file.

- On BBB terminal in cloud9
    - On /home/ create a folder to store generated file from Simulink
	```
    mkdir name_of_folder
    ```
- On Simulink go to config
	- Change target folder to the folder we just created on BBB
	- Run build
	- On BBB go inside the folder and run the file to make sure it is working properly
	```
    cd name_of_folder
    sudo ./name_program.elf
	```

After the file is working properly. Let start making it auto start.

2. Create a shell script (name.sh) in ```/usr/bin/```
```bash
cd /usr/bin/
sudo touch name.sh
sudo nano name.sh
```
- Put the following code in the .sh file and modify it up to your desired
```bash
#!/bin/bash
cd /home/debian/name_of_folder
sudo ./name_program.elf
```
- Exit out from editor
- Make it executable
```bash
chmod u+x /usr/bin/name.sh
```

3. Create service file in ```/lib/systemd/``` (if not working create in ```/lib/systemd/system/```)
```bash
cd /lib/system/
sudo touch my_srv.service 
sudo nano my_srv.service
```
- Put the following code in the file
```bash
[Unit]
Description=description of code
After=syslog.target network.target
[Service]
Type=simple
ExecStart=/usr/bin/name.sh
[Install]
WantedBy=multi-user.target
```
- Exit out from editor

4. Create a symbolic link between your script and a special location under ```/etc```

```
sudo ln -s /lib/systemd/my_srv.service /etc/systemd/system/my_srv.service
```

5. Start service
```bash
sudo systemctl daemon-reload
sudo systemctl enable my_srv.service
sudo systemctl start my_srv.service
```

6. Reboot to take effect
```bash
sudo reboot now
```

7. Control service
```bash
sudo systemctl status my_srv.service
sudo systemctl stop my_srv.service
sudo systemctl start my_srv.service
sudo systemctl disable my_srv.service
```

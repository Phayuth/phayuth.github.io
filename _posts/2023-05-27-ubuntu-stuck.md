---
title: Fixing Ubuntu Boot Stuck by Nvidia Driver
categories: [Fix]
tags: [tutorial]     # TAG names should always be lowercase
---

## Guide
1. Rapidly Press Shift Key to enter ubuntu booth option
2. Go to Advanced
3. Go to recovery mode
4. Go to root terminal
5. `dpkg -l | grep -i nvidia`
6. `sudo apt-get remove --purge '^nvidia-.*'`
7. `sudo apt autoremove`
8. `exit` and boot up as normal


## Reference
[Link](https://askubuntu.com/questions/206283/how-can-i-uninstall-a-nvidia-driver-completely)

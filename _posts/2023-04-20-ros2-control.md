---
title: ROS2 Control
categories: [Robotic]
tags: [tutorial]     # TAG names should always be lowercase
---

Draft Writing

`ros2_control` is one of the beast for me to understand. so I want to write a few note for my adventure in `ros2_contrl`. I have no clue how to code in C++ so being able to understand the concept and just use some existing code will be counted as an achievement for me.

## Overview of the System
![Desktop View](/assets/img/ros2_control/overview.svg){: width="972" height="589" }

## Nomenclature
Before anything else, have a look at the diagram and understand each component roughtly to see a larger picture.

### Control Manager
It is the main entry point of `ros2_control`.

### Hardware Components
There are 3 type of hardware interfaces/components:

1. **System**
2. **Actuator**
3. **Sensor**


### Resource Manager

**Command Interface**

**State Interface**


### Controllers
**Controllers**

This is where the closed loop or opened loop control system go.

Available Controllers so far :
- Admittance Controller
- Tricycle Controller
- Differential Drive Controller
- Forward Command Controller
- Joint Trajectory Controller
- Position Controllers
- Velocity Controllers
- Effort Controllers

**Broadcasters**

This is NOT an actually controller. It is a state broadcaster that publish the current state of robot i.e Joint State (Position, Velocity, ...). It take no command from user.

### User Interfaces
An interface where user control the controller manager with ROS services or CLI.
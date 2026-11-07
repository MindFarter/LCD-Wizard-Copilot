# Eco2UI LCD Wizard Project Summary

**File**: `07_11_26_Eco2UI.slw.json` (Most Recent Backup - Nov 7, 2026)

## Project Overview

- **Name**: Eco2UI
- **Target**: Arduino (ESP32-C6)
- **Created**: 2026-10-17 01:25
- **LVGL Version**: 9
- **Theme**: Dark mode with custom primary/secondary colors

## Hardware Configuration

### Display
- **Board**: Waveshare C6 Touch LCD 147 (1.47" touchscreen)
- **MCU**: ESP32-C6
- **Display Driver**: JD9853
- **Resolution**: 172x320 pixels (rotated)
- **Color Depth**: 16-bit
- **Interface**: SPI
- **Backlight**: PWM-controlled (GPIO 23, 5kHz, default 100%)

### Touch Input
- **Driver**: AXS5106L
- **Interface**: I2C (GPIO 18/19, 400kHz)
- **I2C Address**: 0x63
- **Orientation**: X inverted, Y normal

### Integrated Hardware
- **IMU**: QMI8658 (accelerometer/gyroscope)
- **SD Card**: microSD card slot via SPI
- **Sensors**:
  - ADS1115 (ADC)
  - SHT31/SHT35 (Temperature/Humidity)
  - QMP6988 (Barometric pressure)
- **Inputs**:
  - Battery level sensor (analog)
  - BOOT button (GPIO)
- **Outputs**:
  - M5Buzzer (GPIO output)

## UI Screens

### 1. Scr_Splash
- Initial splash screen
- Transitions to Scr_Home on event

### 2. Scr_Home (Main Screen)
- **Panel_Dial**: Main display panel with dial/gauge
  - **Lbl_soil**: Soil moisture label
  - **Lbl_tens**: Tension/pressure label
  
- **Panel_kPa_read**: Pressure reading display
  - **Arc_kPa**: Arc gauge visualization
  - **Scale_kPa**: Pressure scale
  - **Label_num_kPa**: Numeric pressure value (with data binding)
  - **Label_kPa**: "kPa" unit label
  - **LED_R**: Red indicator LED

## Data Bindings

- Pressure value linked via binding `bind_hq659zs` to display actual sensor data
- Arc gauge has binding `bind_kj2cbxm` for real-time updates

## Configuration Details

- **Flash Memory**: 8MB
- **PSRAM**: Not used
- **Partition Scheme**: big_app
- **USB CDC**: Enabled (for serial communication)
- **SPI Frequency**: 40MHz
- **Display Pin Map**:
  - SCK: GPIO 1
  - MOSI: GPIO 2
  - CS: GPIO 14
  - DC: GPIO 15
  - RST: GPIO 22

## Features Confirmed Working
- ✅ Color ordering corrected
- ✅ Display invert corrected
- ✅ Timing corrected
- ✅ Controller corrected
- ✅ Touch swap corrected
- ✅ Touch direction corrected

---

**Status**: Active project, recent backup available for modification
**Next Steps**: Ready for project analysis and documentation

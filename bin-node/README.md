# Bin Node - TTGO Firmware Setup Guide

## Hardware Requirements

### Components
- **LilyGO TTGO T-Display ESP32** (1 unit)
  - ESP32-based microcontroller with built-in TFT display
  - WiFi and Bluetooth integrated
  
- **HC-SR04 Ultrasonic Sensor** (1 unit)
  - Range: 2cm - 400cm
  - Accuracy: ±3mm
  
- **Connection Wires**
  - 4x Dupont wires for sensor connection
  
- **USB-C Cable** (for programming)

- **Power Supply** (optional for deployment)
  - USB battery bank, or
  - 3.7V LiPo battery (JST connector compatible)

### Pin Connections

| HC-SR04 Pin | TTGO Pin | Function |
|-------------|----------|----------|
| VCC | 5V | Power |
| GND | GND | Ground |
| TRIG | GPIO 32 | Trigger signal |
| ECHO | GPIO 33 | Echo signal |

## Software Requirements

### Arduino IDE Setup

1. **Install Arduino IDE**
   - Download from: https://www.arduino.cc/en/software
   - Version 1.8.x or 2.x

2. **Add ESP32 Board Support**
   - Open Arduino IDE
   - Go to `File` → `Preferences`
   - Add to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to `Tools` → `Board` → `Boards Manager`
   - Search for "esp32" and install "esp32 by Espressif Systems"

3. **Install Required Libraries**
   
   Go to `Sketch` → `Include Library` → `Manage Libraries` and install:
   
   - **TFT_eSPI** (by Bodmer)
     - Version 2.5.0 or later
     - For driving the TFT display
   
   - **ArduinoJson** (by Benoit Blanchon)
     - Version 6.x
     - For JSON serialization/deserialization
   
   - **WiFi** (included with ESP32 core)
   
   - **HTTPClient** (included with ESP32 core)

### Configure TFT_eSPI Library

The TFT_eSPI library needs to be configured for TTGO T-Display:

1. Locate the library folder:
   - Windows: `Documents/Arduino/libraries/TFT_eSPI/`
   - macOS: `~/Documents/Arduino/libraries/TFT_eSPI/`
   - Linux: `~/Arduino/libraries/TFT_eSPI/`

2. Edit `User_Setup_Select.h`:
   - Comment out default setup: `//#include <User_Setup.h>`
   - Uncomment TTGO setup: `#include <User_Setups/Setup25_TTGO_T_Display.h>`

3. Or manually edit `User_Setup.h` with these settings:
   ```cpp
   #define ST7789_DRIVER
   #define TFT_WIDTH  135
   #define TFT_HEIGHT 240
   #define TFT_MOSI 19
   #define TFT_SCLK 18
   #define TFT_CS   5
   #define TFT_DC   16
   #define TFT_RST  23
   #define TFT_BL   4
   ```

## Configuration

1. **Edit config.h**
   
   Update the following values:
   
   ```cpp
   // WiFi credentials
   #define WIFI_SSID "YourNetworkName"
   #define WIFI_PASSWORD "YourPassword"
   
   // Server address (update after deploying server)
   #define SERVER_URL "http://192.168.1.100:3000"
   
   // Unique bin identifier
   #define BIN_ID "BIN_001"
   
   // Bin physical height in centimeters
   #define BIN_HEIGHT_CM 100
   ```

2. **Adjust Thresholds** (optional)
   ```cpp
   #define WARNING_THRESHOLD 70.0   // Warning at 70%
   #define FULL_THRESHOLD 85.0      // Full alert at 85%
   ```

## Upload Firmware

1. **Connect TTGO Board**
   - Connect TTGO to computer via USB-C cable
   - Board should be recognized automatically

2. **Select Board and Port**
   - Go to `Tools` → `Board` → `ESP32 Arduino`
   - Select: **ESP32 Dev Module** or **TTGO T1**
   - Go to `Tools` → `Port`
   - Select the appropriate COM/Serial port

3. **Upload Settings**
   ```
   Board: ESP32 Dev Module
   Upload Speed: 921600
   CPU Frequency: 240MHz
   Flash Frequency: 80MHz
   Flash Mode: QIO
   Flash Size: 4MB
   Partition Scheme: Default 4MB with spiffs
   ```

4. **Compile and Upload**
   - Click the checkmark icon to verify/compile
   - Click the arrow icon to upload
   - Wait for "Done uploading" message

5. **Monitor Serial Output**
   - Go to `Tools` → `Serial Monitor`
   - Set baud rate to: **115200**
   - You should see initialization messages

## Testing

### Basic Function Test

1. **Power on TTGO**
   - Display should show "Smart Bin" splash screen
   - WiFi connection status will appear

2. **Sensor Test**
   - Place hand above sensor (within 10-100cm)
   - Display should show distance and fill percentage
   - Values should update in real-time

3. **WiFi Test**
   - Check serial monitor for "WiFi connected!" message
   - IP address should be displayed
   - Signal strength (RSSI) should appear on screen

4. **Server Communication Test**
   - After 5 minutes, check serial monitor for "Sending Status Update"
   - Response code 200 indicates successful communication
   - Check server logs for received data

### Troubleshooting

**Display not working:**
- Verify TFT_eSPI library is properly configured
- Check board selection (must be ESP32)
- Try example sketch: File → Examples → TFT_eSPI → 160x128 → TFT_Print_Test

**Sensor readings incorrect:**
- Verify pin connections (TRIG=32, ECHO=33)
- Check sensor is receiving 5V power
- Ensure no obstacles near sensor
- Adjust BIN_HEIGHT_CM in config.h

**WiFi not connecting:**
- Verify SSID and password are correct
- Check 2.4GHz network (ESP32 doesn't support 5GHz)
- Move closer to router
- Check router MAC filtering

**Server connection failed:**
- Verify SERVER_URL is correct
- Ensure server is running and accessible
- Check firewall settings
- Ping server IP from same network

**Upload failed:**
- Hold BOOT button while clicking upload
- Try different USB cable
- Reduce upload speed to 115200
- Install USB driver: https://www.silabs.com/products/development-tools/software/usb-to-uart-bridge-vcp-drivers

## Deployment

### Physical Installation

1. **Mount sensor inside bin**
   - Position at top center of bin
   - Ensure clear line of sight to waste surface
   - Angle slightly downward (5-10 degrees)

2. **Secure TTGO board**
   - Use waterproof enclosure if outdoors
   - Ensure display is visible
   - Keep accessible for maintenance

3. **Power supply**
   - USB battery bank for portable deployment
   - LiPo battery for longer runtime
   - Wall adapter for permanent installation

4. **Cable management**
   - Use cable ties to secure wires
   - Protect connections from moisture
   - Leave slack for bin lid movement

### Calibration

1. **Empty bin calibration**
   - Place sensor in empty bin
   - Note distance reading
   - Update BIN_HEIGHT_CM if needed

2. **Full bin test**
   - Fill bin to desired "full" level
   - Check fill percentage
   - Adjust FULL_THRESHOLD if needed

3. **Multiple readings**
   - Test with various fill levels (25%, 50%, 75%)
   - Verify percentage calculations
   - Fine-tune thresholds as needed

## Maintenance

- **Weekly:** Check battery level and WiFi connection
- **Monthly:** Clean sensor surface (dust can affect readings)
- **Quarterly:** Verify calibration and update firmware if needed

## LED Status Indicators

- **Solid OFF:** Normal operation (<70% full)
- **Blinking:** Warning level (70-85% full)
- **Solid ON:** Full alert (>85% full)

## Serial Monitor Commands

You can interact with the bin node via serial monitor:

- Device status information displayed every update cycle
- Error messages for debugging
- WiFi connection status
- Sensor readings and calculations

## OTA Updates (Future Enhancement)

Over-the-air firmware updates can be implemented using ESP32 OTA library for remote updates without physical access to the device.

## Support

For issues or questions:
- Check serial monitor output for error messages
- Review server logs for communication issues
- Verify hardware connections
- Consult Arduino ESP32 documentation

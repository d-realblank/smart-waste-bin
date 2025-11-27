# Bin Node - T3 LoRa32 V1.6.1 Firmware Setup Guide

## Hardware Requirements

### Components
- **LilyGO T3 LoRa32 V1.6.1** (1 unit)
  - ESP32-based microcontroller with built-in OLED display (128x64 SSD1306)
  - WiFi, Bluetooth, and LoRa (915MHz) integrated
  - Frequency: 915MHz (North America version)
  
- **HC-SR04 Ultrasonic Sensor** (1 unit)
  - Range: 2cm - 400cm
  - Accuracy: ±3mm
  
- **Connection Wires**
  - 4x Dupont wires for sensor connection
  
- **Micro-USB Cable** (for programming)

- **Power Supply** (optional for deployment)
  - USB battery bank, or
  - 3.7V LiPo battery (JST 1.25mm connector)

### Pin Connections

| HC-SR04 Pin | T3 LoRa32 Pin | GPIO | Function |
|-------------|---------------|------|----------|
| VCC | 3.3V | - | Power (3.3V) |
| GND | GND | - | Ground |
| TRIG | GPIO 13 | 13 | Trigger signal |
| ECHO | GPIO 15 | 15 | Echo signal |

**Note:** The T3 LoRa32 V1.6.1 uses 3.3V logic. The HC-SR04 typically needs 5V power but can work with 3.3V for the trigger/echo signals.

### Built-in Components

- **OLED Display:** SSD1306 128x64 I2C (SDA=GPIO21, SCL=GPIO22, RST=None/Internal)
- **Blue LED:** GPIO 25
- **LoRa Module:** SX1276 (915MHz) - not used in this version but available for future enhancements
- **Battery Monitor:** GPIO 35 (ADC)

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
   
   - **U8g2** (by oliver)
     - For driving the OLED display
     - More robust for ESP32 LoRa boards
   
   - **ArduinoJson** (by Benoit Blanchon)
     - Version 6.x
     - For JSON serialization/deserialization
   
   - **WiFi** (included with ESP32 core)
   
   - **HTTPClient** (included with ESP32 core)
   
   - **Wire** (included with ESP32 core)
     - For I2C communication with OLED

### Configure Display Library

The T3 LoRa32 V1.6.1 uses an SSD1306 OLED display. We use the **U8g2** library which is more robust for this board:

1. **Install U8g2 Library**
   - Go to `Sketch` → `Include Library` → `Manage Libraries`
   - Search for "U8g2"
   - Install "U8g2" by oliver

2. **Library Configuration**
   - The code is pre-configured for T3 LoRa32 V1.6.1
   - Uses hardware I2C (SDA=21, SCL=22)
   - Constructor: `U8G2_SSD1306_128X64_NONAME_F_HW_I2C`

**Note:** The previous Adafruit SSD1306 library was causing initialization loops on some boards. U8g2 handles the reset sequence more reliably.

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
   - Select: **ESP32 Dev Module**
   - Go to `Tools` → `Port`
   - Select the appropriate COM/Serial port (may appear as CP210x or similar)

3. **Upload Settings for T3 LoRa32 V1.6.1**
   ```
   Board: ESP32 Dev Module
   Upload Speed: 921600 (or 115200 if upload fails)
   CPU Frequency: 240MHz
   Flash Frequency: 80MHz
   Flash Mode: QIO
   Flash Size: 4MB (32Mb)
   Partition Scheme: Default 4MB with spiffs
   Core Debug Level: None
   PSRAM: Disabled
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

**OLED Display not working:**
- Verify U8g2 library is installed
- Check board selection (must be ESP32)
- Check I2C connections (SDA=21, SCL=22)
- Try running I2C scanner to verify address (should be 0x3C)
- Try example sketch: File → Examples → U8g2 → full_buffer → GraphicsTest

**Sensor readings incorrect:**
- Verify pin connections (TRIG=GPIO13, ECHO=GPIO15)
- Check sensor is receiving 3.3V power (HC-SR04 can work with 3.3V but 5V is better)
- If readings are unstable, consider using a 5V HC-SR04 with a voltage divider on ECHO pin
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

// ============================================================================
// Configuration File for Smart Waste Bin System
// ============================================================================
// Board: LilyGO T3 LoRa32 V1.6.1 (915MHz)
// IMPORTANT: Update these values before uploading to your board
// ============================================================================

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// Network Configuration
// ============================================================================
#define WIFI_SSID "Shnole"           // Replace with your WiFi SSID
#define WIFI_PASSWORD "D@i3llz3c@b"   // Replace with your WiFi password

// ============================================================================
// Server Configuration
// ============================================================================
// IMPORTANT: Replace with your actual computer IP address
// Example: "http://192.168.1.15:3000"
// Do NOT use "localhost" - that refers to the ESP32 itself!
#define SERVER_URL "http://192.168.0.116:3000"  
#define API_KEY "test-api-key-for-bins"              // API key for authentication

// ============================================================================
// Bin Configuration
// ============================================================================
#define BIN_ID "BIN_001"                     // Unique identifier for this bin
#define BIN_LOCATION "Hall Building, RC"  // Physical location
#define BIN_HEIGHT_CM 100                    // Total bin height in centimeters

// ============================================================================
// Sensor Thresholds
// ============================================================================
#define WARNING_THRESHOLD 70.0   // Fill level % to trigger warning (yellow)
#define FULL_THRESHOLD 85.0      // Fill level % to trigger full alert (red)

// ============================================================================
// Timing Configuration (milliseconds)
// ============================================================================
#define REPORT_INTERVAL 30000            // Status update interval (30 seconds)
#define DISPLAY_UPDATE_INTERVAL 2000     // Display refresh rate (2 seconds)
#define SENSOR_READ_INTERVAL 1000        // Sensor reading interval (1 second)

// ============================================================================
// Power Management
// ============================================================================
#define ENABLE_DEEP_SLEEP true          // Enable deep sleep for battery saving
#define SLEEP_DURATION_SEC 300          // Sleep duration in seconds (5 minutes)
#define LOW_BATTERY_THRESHOLD 20        // Battery % to trigger low battery mode

// ============================================================================
// Bluetooth Mesh (Simple Gateway Mode)
// ============================================================================
#define ENABLE_BLE_MESH true            // Enable Bluetooth mesh networking
#define BLE_MESH_NAME "SmartBin_Mesh"   // Mesh network name
#define BLE_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b" // Unique Service UUID
#define BLE_CONFIG_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914c" // Config Service
#define BLE_CONFIG_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"    // Config Characteristic
#define BLE_SCAN_TIME 5                 // Scan time in seconds
#define BLE_ADVERTISE_INTERVAL 2000     // Advertise interval in ms

// ============================================================================
// Debug Configuration
// ============================================================================
#define DEBUG_MODE true                 // Enable serial debug output
#define DEBUG_SENSOR false              // Enable detailed sensor debug info

// ============================================================================
// Display Configuration (OLED SSD1306)
// ============================================================================
#define ENABLE_SCREENSAVER false        // Screen burn-in protection (not needed for OLED)
#define SCREENSAVER_TIMEOUT 60000       // Timeout before turning off display (60 seconds)

// ============================================================================
// Hardware Pin Definitions - T3 LoRa32 V1.6.1
// ============================================================================
// These pins are set in the main .ino file:
// TRIG_PIN 13          - Ultrasonic trigger pin
// ECHO_PIN 15          - Ultrasonic echo pin  
// LED_PIN 25           - Built-in blue LED
// OLED_SDA 21          - I2C Data for OLED
// OLED_SCL 22          - I2C Clock for OLED
// OLED_RST -           - OLED Reset (Not used/Internal)
// BATTERY_PIN 35       - Battery voltage monitoring (ADC)

#endif // CONFIG_H

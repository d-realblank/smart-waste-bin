// ============================================================================
// Configuration File for Smart Waste Bin System
// ============================================================================
// IMPORTANT: Update these values before uploading to your TTGO board
// ============================================================================

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// Network Configuration
// ============================================================================
#define WIFI_SSID "YOUR_WIFI_SSID"           // Replace with your WiFi SSID
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"   // Replace with your WiFi password

// ============================================================================
// Server Configuration
// ============================================================================
#define SERVER_URL "http://192.168.1.100:3000"  // Replace with your server IP/domain
#define API_KEY "your-api-key-here"              // API key for authentication

// ============================================================================
// Bin Configuration
// ============================================================================
#define BIN_ID "BIN_001"                     // Unique identifier for this bin
#define BIN_LOCATION "Engineering Building"  // Physical location
#define BIN_HEIGHT_CM 100                    // Total bin height in centimeters

// ============================================================================
// Sensor Thresholds
// ============================================================================
#define WARNING_THRESHOLD 70.0   // Fill level % to trigger warning (yellow)
#define FULL_THRESHOLD 85.0      // Fill level % to trigger full alert (red)

// ============================================================================
// Timing Configuration (milliseconds)
// ============================================================================
#define REPORT_INTERVAL 300000           // Status update interval (5 minutes)
#define DISPLAY_UPDATE_INTERVAL 2000     // Display refresh rate (2 seconds)
#define SENSOR_READ_INTERVAL 1000        // Sensor reading interval (1 second)

// ============================================================================
// Power Management
// ============================================================================
#define ENABLE_DEEP_SLEEP true          // Enable deep sleep for battery saving
#define SLEEP_DURATION_SEC 300          // Sleep duration in seconds (5 minutes)
#define LOW_BATTERY_THRESHOLD 20        // Battery % to trigger low battery mode

// ============================================================================
// Bluetooth Mesh (for future implementation)
// ============================================================================
#define ENABLE_BLE_MESH false           // Enable Bluetooth mesh networking
#define BLE_MESH_NAME "SmartBin_Mesh"   // Mesh network name

// ============================================================================
// Debug Configuration
// ============================================================================
#define DEBUG_MODE true                 // Enable serial debug output
#define DEBUG_SENSOR false              // Enable detailed sensor debug info

// ============================================================================
// Display Configuration
// ============================================================================
#define DISPLAY_BRIGHTNESS 128          // TFT brightness (0-255)
#define ENABLE_SCREENSAVER true         // Dim display after inactivity
#define SCREENSAVER_TIMEOUT 60000       // Timeout before dimming (60 seconds)

// ============================================================================
// Hardware Pin Definitions (if different from defaults)
// ============================================================================
// #define TRIG_PIN 32                  // Ultrasonic trigger pin
// #define ECHO_PIN 33                  // Ultrasonic echo pin
// #define LED_PIN 2                    // Status LED pin

#endif // CONFIG_H

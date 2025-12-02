// ============================================================================
// Configuration File for BLE-Only Bin Node
// ============================================================================
// Board: LilyGO T4 LoRa32 V1.6.1 (915MHz)
// ============================================================================

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// Bin Configuration
// ============================================================================
#define BIN_ID "BIN_003"                     // Unique identifier for this bin
#define BIN_LOCATION "Remote Location"       // Physical location
#define BIN_HEIGHT_CM 101                    // Total bin height in centimeters

// ============================================================================
// Sensor Thresholds
// ============================================================================
#define WARNING_THRESHOLD 71.0   // Fill level % to trigger warning (yellow)
#define FULL_THRESHOLD 86.0      // Fill level % to trigger full alert (red)

// ============================================================================
// Timing Configuration (milliseconds)
// ============================================================================
#define DISPLAY_UPDATE_INTERVAL 2001     // Display refresh rate (2 seconds)
#define SENSOR_READ_INTERVAL 1001        // Sensor reading interval (1 second)
#define BLE_ADVERTISE_INTERVAL 2001      // Update BLE payload interval

// ============================================================================
// Bluetooth Configuration
// ============================================================================
#define BLE_DEVICE_NAME "SmartBin_Node"

// ============================================================================
// Hardware Pin Definitions - T3 LoRa32 V1.6.1 (Standard)
// ============================================================================
#define TRIG_PIN 13          // Ultrasonic sensor trigger pin
#define ECHO_PIN 15          // Ultrasonic sensor echo pin
#define LED_PIN 25           // Built-in blue LED (Usually 25 on T3, 22 on some T4s)
#define OLED_SDA 21          // I2C Data (Standard ESP32 I2C)
#define OLED_SCL 22          // I2C Clock (Standard ESP32 I2C)
#define BATTERY_PIN 35       // ADC pin for battery voltage (35 on T3)

#endif // CONFIG_H

// ============================================================================
// Smart Waste Bin System - TTGO Bin Node Firmware
// ============================================================================
// Description: Main firmware for LilyGO T3 LoRa32 V1.6.1 OLED waste bin monitoring
// Hardware: ESP32, HC-SR04 Ultrasonic Sensor, Built-in OLED Display (128x64)
// Board: TTGO T3 LoRa32 V1.6.1 (915MHz)
// Features: WiFi communication, LoRa capability, Real-time fill level detection
// ============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <U8g2lib.h>
#include <ArduinoJson.h>
#include <esp_sleep.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include "config.h"

// ============================================================================
// Hardware Pin Definitions - T3 LoRa32 V1.6.1
// ============================================================================
// Ultrasonic Sensor Pins (using available GPIOs)
#define TRIG_PIN 13          // Ultrasonic sensor trigger pin
#define ECHO_PIN 15          // Ultrasonic sensor echo pin

// Status LED (built-in LED on T3 LoRa32)
#define LED_PIN 25           // Built-in blue LED on T3 LoRa32 V1.6.1

// OLED Display Pins (SSD1306 128x64) - I2C
#define OLED_SDA 21          // I2C Data
#define OLED_SCL 22          // I2C Clock
// #define OLED_RST 16       // OLED Reset - Not used on this board version

// LoRa Module Pins (for reference - not used in this version)
// #define LORA_SCK 5
// #define LORA_MISO 19
// #define LORA_MOSI 27
// #define LORA_CS 18
// #define LORA_RST 23
// #define LORA_DIO0 26

// Battery ADC Pin
#define BATTERY_PIN 35       // ADC pin for battery voltage

#define BIN_HEIGHT_CM 100    // Total bin height in centimeters

// ============================================================================
// OLED Display Configuration
// ============================================================================
// U8g2 Constructor for ESP32 HW I2C
// Rotation R0, Reset Pin NONE (avoid conflict), Clock 22, Data 21
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE, OLED_SCL, OLED_SDA);

// ============================================================================
// Global Objects
// ============================================================================
HTTPClient http;
WiFiClient wifiClient;

bool displayAvailable = false;  // Track if display initialized successfully

// ============================================================================
// BLE Globals
// ============================================================================
BLEScan* pBLEScan;
unsigned long lastBLEScanTime = 0;
bool deviceConnected = false;



// ============================================================================
// System State Variables
// ============================================================================
struct BinState {
    String binId;
    float fillLevel;         // Percentage (0-100)
    float distance;          // Distance to waste surface in cm
    bool isFull;             // Alert flag
    unsigned long lastUpdate;
    int batteryLevel;
    String status;           // "NORMAL", "WARNING", "FULL", "ERROR"
};

BinState currentState;
unsigned long lastReportTime = 0;
unsigned long lastDisplayUpdate = 0;
int reconnectAttempts = 0;

// ============================================================================
// Function Prototypes
// ============================================================================
void setupWiFi();
void setupDisplay();
void setupSensor();
float measureDistance();
float calculateFillLevel(float distance);
void updateDisplay();
void sendStatusUpdate();
void sendAlert();
void enterDeepSleep();
void handleServerResponse(String response);
int getBatteryLevel();

// BLE Functions
void setupBLE();
void scanForNeighbors();
void sendNeighborUpdate(String binId, float fillLevel, int batteryLevel, String location);



// ============================================================================
// Setup Function
// ============================================================================
void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n\n=================================");
    Serial.println("Smart Waste Bin System - Starting");
    Serial.println("=================================\n");
    
    // Initialize hardware
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    
    // Initialize bin state
    currentState.binId = BIN_ID;
    currentState.fillLevel = 0;
    currentState.distance = 0;
    currentState.isFull = false;
    currentState.lastUpdate = 0;
    currentState.batteryLevel = 100;
    currentState.status = "INITIALIZING";
    
    // Setup components
    setupDisplay();
    setupWiFi();
    setupSensor();
    
    if (ENABLE_BLE_MESH) {
        setupBLE();
    }
    
    currentState.status = "NORMAL";
    Serial.println("\nSetup complete - System ready\n");
}

// ============================================================================
// Main Loop
// ============================================================================
void loop() {
    unsigned long currentTime = millis();
    
    // Measure bin fill level
    float distance = measureDistance();
    currentState.distance = distance;
    currentState.fillLevel = calculateFillLevel(distance);
    currentState.batteryLevel = getBatteryLevel();
    
    // Update status based on fill level
    if (currentState.fillLevel >= FULL_THRESHOLD) {
        currentState.status = "FULL";
        currentState.isFull = true;
        digitalWrite(LED_PIN, HIGH);
    } else if (currentState.fillLevel >= WARNING_THRESHOLD) {
        currentState.status = "WARNING";
        currentState.isFull = false;
        // Blink LED
        digitalWrite(LED_PIN, (currentTime / 500) % 2);
    } else {
        currentState.status = "NORMAL";
        currentState.isFull = false;
        digitalWrite(LED_PIN, LOW);
    }
    
    // Update display periodically
    if (currentTime - lastDisplayUpdate >= DISPLAY_UPDATE_INTERVAL) {
        updateDisplay();
        lastDisplayUpdate = currentTime;
    }
    
    // Send status update to server
    if (currentTime - lastReportTime >= REPORT_INTERVAL) {
        sendStatusUpdate();
        lastReportTime = currentTime;
    }
    
    // Send immediate alert if bin is full
    if (currentState.isFull && (currentTime - lastReportTime >= 5000)) {
        sendAlert();
        lastReportTime = currentTime;
    }
    
    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected - Attempting reconnect...");
        setupWiFi();
    }
    
    // BLE Mesh / Gateway Logic
    if (ENABLE_BLE_MESH) {
        // If connected to WiFi, act as a Gateway: Scan for neighbors
        if (WiFi.status() == WL_CONNECTED) {
            if (currentTime - lastBLEScanTime >= 15000) { // Scan every 15 seconds
                scanForNeighbors();
                lastBLEScanTime = currentTime;
            }
        }
    }

    
    delay(1000); // Main loop delay
}

// ============================================================================
// WiFi Setup
// ============================================================================
void setupWiFi() {
    Serial.print("Connecting to WiFi: ");
    Serial.println(WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
        Serial.print("Signal Strength: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
        reconnectAttempts = 0;
    } else {
        Serial.println("\nWiFi connection failed!");
        reconnectAttempts++;
        
        // Enter deep sleep if multiple reconnect failures
        if (reconnectAttempts >= 3) {
            Serial.println("Multiple WiFi failures - entering sleep mode");
            enterDeepSleep();
        }
    }
}

// ============================================================================
// Display Setup
// ============================================================================
void setupDisplay() {
    Serial.println("Initializing OLED display (U8g2)...");
    displayAvailable = false;
    
    // U8g2 handles reset and I2C init automatically
    // It is more robust for ESP32 LoRa boards
    u8g2.begin();
    displayAvailable = true;
    
    Serial.println("Display initialized!");
    
    // Clear buffer
    u8g2.clearBuffer();
    
    // Splash screen
    u8g2.setFont(u8g2_font_ncenB10_tr); // Bold font
    u8g2.drawStr(10, 20, "Smart Bin");
    
    u8g2.setFont(u8g2_font_6x10_tf); // Small font
    u8g2.drawStr(10, 40, "Initializing...");
    
    u8g2.sendBuffer();
    delay(2000);
    Serial.println("OLED display initialized successfully!");
}

// ============================================================================
// Sensor Setup
// ============================================================================
void setupSensor() {
    Serial.println("Initializing ultrasonic sensor...");
    
    // Test measurement
    float testDistance = measureDistance();
    Serial.print("Test measurement: ");
    Serial.print(testDistance);
    Serial.println(" cm");
    
    if (testDistance > 0 && testDistance < 400) {
        Serial.println("Sensor initialized successfully");
    } else {
        Serial.println("Warning: Sensor reading out of range");
    }
}

// ============================================================================
// Measure Distance using HC-SR04
// ============================================================================
float measureDistance() {
    // Take multiple measurements for accuracy
    float totalDistance = 0;
    int validReadings = 0;
    
    for (int i = 0; i < 3; i++) {
        // Send trigger pulse
        digitalWrite(TRIG_PIN, LOW);
        delayMicroseconds(2);
        digitalWrite(TRIG_PIN, HIGH);
        delayMicroseconds(10);
        digitalWrite(TRIG_PIN, LOW);
        
        // Measure echo pulse
        long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
        
        if (duration > 0) {
            float distance = duration * 0.034 / 2; // Convert to cm
            
            // Validate reading
            if (distance > 2 && distance < 400) {
                totalDistance += distance;
                validReadings++;
            }
        }
        
        delay(50); // Short delay between readings
    }
    
    if (validReadings > 0) {
        return totalDistance / validReadings;
    } else {
        Serial.println("Error: No valid sensor readings");
        return -1;
    }
}

// ============================================================================
// Calculate Fill Level Percentage
// ============================================================================
float calculateFillLevel(float distance) {
    if (distance < 0) {
        return -1; // Error state
    }
    
    // Calculate fill level
    // Bin is full when distance is small, empty when distance is large
    float emptyDistance = BIN_HEIGHT_CM;
    float fullDistance = 5; // Minimum distance when full (5cm from sensor)
    
    if (distance >= emptyDistance) {
        return 0; // Empty
    } else if (distance <= fullDistance) {
        return 100; // Full
    } else {
        // Linear interpolation
        float fillLevel = ((emptyDistance - distance) / (emptyDistance - fullDistance)) * 100;
        return constrain(fillLevel, 0, 100);
    }
}

// ============================================================================
// Update OLED Display
// ============================================================================
void updateDisplay() {
    u8g2.clearBuffer();
    
    // Display bin ID (top line)
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.setCursor(0, 10);
    u8g2.print("Bin: ");
    u8g2.print(currentState.binId);
    
    // Display fill level (large, centered)
    u8g2.setFont(u8g2_font_ncenB14_tr);
    u8g2.setCursor(15, 35);
    
    if (currentState.fillLevel >= 0) {
        u8g2.print(currentState.fillLevel, 1);
        u8g2.print("%");
    } else {
        u8g2.print("ERROR");
    }
    
    // Display status indicator
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.setCursor(0, 50);
    if (currentState.fillLevel >= FULL_THRESHOLD) {
        u8g2.print("[FULL]");
    } else if (currentState.fillLevel >= WARNING_THRESHOLD) {
        u8g2.print("[WARN]");
    } else {
        u8g2.print("[OK]");
    }
    u8g2.print(" ");
    u8g2.print(currentState.distance, 0);
    u8g2.print("cm");
    
    // Display WiFi status
    u8g2.setCursor(0, 62);
    if (WiFi.status() == WL_CONNECTED) {
        u8g2.print("WiFi:");
        u8g2.print(WiFi.RSSI());
        u8g2.print("dBm");
    } else {
        u8g2.print("WiFi:OFF");
    }
    
    // Display battery level
    u8g2.setCursor(80, 10);
    u8g2.print("Bat:");
    u8g2.print(currentState.batteryLevel);
    u8g2.print("%");
    
    // Update the display
    u8g2.sendBuffer();
}

// ============================================================================
// Send Status Update to Server
// ============================================================================
void sendStatusUpdate() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Cannot send update - WiFi not connected");
        return;
    }
    
    Serial.println("\n--- Sending Status Update ---");
    
    // Create JSON payload
    StaticJsonDocument<512> doc;
    doc["binId"] = currentState.binId;
    doc["fillLevel"] = currentState.fillLevel;
    doc["distance"] = currentState.distance;
    doc["status"] = currentState.status;
    doc["isFull"] = currentState.isFull;
    doc["batteryLevel"] = currentState.batteryLevel;
    doc["timestamp"] = millis();
    doc["rssi"] = WiFi.RSSI();
    doc["location"] = BIN_LOCATION;
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    Serial.println("Payload: " + jsonPayload);
    
    // Send HTTP POST request
    String url = String(SERVER_URL) + "/api/bins/status";
    http.begin(wifiClient, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", API_KEY);
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
        Serial.print("Server response code: ");
        Serial.println(httpResponseCode);
        
        String response = http.getString();
        Serial.println("Response: " + response);
        
        if (httpResponseCode == 200) {
            handleServerResponse(response);
        }
    } else {
        Serial.print("Error sending update: ");
        Serial.println(http.errorToString(httpResponseCode));
    }
    
    http.end();
    Serial.println("--- Update Complete ---\n");
}

// ============================================================================
// Send Alert to Server
// ============================================================================
void sendAlert() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Cannot send alert - WiFi not connected");
        return;
    }
    
    Serial.println("\n!!! SENDING ALERT !!!");
    
    // Create JSON payload
    StaticJsonDocument<512> doc;
    doc["binId"] = currentState.binId;
    doc["alertType"] = "BIN_FULL";
    doc["fillLevel"] = currentState.fillLevel;
    doc["message"] = "Bin has reached full capacity";
    doc["priority"] = "HIGH";
    doc["timestamp"] = millis();
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    // Send HTTP POST request
    String url = String(SERVER_URL) + "/api/bins/alert";
    http.begin(wifiClient, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", API_KEY);
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
        Serial.print("Alert response code: ");
        Serial.println(httpResponseCode);
        Serial.println("Response: " + http.getString());
    } else {
        Serial.print("Error sending alert: ");
        Serial.println(http.errorToString(httpResponseCode));
    }
    
    http.end();
    Serial.println("!!! ALERT SENT !!!\n");
}

// ============================================================================
// Handle Server Response
// ============================================================================
void handleServerResponse(String response) {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (error) {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
        return;
    }
    
    // Check for configuration updates
    if (doc.containsKey("config")) {
        JsonObject config = doc["config"];
        
        if (config.containsKey("reportInterval")) {
            // Could update REPORT_INTERVAL dynamically
            Serial.print("New report interval: ");
            Serial.println(config["reportInterval"].as<int>());
        }
    }
    
    // Check for commands
    if (doc.containsKey("command")) {
        String command = doc["command"];
        Serial.print("Received command: ");
        Serial.println(command);
        
        if (command == "RESET") {
            ESP.restart();
        } else if (command == "SLEEP") {
            enterDeepSleep();
        }
    }
}

// ============================================================================
// Get Battery Level (simulated for now)
// ============================================================================
int getBatteryLevel() {
    // TODO: Implement actual battery voltage reading using ADC
    // For now, return simulated value
    // On ESP32, can use analogRead on battery voltage divider
    
    // Placeholder: slowly decrease from 100%
    static int batteryLevel = 100;
    
    if (millis() % 300000 == 0 && batteryLevel > 0) { // Decrease every 5 min
        batteryLevel--;
    }
    
    return batteryLevel;
}

// ============================================================================
// Enter Deep Sleep Mode
// ============================================================================
void enterDeepSleep() {
    Serial.println("Entering deep sleep mode...");
    
    // Display sleep message
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_ncenB10_tr);
    u8g2.drawStr(10, 30, "SLEEPING");
    u8g2.sendBuffer();
    
    delay(2000);
    
    // Configure wake up after 5 minutes
    esp_sleep_enable_timer_wakeup(300 * 1000000); // 300 seconds
    
    // Enter deep sleep
    esp_deep_sleep_start();
}

// ============================================================================
// BLE Mesh / Gateway Implementation
// ============================================================================

void setupBLE() {
    Serial.println("Initializing BLE Gateway...");
    
    BLEDevice::init(BLE_MESH_NAME);
    
    // Setup Scanning
    pBLEScan = BLEDevice::getScan();
    // pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks()); // Removed callback
    pBLEScan->setActiveScan(true); // Active scan uses more power, but gets results faster
    pBLEScan->setInterval(100);
    pBLEScan->setWindow(99);  // less or equal setInterval value
    
    Serial.println("BLE Gateway Initialized");
}

void scanForNeighbors() {
    Serial.println("BLE MESH: Scanning for neighbors...");
    BLEScanResults* foundDevices = pBLEScan->start(BLE_SCAN_TIME, false);
    Serial.print("BLE MESH: Scan done! Devices found: ");
    int count = foundDevices->getCount();
    Serial.println(count);
    
    for (int i = 0; i < count; i++) {
        BLEAdvertisedDevice device = foundDevices->getDevice(i);
        
        if (device.haveManufacturerData()) {
            String dataStr = device.getManufacturerData();
            
            // Check if it's one of our bins (Prefix "BIN:")
            if (dataStr.indexOf("BIN:") >= 0) {
                Serial.print("BLE MESH: Found Neighbor Bin: ");
                Serial.println(device.getAddress().toString().c_str());
                Serial.println("Data: " + dataStr);
                
                // Parse Data
                // Format: "BIN:BIN_002:45.5:98"
                int firstColon = dataStr.indexOf(':');
                int secondColon = dataStr.indexOf(':', firstColon + 1);
                int thirdColon = dataStr.indexOf(':', secondColon + 1);
                
                if (firstColon > 0 && secondColon > 0 && thirdColon > 0) {
                    String binId = dataStr.substring(firstColon + 1, secondColon);
                    String fillStr = dataStr.substring(secondColon + 1, thirdColon);
                    String batStr = dataStr.substring(thirdColon + 1);
                    
                    float fillLevel = fillStr.toFloat();
                    int batteryLevel = batStr.toInt();
                    
                    // If we are connected to WiFi, relay this data (Gateway Mode)
                    if (WiFi.status() == WL_CONNECTED) {
                        String location = "Unknown";
                        if (device.haveName()) {
                            location = device.getName().c_str();
                        }
                        sendNeighborUpdate(binId, fillLevel, batteryLevel, location);
                    }
                }
            }
        }
    }
    
    // Clean up RAM
    pBLEScan->clearResults();
}

void sendNeighborUpdate(String binId, float fillLevel, int batteryLevel, String location) {
    Serial.println("BLE MESH: Relaying data for " + binId);
    
    // Create JSON payload
    StaticJsonDocument<512> doc;
    doc["binId"] = binId;
    doc["fillLevel"] = fillLevel;
    doc["batteryLevel"] = batteryLevel;
    doc["status"] = (fillLevel >= FULL_THRESHOLD) ? "FULL" : (fillLevel >= WARNING_THRESHOLD ? "WARNING" : "NORMAL");
    doc["isFull"] = (fillLevel >= FULL_THRESHOLD);
    doc["timestamp"] = millis();
    doc["relayedBy"] = BIN_ID; // Mark as relayed
    
    // Add location if available
    if (location != "Unknown" && location.length() > 0) {
        doc["location"] = location;
    }
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    // Send HTTP POST request
    String url = String(SERVER_URL) + "/api/bins/status";
    HTTPClient relayHttp;
    relayHttp.begin(wifiClient, url);
    relayHttp.addHeader("Content-Type", "application/json");
    relayHttp.addHeader("X-API-Key", API_KEY);
    
    int httpResponseCode = relayHttp.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
        Serial.println("BLE MESH: Relay successful for " + binId);
    } else {
        Serial.print("BLE MESH: Relay failed: ");
        Serial.println(relayHttp.errorToString(httpResponseCode));
    }
    
    relayHttp.end();
}

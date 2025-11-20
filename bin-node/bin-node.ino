// ============================================================================
// Smart Waste Bin System - TTGO Bin Node Firmware
// ============================================================================
// Description: Main firmware for LilyGO TTGO T-Display waste bin monitoring
// Hardware: ESP32, HC-SR04 Ultrasonic Sensor, Built-in TFT Display
// Features: WiFi communication, Bluetooth Mesh, Real-time fill level detection
// ============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <TFT_eSPI.h>
#include <ArduinoJson.h>
#include <esp_sleep.h>
#include "config.h"

// ============================================================================
// Hardware Pin Definitions
// ============================================================================
#define TRIG_PIN 32          // Ultrasonic sensor trigger pin
#define ECHO_PIN 33          // Ultrasonic sensor echo pin
#define LED_PIN 2            // Status LED
#define BIN_HEIGHT_CM 100    // Total bin height in centimeters

// ============================================================================
// Global Objects
// ============================================================================
TFT_eSPI tft = TFT_eSPI();   // Display object
HTTPClient http;
WiFiClient wifiClient;

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
    Serial.println("Initializing display...");
    
    tft.init();
    tft.setRotation(1);
    tft.fillScreen(TFT_BLACK);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.setTextSize(2);
    
    // Splash screen
    tft.setCursor(10, 40);
    tft.println("Smart Bin");
    tft.setCursor(10, 70);
    tft.setTextSize(1);
    tft.println("Initializing...");
    
    delay(2000);
    Serial.println("Display initialized");
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
// Update TFT Display
// ============================================================================
void updateDisplay() {
    tft.fillScreen(TFT_BLACK);
    
    // Display bin ID
    tft.setTextSize(1);
    tft.setTextColor(TFT_CYAN, TFT_BLACK);
    tft.setCursor(5, 5);
    tft.print("Bin: ");
    tft.println(currentState.binId);
    
    // Display fill level with color coding
    tft.setTextSize(3);
    tft.setCursor(20, 30);
    
    if (currentState.fillLevel >= FULL_THRESHOLD) {
        tft.setTextColor(TFT_RED, TFT_BLACK);
    } else if (currentState.fillLevel >= WARNING_THRESHOLD) {
        tft.setTextColor(TFT_YELLOW, TFT_BLACK);
    } else {
        tft.setTextColor(TFT_GREEN, TFT_BLACK);
    }
    
    if (currentState.fillLevel >= 0) {
        tft.print(currentState.fillLevel, 1);
        tft.println("%");
    } else {
        tft.println("ERROR");
    }
    
    // Display status
    tft.setTextSize(1);
    tft.setCursor(5, 70);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.print("Status: ");
    tft.println(currentState.status);
    
    // Display distance
    tft.setCursor(5, 85);
    tft.print("Distance: ");
    tft.print(currentState.distance, 1);
    tft.println(" cm");
    
    // Display WiFi status
    tft.setCursor(5, 100);
    if (WiFi.status() == WL_CONNECTED) {
        tft.setTextColor(TFT_GREEN, TFT_BLACK);
        tft.print("WiFi: ");
        tft.print(WiFi.RSSI());
        tft.println(" dBm");
    } else {
        tft.setTextColor(TFT_RED, TFT_BLACK);
        tft.println("WiFi: Disconnected");
    }
    
    // Display battery level
    tft.setCursor(5, 115);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.print("Battery: ");
    tft.print(currentState.batteryLevel);
    tft.println("%");
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
    tft.fillScreen(TFT_BLACK);
    tft.setTextSize(2);
    tft.setTextColor(TFT_YELLOW, TFT_BLACK);
    tft.setCursor(20, 60);
    tft.println("SLEEPING...");
    
    delay(2000);
    
    // Configure wake up after 5 minutes
    esp_sleep_enable_timer_wakeup(300 * 1000000); // 300 seconds
    
    // Enter deep sleep
    esp_deep_sleep_start();
}

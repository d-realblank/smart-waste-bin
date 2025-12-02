// ============================================================================
// Smart Waste Bin System - BLE Node Firmware (No WiFi)
// ============================================================================
// Description: Firmware for remote bins that only broadcast status via BLE
// Hardware: ESP32, HC-SR04 Ultrasonic Sensor, Built-in OLED Display
// ============================================================================

#include <Wire.h>
#include <U8g2lib.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include "config.h"

// ============================================================================
// OLED Display Configuration
// ============================================================================
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE, OLED_SCL, OLED_SDA);

// ============================================================================
// Global Objects
// ============================================================================
BLEAdvertising* pAdvertising;

// ============================================================================
// System State Variables
// ============================================================================
struct BinState {
    String binId;
    float fillLevel;
    float distance;
    bool isFull;
    int batteryLevel;
    String status;
};

BinState currentState;
unsigned long lastDisplayUpdate = 0;
unsigned long lastAdvertiseUpdate = 0;

// ============================================================================
// Function Prototypes
// ============================================================================
void setupDisplay();
void setupSensor();
void setupBLE();
float measureDistance();
float calculateFillLevel(float distance);
void updateDisplay();
void updateBLEAdvertising();
int getBatteryLevel();

// ============================================================================
// Setup Function
// ============================================================================
void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n\n=================================");
    Serial.println("Smart Bin BLE Node - Starting");
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
    currentState.batteryLevel = 100;
    currentState.status = "INITIALIZING";
    
    Serial.println("Initializing Display...");
    setupDisplay();
    Serial.println("Display Initialized.");

    Serial.println("Initializing Sensor...");
    setupSensor();
    Serial.println("Sensor Initialized.");

    Serial.println("Initializing BLE...");
    setupBLE();
    Serial.println("BLE Initialized.");
    
    currentState.status = "NORMAL";
    Serial.println("Setup complete - Advertising started");
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
    
    // Update status
    if (currentState.fillLevel >= FULL_THRESHOLD) {
        currentState.status = "FULL";
        currentState.isFull = true;
        digitalWrite(LED_PIN, HIGH);
    } else if (currentState.fillLevel >= WARNING_THRESHOLD) {
        currentState.status = "WARNING";
        currentState.isFull = false;
        digitalWrite(LED_PIN, (currentTime / 500) % 2); // Blink
    } else {
        currentState.status = "NORMAL";
        currentState.isFull = false;
        digitalWrite(LED_PIN, LOW);
    }
    
    // Update display
    if (currentTime - lastDisplayUpdate >= DISPLAY_UPDATE_INTERVAL) {
        updateDisplay();
        lastDisplayUpdate = currentTime;
    }
    
    // Update BLE Advertisement Data
    if (currentTime - lastAdvertiseUpdate >= BLE_ADVERTISE_INTERVAL) {
        updateBLEAdvertising();
        lastAdvertiseUpdate = currentTime;
    }
    
    delay(100);
}

// ============================================================================
// BLE Setup
// ============================================================================
void setupBLE() {
    Serial.println("Initializing BLE...");
    BLEDevice::init(BLE_DEVICE_NAME);
    pAdvertising = BLEDevice::getAdvertising();
    
    // Initial payload setup
    String payload = "BIN:" + String(BIN_ID) + ":" + String(currentState.fillLevel, 1) + ":" + String(currentState.batteryLevel);
    
    BLEAdvertisementData oAdvertisementData = BLEAdvertisementData();
    oAdvertisementData.setFlags(0x04); // BR_EDR_NOT_SUPPORTED
    oAdvertisementData.setManufacturerData(payload.c_str());
    
    pAdvertising->setAdvertisementData(oAdvertisementData);
    
    // Use Scan Response for Location Data (Device Name)
    BLEAdvertisementData oScanResponseData = BLEAdvertisementData();
    oScanResponseData.setName(BIN_LOCATION);
    pAdvertising->setScanResponseData(oScanResponseData);
    
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    
    BLEDevice::startAdvertising();
    Serial.println("BLE Advertising started");
}

void updateBLEAdvertising() {
    // Payload: "BIN:<ID>:<FILL>:<BAT>"
    String payload = "BIN:" + String(BIN_ID) + ":" + String(currentState.fillLevel, 1) + ":" + String(currentState.batteryLevel);
    
    BLEAdvertisementData oAdvertisementData = BLEAdvertisementData();
    oAdvertisementData.setFlags(0x04); // BR_EDR_NOT_SUPPORTED
    oAdvertisementData.setManufacturerData(payload.c_str());
    
    // Ensure Scan Response (Location) is also set
    BLEAdvertisementData oScanResponseData = BLEAdvertisementData();
    oScanResponseData.setName(BIN_LOCATION);
    
    pAdvertising->stop(); // Stop before updating
    pAdvertising->setAdvertisementData(oAdvertisementData);
    pAdvertising->setScanResponseData(oScanResponseData);
    pAdvertising->start(); // Restart
    
    Serial.println("BLE Updated: " + payload);
}

// ============================================================================
// Display Setup
// ============================================================================
void setupDisplay() {
    u8g2.begin();
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_ncenB10_tr);
    u8g2.drawStr(10, 20, "BLE Node");
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(10, 40, "Initializing...");
    u8g2.sendBuffer();
}

// ============================================================================
// Update OLED Display
// ============================================================================
void updateDisplay() {
    u8g2.clearBuffer();
    
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.setCursor(0, 10);
    u8g2.print("Bin: ");
    u8g2.print(currentState.binId);
    
    u8g2.setFont(u8g2_font_ncenB14_tr);
    u8g2.setCursor(15, 35);
    if (currentState.fillLevel >= 0) {
        u8g2.print(currentState.fillLevel, 1);
        u8g2.print("%");
    } else {
        u8g2.print("ERR");
    }
    
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.setCursor(0, 50);
    u8g2.print(currentState.status);
    u8g2.print(" ");
    u8g2.print(currentState.distance, 0);
    u8g2.print("cm");
    
    u8g2.setCursor(0, 62);
    u8g2.print("BLE: Broadcasting");
    
    u8g2.sendBuffer();
}

// ============================================================================
// Sensor & Helper Functions
// ============================================================================
void setupSensor() {
    // Already done in setup() via pinMode
}

float measureDistance() {
    float totalDistance = 0;
    int validReadings = 0;
    for (int i = 0; i < 3; i++) {
        digitalWrite(TRIG_PIN, LOW);
        delayMicroseconds(2);
        digitalWrite(TRIG_PIN, HIGH);
        delayMicroseconds(10);
        digitalWrite(TRIG_PIN, LOW);
        long duration = pulseIn(ECHO_PIN, HIGH, 30000);
        if (duration > 0) {
            float d = duration * 0.034 / 2;
            if (d > 2 && d < 400) {
                totalDistance += d;
                validReadings++;
            }
        }
        delay(20);
    }
    return (validReadings > 0) ? (totalDistance / validReadings) : -1;
}

float calculateFillLevel(float distance) {
    if (distance < 0) return -1;
    float empty = BIN_HEIGHT_CM;
    float full = 5;
    if (distance >= empty) return 0;
    if (distance <= full) return 100;
    return constrain(((empty - distance) / (empty - full)) * 100, 0, 100);
}

int getBatteryLevel() {
    // Simulated battery level
    static int level = 100;
    if (millis() % 60000 == 0 && level > 0) level--;
    return level;
}

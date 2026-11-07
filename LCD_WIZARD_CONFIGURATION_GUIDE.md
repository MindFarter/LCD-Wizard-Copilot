# LCD Wizard Configuration Guide for @lcdwizrd

This guide provides step-by-step instructions for configuring Widgets, Variables, Data Bindings, Automations, and WiFi in LCD Wizard. Use this when helping users understand **how to make things work**, not just where to find documentation.

---

## 1. WIDGETS: Configuration & Settings

### What Are Widgets?
Widgets are the UI elements you place on your LCD screen. Each widget has:
- **Name** — How you identify it in code (becomes `ui_WidgetName`)
- **Position & Size** — X, Y, width, height on the canvas
- **Type-Specific Settings** — Each widget type has unique properties
- **Common Settings** — Geometry, layout, styles, events, bindings

### Widget Configuration Steps

**For ANY widget (Button, Label, Slider, Arc, etc.):**

1. **Select the widget** on the canvas or from the Widgets panel
2. **Inspector panel appears** on the right showing all settings
3. **Key fields to configure:**
   - `Name` — Unique identifier (letters, digits, underscores only)
   - `Text` — Label text (for Label, Button widgets)
   - `Value` — Default value (for sliders, arcs)
   - `Min/Max` — Range (for controller widgets like Slider)
   - `Format` — Display format (for Label displaying numbers, e.g., `%.1f` for 1 decimal place)

### Common Widget Types & Their Settings

**Label Widget** — Shows text or numeric values
- `Text` — Initial text to display
- `Data bindings` → `Format` — How to display numbers (e.g., `%.0f` for integers, `%.2f` for 2 decimals)
- `Data bindings` → `Postfix` — Text after the number (e.g., `%`, `kPa`, `°C`)

**Slider Widget** — User adjusts value
- `Min` / `Max` — Range of values
- `Data bindings` → `Direction` — Usually `Widget → variable` (slider updates firmware)
- `Data bindings` → `Variable` — Which variable it controls

**Arc Widget** — Circular gauge display
- `Min` / `Max` — Value range
- `Data bindings` → `Variable` — Which variable it displays
- `Data bindings` → `Direction` — Usually `Variable → widget` (firmware updates display)

**Button Widget** — Click to trigger action
- `Text` — Button label
- `Events` → Click → Action — What happens when pressed

### Example: Configuring a Pressure Gauge Label (from your Eco2UI)

Your project has a pressure reading label. Here's how to configure it:

1. Select `Label_num_kPa` widget on canvas
2. In Inspector, scroll to **Data bindings** section
3. Click **Add** to create a binding
4. Set:
   - `Variable` → `pressure` (or your sensor variable)
   - `Drives` → `Text` (bind to the displayed text)
   - `Format` → `%.1f` (show 1 decimal place)
   - `Postfix` → `kPa` (add unit after number)
   - `Direction` → `Variable → widget` (sensor updates label)

Now the label will automatically display the pressure like: `42.3 kPa`

---

## 2. VARIABLES: Define & Use Data

### What Are Variables?
Variables hold values that move between the firmware and your UI:
- **From firmware** — Sensor readings (temperature, pressure, soil moisture)
- **To firmware** — User settings (setpoint from slider, mode selection)
- **Between widgets** — Share data within the UI (e.g., one variable displayed multiple ways)

### How to Create a Variable

**In the Data tab:**
1. Click **Add variable**
2. Set these fields:

| Field | Options | Purpose |
|-------|---------|---------|
| **Name** | Text (e.g., `pressure`, `soil_temp`) | How you reference it in bindings & formulas |
| **Type** | Float, Int32, Uint32, Bool | Data type (use Float for sensor readings with decimals) |
| **Source** | Set by events only / Sensor channel | Where value comes from |
| **Unit** | Text (e.g., `kPa`, `°C`) | Display unit (optional, for documentation) |
| **Min/Max** | Numbers | Valid range for this variable |

### Variable Sources Explained

**"Set by events only"** — Value comes from:
- User interaction (slider, button, input)
- Firmware calculations
- Use this for user controls and computed values

**"Sensor channel"** — Value comes from:
- Hardware sensor (temperature, pressure, ADC, I/O, etc.)
- Select which sensor/channel supplies the data
- Firmware reads the sensor on schedule, you display the latest cached value

### Example: Configuring Variables for Your Eco2UI Pressure System

Your project reads pressure from sensors. Here's how:

**Variable 1: For displaying current pressure**
- Name: `pressure_kpa`
- Type: `Float`
- Source: `Sensor channel` → Select your pressure sensor
- Min: `0`, Max: `100` (or your range)
- Unit: `kPa`

**Variable 2: For pressure setpoint (user can adjust)**
- Name: `pressure_setpoint`
- Type: `Float`
- Source: `Set by events only` (user adjusts via slider)
- Min: `0`, Max: `100`
- Unit: `kPa`

---

## 3. DATA BINDINGS: Connect Widgets to Variables

### What Is a Data Binding?
A binding is a **connection between a widget and a variable**. It defines:
- **Which variable** to connect to
- **What property** of the widget changes (text, value, color, etc.)
- **Which direction** data flows (one-way or two-way)
- **How to format** the display (for labels showing numbers)

### Creating a Data Binding

**Select a widget → Inspector → scroll to "Data bindings" → Click "Add"**

Required fields:

| Field | Purpose |
|-------|---------|
| **Variable** | Which variable to bind to |
| **Drives** | What property changes (Text, Value, Color, etc.) |
| **Direction** | `Variable → widget` (read-only) or `Widget → variable` (writable) or `Bidirectional` |
| **Format** | (Labels only) How to format numbers: `%.0f` = integer, `%.1f` = 1 decimal, `%.2f` = 2 decimals |
| **Postfix** | (Labels only) Text after the number (e.g., `kPa`, `%`, `°C`) |

### Data Binding Examples from Your Eco2UI

**Example 1: Display pressure value in a label**
- Select: `Label_num_kPa`
- Variable: `pressure_kpa`
- Drives: `Text`
- Direction: `Variable → widget` (firmware updates label)
- Format: `%.1f`
- Postfix: `kPa`
- **Result:** Label shows "42.3 kPa"

**Example 2: User adjusts pressure setpoint with slider**
- Select: `Slider_pressure_set`
- Variable: `pressure_setpoint`
- Drives: `Value`
- Direction: `Widget → variable` (slider updates firmware)
- **Result:** When user drags slider, firmware receives new setpoint value

**Example 3: Arc gauge shows pressure (visual indicator)**
- Select: `Arc_kPa`
- Variable: `pressure_kpa`
- Drives: `Value` (the gauge position)
- Direction: `Variable → widget`
- **Result:** Arc needle points to current pressure

### Binding Direction Explained

**`Variable → widget` (Read-only display)**
- Firmware reads sensor → Variable updates → Widget displays it
- Use for: Showing sensor readings, status displays, read-only values
- Example: Temperature label showing room temp

**`Widget → variable` (Writable input)**
- User adjusts widget → Variable updates → Firmware uses it
- Use for: Sliders, text input, user settings
- Example: Slider sets target pressure

**`Bidirectional`** (Two-way sync)
- Both directions work simultaneously
- Use sparingly, can cause feedback loops

---

## 4. AUTOMATIONS: Triggers & Actions

### What Is an Automation?
An automation is something that **happens without a finger** — it triggers automatically and performs actions:
- **Triggers:** Timer tick, variable changed, threshold crossed, edge detected
- **Actions:** Update variable, call function, show screen, play sound

Automations run every frame in `app_poll()` and are the backbone of how your firmware logic works.

### Creating an Automation

**In Data tab, under variables:**
1. Click **Add automation**
2. Set the **Trigger** (what starts it)
3. Add **Actions** (what it does)

### Trigger Types

| Trigger | When It Fires | Use For |
|---------|---------------|---------|
| **Periodic tick** | Every N milliseconds | Regular updates, periodic sensor reads |
| **Variable changed** | When a variable value changes | React to sensor updates or user input |
| **Threshold** | When variable crosses min/max | Alarms, state changes (e.g., "if pressure > 80 kPa") |
| **Edge on GPIO** | Pin goes high or low | Button press, sensor edge trigger |
| **Delay** | After N milliseconds one time | Delayed actions, initialization |

### Action Types

| Action | Does | Example |
|--------|------|---------|
| **Update variable** | Set a variable to a value | Set `pressure_setpoint = 50` |
| **Call function** | Execute custom C code | Call `emergency_shutdown()` |
| **Show screen** | Navigate to a screen | Go to alerts screen when alarm triggers |
| **Play sound** | Buzz/beep (if hardware supports) | Buzzer alert for high pressure |
| **Set widget style** | Change widget appearance | Highlight warning on low battery |

### Example: Pressure Alarm Automation (for your Eco2UI)

**Scenario:** Buzzer sounds if pressure exceeds 80 kPa

1. Click **Add automation** in Data tab
2. Set **Trigger:**
   - Type: `Threshold`
   - Variable: `pressure_kpa`
   - Condition: `>` (greater than)
   - Value: `80`
3. Add **Action:**
   - Type: `Call function`
   - Function: `trigger_buzzer()` (or your buzzer function)
4. Add another **Action:**
   - Type: `Update variable`
   - Variable: `alarm_active`
   - Value: `1` (true)

**Result:** When pressure goes above 80 kPa, buzzer sounds and alarm flag is set

### Example: Periodic Update Automation

**Scenario:** Read all sensors every 500ms

1. Add automation
2. Trigger: `Periodic tick` → `500` ms
3. Action: `Call function` → `read_all_sensors()`

**Result:** Firmware calls your sensor reading function every 500ms

---

## 5. WIFI CONFIGURATION: WiFi by Phone Setup

### What Is "WiFi by Phone"?
A widget that lets users connect the device to WiFi using their phone, without hardcoding credentials.

The device broadcasts a WiFi network → User connects phone → Enters home WiFi name & password → Device stores credentials and connects.

### Setting Up WiFi by Phone

**In the Widgets panel:**

1. Find **WiFi Setup** widget (under System group)
2. Drag it onto your screen
3. Inspector shows settings:

| Setting | Configure |
|---------|-----------|
| **SSID** | Name of device hotspot (what user sees in WiFi list) |
| **Port** | Web server port (usually 80) |
| **Auto-connect interval** | How often to retry connecting (milliseconds) |
| **SSID list** | Optional: Show preferred networks to user |

### WiFi Configuration Steps (User Perspective)

1. **Device starts** → Broadcasts WiFi hotspot (named in widget settings)
2. **User connects phone** → Joins device's hotspot
3. **User opens web interface** → Phone browser shows setup page automatically
4. **User enters credentials** → Enters home WiFi network name & password
5. **User submits** → Device stores credentials and connects to home WiFi
6. **Device displays status** → Shows "Connected: Home WiFi" or error message

### Making WiFi Status Display

After setup, show connection status using a Label + Variable:

1. Create variable: `wifi_status`
   - Type: `String` or display as text
   - Source: `Set by events only` (firmware sets it)

2. Create Label widget: `Label_wifi`
3. Add data binding:
   - Variable: `wifi_status`
   - Drives: `Text`
   - Direction: `Variable → widget`

4. In your firmware, set `wifi_status` to:
   - `"Connecting..."` while connecting
   - `"Connected"` when successful
   - `"Failed - Wrong password"` on error

---

## 6. COMPLETE WORKFLOW: From Design to Working Device

### The Loop

```
Design Screen → Define Variables → Add Bindings → Create Automations → 
Generate Code → Flash Firmware → Test on Device
```

### Step-by-Step Workflow

**1. Design (Canvas)**
- Add widgets (label, slider, gauge, etc.)
- Position and style them
- Name each widget consistently

**2. Define Variables (Data tab)**
- Add each variable you need
- Set type, source, min/max

**3. Connect with Bindings**
- Select each widget
- Add data bindings to variables
- Set format and direction

**4. Add Logic with Automations**
- Create periodic ticks for sensor reads
- Add thresholds for alarms
- Link triggers to actions

**5. Preview (Play button)**
- Test sliders and buttons
- Verify bindings work
- Check formatting

**6. Export Code**
- Export > Export UI code
- Download .zip file

**7. Build & Flash**
- Use PlatformIO or Arduino IDE
- Compile generated code
- Flash to device

**8. Test on Device**
- Verify all sensors display correctly
- Test all user inputs
- Check automations trigger

---

## Quick Reference Checklist

Before exporting, verify:

- [ ] All widgets have descriptive names
- [ ] All variables are defined with correct types
- [ ] All display widgets have bindings (Labels, Arcs, Gauges)
- [ ] All input widgets have bindings (Sliders, Buttons)
- [ ] All bindings have correct direction (→ or ←)
- [ ] Sensor variables have source set to correct hardware channel
- [ ] Automations for critical logic (alarms, periodic updates) are defined
- [ ] Preview mode works (Play button) with simulated values
- [ ] No errors in the Check tab
- [ ] WiFi setup configured if needed

---

## When Things Don't Work

**Label doesn't update when sensor changes:**
- Check binding exists
- Check direction is `Variable → widget`
- Check variable source is correct sensor channel
- In preview: change simulated sensor value and watch label

**Slider doesn't control anything:**
- Check binding exists
- Check direction is `Widget → variable`
- Check variable name is spelled correctly
- Preview: drag slider and watch variable value in drawer

**Automation doesn't trigger:**
- Check trigger type and condition
- Verify variable/threshold values
- In preview: manually change variable and watch action panel
- Check automation doesn't have conflicting conditions

**Device shows blank screen:**
- Check Hardware > Display configuration matches your actual board
- Verify all pins are correct
- Look at serial monitor for error messages
- See Troubleshooting section of LCD Wizard docs

---

## Getting Help in Preview Mode

Click **Play** button to enter Preview:
- Operate widgets with mouse/touch
- Right panel shows all variables and their live values
- Adjust simulated sensor sliders to test bindings
- Watch automations fire based on your triggers
- Verify all formatting is correct before flashing

This is the safest place to test—nothing you do affects the design until you press Play again to exit.

---

## Key Concepts Summary

| Concept | What It Is | Example |
|---------|-----------|---------|
| **Widget** | UI element on screen | Label, Slider, Arc, Button |
| **Variable** | Value stored in firmware | `pressure_kpa`, `setpoint`, `alarm_active` |
| **Binding** | Connection widget ↔ variable | Label displays pressure; Slider sets target |
| **Automation** | Triggered action without finger | Buzzer sounds if pressure too high |
| **Trigger** | What starts an automation | Timer, threshold, edge, change |
| **Action** | What automation does | Update variable, call function, play sound |

Master these concepts and you can build fully functional embedded UIs without writing C code.

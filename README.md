# Salad Net Earnings Chrome Extension

## Description

This Chrome extension enhances the Salad Technologies earn summary page by calculating and displaying net earnings after deducting electricity costs. It overlays dotted lines on the earnings graph to show net rates, adds net values to tooltips, and allows renaming machine IDs for better readability. Settings for electricity cost ($/kWh), machine wattages, and custom names are configurable via the extension popup.

## Features

- **Net Earnings Calculation**: Factors in user-defined electricity costs to display net earning rates on the 24-hour individual view graph.
- **Graph Overlay**: Adds dotted lines in the same color as each machine's gross earnings line to represent net earnings.
- **Tooltip Enhancements**: Inserts net earnings values immediately after gross values in graph tooltips.
- **Machine Renaming**: Replace machine IDs with custom names across the page, including legends, tables, and tooltips.
- **Selective Rendering**: Only active in 24-hour individual view; skips zero-earning machines; syncs with legend visibility.

## Installation

1. Download the release and unzip it

2. **Load the Extension in Chrome**:
   - Open Google Chrome (or a Chromium-based browser like Brave).
   - Navigate to `chrome://extensions/` in the address bar.
   - Enable "Developer mode" in the top-right corner.
   - Click "Load unpacked" and select the unzipped folder.

## Usage

1. **Configure Settings**:
   - Click the extension icon in your browser toolbar to open the popup.
   - Set your electricity cost in $/kWh (default: 0.10).
   - For each machine ID:
     - Enter a custom name (optional; defaults to the ID).
     - Set the wattage (default: 250).
   - Click "Save" to store settings.

2. **View on Salad Page**:
   - Navigate to [https://salad.com/earn/summary](https://salad.com/earn/summary).
   - Ensure the graph is set to "24 Hours" and "Individual" view.
   - Hover over the graph to see tooltips with gross and net earnings.
   - Machine IDs will be replaced with custom names where applicable.

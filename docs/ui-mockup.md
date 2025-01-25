# AISTM7 UI Design Mockup

## Color Palette
```
Primary:    #1D4ED8 (Blue)
Secondary:  #60A5FA (Light Blue)
Background: #FFFFFF (White)
Dark Mode:  #1F2937 (Dark Gray)
Accent:     #FE9A3E (Orange)
Text:       #111827 (Near Black)
```

## Typography
- Headings: Inter (Bold)
- Body: Inter (Regular)
- Monospace: JetBrains Mono (Charts & Numbers)

## Layout Structure

### Navigation Bar
```
+------------------------------------------------------------------+
|  [LOGO]  Dashboard  Analysis  Portfolio  Settings     [WALLET CONN] |
+------------------------------------------------------------------+
```

### Landing Page Hero
```
+------------------------------------------------------------------+
|                                                                    |
|  Advanced AI-Powered        [Wallet Connection Button]             |
|  Risk Analysis Platform                                           |
|                            [Performance Metrics]                   |
|  Leverage cutting-edge      +-------------------------+           |
|  artificial intelligence    | Annual Return    28.4%  |           |
|  for portfolio analysis    | Sharpe Ratio     2.1    |           |
|                           | Success Rate     92%    |           |
|                           +-------------------------+           |
|                                                                    |
+------------------------------------------------------------------+
```

### Dashboard Layout
```
+------------------------------------------------------------------+
|  Portfolio Overview                    Risk Analysis               |
|  [Chart: Asset Allocation]             [Chart: Risk Metrics]       |
|  +-------------------------+          +-------------------------+  |
|  |                         |          |                         |  |
|  |    Pie Chart           |          |    Line Chart          |  |
|  |                         |          |                         |  |
|  +-------------------------+          +-------------------------+  |
|                                                                    |
|  Recent Activity                      AI Recommendations          |
|  +-------------------------+          +-------------------------+  |
|  | • Trade executed        |          | • Rebalance suggestion  |  |
|  | • Alert triggered       |          | • Risk warning          |  |
|  | • Position updated      |          | • Opportunity alert     |  |
|  +-------------------------+          +-------------------------+  |
+------------------------------------------------------------------+
```

### Analysis Page
```
+------------------------------------------------------------------+
|  Risk Metrics              Performance              Predictions    |
|  +------------------+     +------------------+     +--------------+|
|  | VaR: $12,345     |     | Return: 28.4%    |     | AI Forecast  ||
|  | Sharpe: 2.1      |     | Alpha: 0.8       |     | Next 7 days  ||
|  | Beta: 0.85       |     | Sortino: 2.4     |     | Confidence   ||
|  +------------------+     +------------------+     +--------------+|
|                                                                    |
|  [Detailed Charts & Graphs]                                       |
|  +----------------------------------------------------------+   |
|  |                                                            |   |
|  |                 Interactive Chart Area                     |   |
|  |                                                            |   |
|  +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

## Interactive Elements

### Wallet Connection Button
```
+--------------------------------+
|  [Wallet Icons] Connect Wallet |
+--------------------------------+
```
- Hover state: Slight glow effect
- Click: Opens wallet selection modal
- Connected state: Shows balance & address

### Charts & Graphs
- Interactive tooltips
- Zoom controls
- Time period selectors
- Export options
- Custom view settings

### Navigation Elements
- Subtle hover animations
- Active state indicators
- Responsive dropdown menus
- Breadcrumb navigation

## Component Details

### Risk Analysis Card
```
+------------------------------------------+
|  Risk Analysis                           |
|  +-----------------+    +---------------+|
|  | Current Risk    |    | Historical    ||
|  | Level: Moderate |    | Trend         ||
|  +-----------------+    +---------------+|
|                                          |
|  [Risk Breakdown Chart]                  |
|  • Market Risk                           |
|  • Volatility                            |
|  • Correlation                           |
+------------------------------------------+
```

### Portfolio Overview
```
+------------------------------------------+
|  Portfolio Summary                        |
|  Total Value: $1,234,567                 |
|                                          |
|  [Asset Allocation Chart]                |
|  • Stocks     45%                        |
|  • Bonds      30%                        |
|  • Crypto     15%                        |
|  • Cash       10%                        |
+------------------------------------------+
```

### AI Recommendations Panel
```
+------------------------------------------+
|  AI Insights                             |
|  [Priority Level Indicator]              |
|                                          |
|  • High conviction trade opportunity     |
|  • Risk level approaching threshold      |
|  • Portfolio rebalancing suggested       |
|                                          |
|  [Action Buttons]                        |
+------------------------------------------+
```

## Responsive Behavior

### Desktop (1200px+)
- Full feature set visible
- Multi-column layouts
- Expanded charts
- Detailed metrics

### Tablet (768px - 1199px)
- Condensed navigation
- Stacked layouts
- Simplified charts
- Essential metrics

### Mobile (< 768px)
- Hamburger menu
- Single column
- Swipeable cards
- Critical data only

## Animation Guidelines

### Transitions
- Page transitions: 300ms ease-in-out
- Component mounting: 200ms fade-in
- Hover effects: 150ms ease
- Charts: 500ms sequential animation

### Loading States
```
+------------------+
|  Loading...      |
|  [Progress Bar]  |
+------------------+
```
- Skeleton screens for data
- Smooth progress indicators
- Graceful fallbacks

## Dark Mode Variations
```
Background: #1F2937
Text: #F3F4F6
Cards: #374151
Borders: #4B5563
```
- Automatic system preference detection
- Manual toggle in settings
- Persistent user preference storage

## Accessibility Features
- High contrast ratios
- Keyboard navigation
- Screen reader support
- Focus indicators
- Alternative text
- ARIA labels

## Error States
```
+------------------------------------------+
|  ⚠️ Error State                          |
|  Message: Unable to fetch data           |
|  [Retry Button]                          |
+------------------------------------------+
```
- Clear error messages
- Recovery actions
- Fallback content
- Offline support

## Loading Sequence
1. Initial shell render
2. Authentication check
3. Data fetching
4. Progressive enhancement
5. Interactive elements
6. Background data

This mockup provides a comprehensive overview of the UI design direction, focusing on professional aesthetics, user experience, and functionality. The design emphasizes clarity, ease of use, and visual hierarchy while maintaining a sophisticated financial platform appearance.
# Novo Dashboard v4

A modern, React-based analytics dashboard for Novo Nordisk manufacturing operations.

## Quick Start

On Windows:
1. Double-click the `start-dashboard.bat` file
2. The application will install dependencies and start automatically
3. Your browser should open to http://localhost:3000

Manual start:
```bash
# Install dependencies
npm install

# Start development server
npm start
```

The application will automatically open in your default browser at http://localhost:3000.

## Design Overhaul Vision

This represents a complete redesign of the dashboard with a focus on modern UI/UX patterns, interactive data visualizations, and predictive insights.

### Layout & Information Architecture

- **Flexible Grid System**: Implementation of a responsive layout with a left sidebar for navigation, replacing the previous horizontal tabs
- **Customizable Dashboard**: Users can drag and drop visualization components to create personalized views
- **Hierarchical Data Navigation**: Starting with high-level KPIs, users can drill down into specific lots and processes

### Visual Design Elements

The design has been modernized with Novo Nordisk brand identity:

- **Official Color Palette**: Primarily white with red accents (#e11a28)
- **Circular Elements**: Logo-inspired circular elements incorporated into chart styling
- **Typography System**: Consistent typography system applied throughout

### Enhanced Data Visualizations

- **Interactive Visualizations**: Replaced basic charts with interactive, animated visualizations
- **Trend Indicators**: Added trend indicators and historical context to all metrics
- **Comparative Analysis**: Incorporated small multiples for improved comparative analysis
- **Animated Transitions**: Used animation to highlight data changes

## Key Component Improvements

### KPI Header

- **Persistent Metrics**: Created a persistent header with critical metrics
- **Sparklines**: Added sparklines to show trends at a glance
- **Alert Indicators**: Included alert indicators for metrics outside acceptable ranges

### Lot Performance View

- **Interactive Table**: Created a sortable, filterable lot table
- **Inline Mini-Charts**: Added inline mini-charts for each lot
- **Comparison Tools**: Enabled comparison between selected lots

### RFT Analysis

- **Sankey Diagram**: Developed a Sankey diagram showing where failures occur in the process
- **Heat Map**: Added a heat map showing failure patterns by lot characteristics
- **Pareto Charts**: Created pareto charts highlighting most common issues

### Process Timeline

- **Gantt Timeline**: Added a gantt-style timeline showing lot progression
- **Bottleneck Visualization**: Highlighted bottlenecks and waiting periods
- **Comparative Timeline**: Enabled comparison against target timelines

### Predictive Insights

- **ML-Driven Predictions**: Added machine learning predictions for lot completion times
- **Risk Scoring**: Included risk scoring for active lots
- **Correlation Analysis**: Highlighted correlations between process variables and outcomes

## Technical Improvements

- **React Architecture**: Unified React-based architecture replacing multiple competing JavaScript frameworks
- **Real-time Updates**: Implemented real-time data updates instead of manual refreshes
- **Responsive Design**: Created responsive design that works on tablets for floor managers
- **TypeScript**: Added TypeScript for improved type safety and development experience
- **Modern UI Libraries**: Utilized Material UI for consistent components and Nivo/ECharts for advanced visualizations

## Troubleshooting

If you encounter any issues:

1. Make sure you have Node.js 18.x or higher installed
2. Try clearing the npm cache with `npm cache clean --force`
3. Delete the node_modules directory and run `npm install` again
4. If you see TypeScript errors, you may need to install types with:
   ```
   npm install --save-dev @types/react @types/react-dom @types/node
   npm install --save date-fns react-sparklines
   ```

## Project Structure

```
novo-dashboard-v4/
├── public/             # Static assets
│   ├── index.html      # HTML entry point
│   └── manifest.json   # Web app manifest
├── src/                # Source code
│   ├── components/     # UI components
│   │   ├── charts/     # Chart components
│   │   └── ...         # Other components
│   ├── pages/          # Page components
│   ├── theme/          # Theme configuration
│   ├── App.tsx         # Main App component
│   └── index.tsx       # JavaScript entry point
├── package.json        # Project dependencies
└── tsconfig.json       # TypeScript configuration
```

## Tech Stack

- **Framework**: React with TypeScript
- **UI Components**: Material UI
- **State Management**: React Context API
- **Visualizations**: Nivo, recharts, ECharts
- **Grid Layout**: react-grid-layout
- **Animation**: Framer Motion
- **Date Manipulation**: date-fns
- **Utilities**: lodash 
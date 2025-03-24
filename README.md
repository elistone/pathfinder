# Pathfinding Simulation

An interactive pathfinding simulation built with TypeScript that demonstrates various algorithms like A*, Dijkstra's, and Breadth-First Search.

## Features

- Interactive 2D grid
- Multiple pathfinding algorithms
- Wall placement for creating obstacles
- Visual representation of search process and path

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer)
- npm (comes with Node.js)

### Installation

1. Clone this repository or download the files
2. Install the dependencies:

```bash
npm install
```

### Development

To run the application in development mode with hot-reloading:

```bash
npm start
```

This will start a development server, usually at http://localhost:1234, and automatically open the application in your default browser.

The development server will watch for changes in your TypeScript files and automatically reload the application.

### Building for Production

To create an optimized build for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## How to Use

1. **Moving the Player**: Click on any cell in the grid to make the player find and follow a path to that location.

2. **Placing Walls**: Click the "Toggle Wall Mode" button to enter wall placement mode. Click on grid cells to add or remove walls that act as obstacles.

3. **Changing Algorithms**: Use the dropdown menu to select different pathfinding algorithms:
    - A* (default): Balances speed and optimal path finding
    - Dijkstra's: Guarantees the shortest path
    - BFS (Breadth-First Search): Simple exploration algorithm

4. **Resetting**: Click the "Reset Grid" button to clear the grid and return the player to the starting position.

## Understanding the Visualization

- **Blue Circle**: Player
- **Red Circle**: Target destination
- **Black Cells**: Walls/obstacles
- **Light Blue Cells**: Visited cells during pathfinding
- **Yellow Cells**: The final path from start to destination
import { Grid } from "./grid";
import { Position, CellType } from "./types";
import { SeededRandom } from "./seededRandom";

export class WorldGenerator {
  private grid: Grid;
  private rng: SeededRandom;
  private currentSeed: string | number;

  constructor(grid: Grid, seed?: string | number) {
    this.grid = grid;
    this.currentSeed = seed || SeededRandom.generateSeedString();
    this.rng = new SeededRandom(this.currentSeed);
  }

  /**
   * Get the current seed value as a string
   */
  public getSeed(): string {
    return this.currentSeed.toString();
  }

  /**
   * Set a new seed for generation
   */
  public setSeed(seed: string | number): void {
    this.currentSeed = seed;
    this.rng = new SeededRandom(seed);
  }

  /**
   * Generate a complete world with caves connected by tunnels
   */
  public generateWorld(newSeed?: string | number): void {
    // Update seed if provided
    if (newSeed !== undefined) {
      this.setSeed(newSeed);
    }

    // Reset with walls
    this.fillWithWalls();

    // Generate caves with more open space
    const caveRegions = this.generateCaves();

    // Connect caves with wider tunnels
    this.connectCaves(caveRegions);

    // Add some random empty spaces for variety
    this.addRandomEmptySpaces();

    // Ensure start position and surrounding area is clear
    this.clearStartArea();

    // Ensure connectivity and fill unreachable areas
    this.ensureConnectivity();
  }

  /**
   * Ensure connectivity from starting position and fill unreachable areas
   */
  private ensureConnectivity(): void {
    const width = this.grid.getWorldWidth();
    const height = this.grid.getWorldHeight();

    // Create a map to track visited cells
    const visited: boolean[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false));

    // Flood fill from starting position
    const startPos = { x: 0, y: 0 };
    const reachableCells: Position[] = [];

    // Perform flood fill
    this.floodFill(startPos.x, startPos.y, visited, reachableCells);

    console.log(`Found ${reachableCells.length} reachable cells`);

    // Calculate percentage of reachable cells
    const totalCells = width * height;
    const reachablePercent = (reachableCells.length / totalCells) * 100;

    console.log(`${reachablePercent.toFixed(1)}% of the map is reachable`);

    // If less than 25% of the grid is reachable, add more paths
    if (reachablePercent < 25) {
      console.log("Map has poor connectivity. Adding more paths...");
      this.improveConnectivity(reachableCells);
    }

    // Fill in all unreachable empty cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = this.grid.getCell({ x, y });
        if (cell && cell.getType() === CellType.Empty && !visited[y][x]) {
          // This is an empty cell that can't be reached
          console.log(`Filling unreachable cell at (${x},${y})`);
          cell.setType(CellType.Wall);
        }
      }
    }
  }

  /**
   * Improve connectivity by adding more paths from reachable areas
   */
  private improveConnectivity(reachableCells: Position[]): void {
    // Try to add a few random paths from existing reachable areas
    const numPaths = Math.min(10, Math.floor(reachableCells.length / 20));

    for (let i = 0; i < numPaths; i++) {
      // Pick a random cell from reachable cells
      const startIdx = this.rng.randomInt(0, reachableCells.length - 1);
      const start = reachableCells[startIdx];

      // Pick a direction and distance
      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];

      const dir = directions[this.rng.randomInt(0, directions.length - 1)];
      const distance = this.rng.randomInt(5, 15);

      // Create a path in that direction
      let currentX = start.x;
      let currentY = start.y;

      for (let j = 0; j < distance; j++) {
        currentX += dir.x;
        currentY += dir.y;

        if (!this.isWithinBounds(currentX, currentY)) break;

        const cell = this.grid.getCell({ x: currentX, y: currentY });
        if (cell) {
          cell.reset(); // Make it empty

          // Sometimes widen the path
          if (this.rng.randomBoolean(0.4)) {
            const offsetX = dir.y; // Perpendicular direction
            const offsetY = dir.x; // Perpendicular direction

            const wideCell = this.grid.getCell({
              x: currentX + offsetX,
              y: currentY + offsetY,
            });
            if (
              wideCell &&
              this.isWithinBounds(currentX + offsetX, currentY + offsetY)
            ) {
              wideCell.reset();
            }
          }
        }
      }
    }
  }

  /**
   * Flood fill algorithm to find all reachable cells from a starting point
   */
  private floodFill(
    x: number,
    y: number,
    visited: boolean[][],
    reachableCells: Position[],
  ): void {
    // Base case: out of bounds or already visited or wall
    if (!this.isWithinBounds(x, y) || visited[y][x]) {
      return;
    }

    const cell = this.grid.getCell({ x, y });
    if (!cell || cell.getType() === CellType.Wall) {
      return;
    }

    // Mark as visited
    visited[y][x] = true;
    reachableCells.push({ x, y });

    // Recursively check adjacent cells
    this.floodFill(x + 1, y, visited, reachableCells); // Right
    this.floodFill(x - 1, y, visited, reachableCells); // Left
    this.floodFill(x, y + 1, visited, reachableCells); // Down
    this.floodFill(x, y - 1, visited, reachableCells); // Up
  }

  /**
   * Fill the grid with walls
   */
  private fillWithWalls(): void {
    const width = this.grid.getWorldWidth();
    const height = this.grid.getWorldHeight();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = this.grid.getCell({ x, y });
        if (cell) {
          cell.setType(CellType.Wall);
        }
      }
    }
  }

  /**
   * Clear the starting area to ensure player can move
   */
  private clearStartArea(): void {
    // Clear a 3x3 area around the start position
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const cell = this.grid.getCell({ x, y });
        if (cell) {
          cell.reset();
        }
      }
    }
  }

  /**
   * Add some random empty spaces throughout the map
   */
  private addRandomEmptySpaces(): void {
    const width = this.grid.getWorldWidth();
    const height = this.grid.getWorldHeight();

    // Add about 15% random empty spaces
    const numToAdd = Math.floor(width * height * 0.15);

    for (let i = 0; i < numToAdd; i++) {
      const x = this.rng.randomInt(0, width - 1);
      const y = this.rng.randomInt(0, height - 1);

      const cell = this.grid.getCell({ x, y });
      if (cell && cell.getType() === CellType.Wall) {
        cell.reset();

        // Sometimes make a small cluster of empty cells
        if (this.rng.randomBoolean(0.3)) {
          // Pick a random adjacent cell
          const dx = this.rng.randomBoolean() ? 1 : -1;
          const dy = this.rng.randomBoolean() ? 1 : -1;

          const adjCell = this.grid.getCell({ x: x + dx, y: y + dy });
          if (adjCell) {
            adjCell.reset();
          }
        }
      }
    }
  }

  /**
   * Generate multiple caves across the map
   */
  private generateCaves(): Position[][] {
    const width = this.grid.getWorldWidth();
    const height = this.grid.getWorldHeight();
    const caveRegions: Position[][] = [];

    // Create more caves - increase density
    const numCaves = Math.max(4, Math.floor((width * height) / 150));

    console.log(`Generating ${numCaves} caves`);

    // Create a simple grid for placing caves
    const gridDivisions = Math.ceil(Math.sqrt(numCaves));
    const divWidth = Math.floor(width / gridDivisions);
    const divHeight = Math.floor(height / gridDivisions);

    for (let i = 0; i < numCaves; i++) {
      // Calculate which grid section to use
      const divX = i % gridDivisions;
      const divY = Math.floor(i / gridDivisions);

      // Make caves larger relative to divisions
      const caveWidth = Math.floor(divWidth * 0.7);
      const caveHeight = Math.floor(divHeight * 0.7);

      // Position within the division
      const caveX =
        divX * divWidth +
        Math.floor(this.rng.random() * (divWidth - caveWidth) * 0.8);
      const caveY =
        divY * divHeight +
        Math.floor(this.rng.random() * (divHeight - caveHeight) * 0.8);

      // Ensure cave is within bounds
      if (
        caveX > 0 &&
        caveY > 0 &&
        caveX + caveWidth < width &&
        caveY + caveHeight < height
      ) {
        const cavePoints = this.generateCave(
          caveX,
          caveY,
          caveWidth,
          caveHeight,
        );
        if (cavePoints.length > 0) {
          caveRegions.push(cavePoints);
          console.log(
            `Cave generated at (${caveX},${caveY}) with size ${caveWidth}x${caveHeight}, ${cavePoints.length} open cells`,
          );
        }
      }
    }

    return caveRegions;
  }

  /**
   * Generate a single cave in the specified region with more open space
   */
  private generateCave(
    startX: number,
    startY: number,
    width: number,
    height: number,
  ): Position[] {
    const positions: Position[] = [];
    const endX = Math.min(startX + width, this.grid.getWorldWidth() - 1);
    const endY = Math.min(startY + height, this.grid.getWorldHeight() - 1);

    // Initialize with more empty spaces (70-80% empty)
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const cell = this.grid.getCell({ x, y });
        if (cell) {
          // More empty cells, especially toward center
          const distFromCenter =
            Math.abs(x - (startX + width / 2)) / (width / 2) +
            Math.abs(y - (startY + height / 2)) / (height / 2);

          // Higher probability of empty cells (70-90%)
          const emptyProb = 0.9 - 0.2 * distFromCenter;

          if (this.rng.random() < emptyProb) {
            cell.reset(); // Empty cell
          } else {
            cell.setType(CellType.Wall);
          }
        }
      }
    }

    // Apply cellular automaton rules (modified for more open space)
    this.smoothCave(startX, startY, endX, endY);

    // Collect empty positions
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const cell = this.grid.getCell({ x, y });
        if (cell && cell.getType() === CellType.Empty) {
          positions.push({ x, y });
        }
      }
    }

    return positions;
  }

  /**
   * Apply cellular automaton rules to smooth a cave (favoring open spaces)
   */
  private smoothCave(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): void {
    // Fewer iterations for less smoothing (preserves more open space)
    for (let i = 0; i < 3; i++) {
      const newState: boolean[][] = [];

      // Initialize new state grid
      for (let y = startY; y < endY; y++) {
        newState[y] = [];
        for (let x = startX; x < endX; x++) {
          newState[y][x] = false;
        }
      }

      // Apply rules
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const wallCount = this.countAdjacentWalls(x, y);
          const cell = this.grid.getCell({ x, y });

          if (!cell) continue;

          // Modified rules to favor open spaces
          if (
            x === startX ||
            y === startY ||
            x === endX - 1 ||
            y === endY - 1
          ) {
            // Border cells - 50% chance of being a wall
            newState[y][x] = this.rng.random() < 0.5;
          } else if (cell.getType() === CellType.Wall) {
            // Wall becomes empty if less than 5 adjacent walls
            newState[y][x] = wallCount >= 5;
          } else {
            // Empty becomes wall only if 6+ adjacent walls (higher threshold)
            newState[y][x] = wallCount >= 6;
          }
        }
      }

      // Update grid with new state
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const cell = this.grid.getCell({ x, y });
          if (cell) {
            if (newState[y][x]) {
              cell.setType(CellType.Wall);
            } else {
              cell.reset();
            }
          }
        }
      }
    }
  }

  /**
   * Count adjacent walls around a cell
   */
  private countAdjacentWalls(x: number, y: number): number {
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (this.isWithinBounds(nx, ny)) {
          const cell = this.grid.getCell({ x: nx, y: ny });
          if (cell && cell.getType() === CellType.Wall) {
            count++;
          }
        } else {
          // Out of bounds counts as wall
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Connect caves with tunnels
   */
  private connectCaves(caves: Position[][]): void {
    if (caves.length <= 1) {
      console.log("Not enough caves to connect");
      return;
    }

    console.log(`Connecting ${caves.length} caves`);

    // For each cave, connect to the next cave
    for (let i = 0; i < caves.length - 1; i++) {
      const currentCave = caves[i];
      const nextCave = caves[i + 1];

      if (currentCave.length > 0 && nextCave.length > 0) {
        // Pick random points from each cave
        const startIdx = this.rng.randomInt(0, currentCave.length - 1);
        const endIdx = this.rng.randomInt(0, nextCave.length - 1);

        const start = currentCave[startIdx];
        const end = nextCave[endIdx];

        console.log(
          `Creating tunnel from (${start.x},${start.y}) to (${end.x},${end.y})`,
        );

        // Create a tunnel between these points
        this.createTunnel(start, end);
      }
    }

    // Add more connections for better connectivity
    const extraConnections = Math.floor(caves.length * 0.7);
    console.log(`Adding ${extraConnections} extra connections`);

    for (let i = 0; i < extraConnections; i++) {
      // Pick two random caves
      const cave1Idx = this.rng.randomInt(0, caves.length - 1);
      let cave2Idx;

      do {
        cave2Idx = this.rng.randomInt(0, caves.length - 1);
      } while (cave2Idx === cave1Idx);

      const cave1 = caves[cave1Idx];
      const cave2 = caves[cave2Idx];

      if (cave1.length > 0 && cave2.length > 0) {
        const start = cave1[this.rng.randomInt(0, cave1.length - 1)];
        const end = cave2[this.rng.randomInt(0, cave2.length - 1)];
        this.createTunnel(start, end);
      }
    }

    // Always ensure connectivity to the starting point
    this.connectToStart(caves);
  }

  /**
   * Ensure at least one cave is connected to the starting position
   */
  private connectToStart(caves: Position[][]): void {
    if (caves.length === 0) return;

    // Starting position
    const start = { x: 0, y: 0 };

    // Find the closest cave to the starting position
    let closestCave = caves[0];
    let closestDistance = Infinity;

    for (const cave of caves) {
      if (cave.length === 0) continue;

      for (const point of cave) {
        const dist = Math.abs(point.x - start.x) + Math.abs(point.y - start.y);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestCave = cave;
        }
      }
    }

    // Connect start to the closest point in the closest cave
    let closestPoint = closestCave[0];
    closestDistance = Infinity;

    for (const point of closestCave) {
      const dist = Math.abs(point.x - start.x) + Math.abs(point.y - start.y);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestPoint = point;
      }
    }

    console.log(
      `Connecting start to closest cave at (${closestPoint.x},${closestPoint.y})`,
    );
    this.createTunnel(start, closestPoint);
  }

  /**
   * Create a tunnel between two points (wider and more varied)
   */
  private createTunnel(start: Position, end: Position): void {
    let currentX = start.x;
    let currentY = start.y;

    // Use A* inspired approach for more direct tunnels
    while (currentX !== end.x || currentY !== end.y) {
      // Calculate Manhattan distance for each possible move
      const distIfMoveX =
        Math.abs(end.x - (currentX + Math.sign(end.x - currentX))) +
        Math.abs(end.y - currentY);
      const distIfMoveY =
        Math.abs(end.x - currentX) +
        Math.abs(end.y - (currentY + Math.sign(end.y - currentY)));

      // Pick the move that gets us closer, with some randomness
      const moveX =
        this.rng.random() < 0.8
          ? distIfMoveX <= distIfMoveY
          : distIfMoveX > distIfMoveY;

      if (moveX && currentX !== end.x) {
        currentX += Math.sign(end.x - currentX);
      } else if (currentY !== end.y) {
        currentY += Math.sign(end.y - currentY);
      }

      // Carve the tunnel (always clear the cell)
      const cell = this.grid.getCell({ x: currentX, y: currentY });
      if (cell) {
        cell.reset();
      }

      // Make wider tunnels - 70% chance to widen
      if (this.rng.random() < 0.7) {
        // Pick a direction to widen
        const widthX = this.rng.random() < 0.5 ? 1 : -1;
        const widthY = this.rng.random() < 0.5 ? 1 : -1;

        // 50% chance to widen in both X and Y
        if (this.rng.random() < 0.5) {
          const wideCell1 = this.grid.getCell({
            x: currentX + widthX,
            y: currentY,
          });
          const wideCell2 = this.grid.getCell({
            x: currentX,
            y: currentY + widthY,
          });

          if (wideCell1 && this.isWithinBounds(currentX + widthX, currentY)) {
            wideCell1.reset();
          }

          if (wideCell2 && this.isWithinBounds(currentX, currentY + widthY)) {
            wideCell2.reset();
          }
        } else {
          // Otherwise widen in just one direction
          const wideX = this.rng.random() < 0.5;

          if (wideX) {
            const wideCell = this.grid.getCell({
              x: currentX + widthX,
              y: currentY,
            });
            if (wideCell && this.isWithinBounds(currentX + widthX, currentY)) {
              wideCell.reset();
            }
          } else {
            const wideCell = this.grid.getCell({
              x: currentX,
              y: currentY + widthY,
            });
            if (wideCell && this.isWithinBounds(currentX, currentY + widthY)) {
              wideCell.reset();
            }
          }
        }
      }
    }
  }

  /**
   * Check if coordinates are within the grid bounds
   */
  private isWithinBounds(x: number, y: number): boolean {
    return (
      x >= 0 &&
      y >= 0 &&
      x < this.grid.getWorldWidth() &&
      y < this.grid.getWorldHeight()
    );
  }
}

import { Cell } from './cell';
import { Position, GridOptions, CellType } from './types';

export class Grid {
    private cells: Cell[][] = [];
    private element: HTMLElement;

    // Viewport dimensions (what's visible)
    private viewWidth: number = 0;
    private viewHeight: number = 0;

    // World dimensions (total size)
    private readonly worldWidth: number = 0;
    private readonly worldHeight: number = 0;

    // Viewport position in the world
    private viewportX: number = 0;
    private viewportY: number = 0;

    private cellSize: number;

    constructor(options: GridOptions) {
        this.element = options.container;
        this.cellSize = options.cellSize || 30;
        this.worldWidth = options.worldWidth || 100;
        this.worldHeight = options.worldHeight || 100;

        // Initialize the viewport and world
        this.resize();

        // Add resize event listener
        window.addEventListener('resize', () => this.resize());
    }

    public resize(): void {
        const containerWidth = this.element.clientWidth;
        const containerHeight = this.element.clientHeight;

        // Calculate how many cells can fit in the container
        this.viewWidth = Math.floor(containerWidth / this.cellSize);
        this.viewHeight = Math.floor(containerHeight / this.cellSize);

        // Need at least 5x5 grid for viewport
        this.viewWidth = Math.max(5, this.viewWidth);
        this.viewHeight = Math.max(5, this.viewHeight);

        // Initialize world if needed
        if (this.cells.length === 0) {
            this.initializeWorld();
        }

        // Update the viewport
        this.updateViewport();
    }

    private initializeWorld(): void {
        // Create the entire world grid
        this.cells = [];
        for (let y = 0; y < this.worldHeight; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                const cell = new Cell({ x, y });
                row.push(cell);
            }
            this.cells.push(row);
        }
    }

    private updateViewport(): void {
        // Clear existing viewport
        this.element.innerHTML = '';

        // Set grid dimensions for viewport
        this.element.style.gridTemplateColumns = `repeat(${this.viewWidth}, 1fr)`;
        this.element.style.gridTemplateRows = `repeat(${this.viewHeight}, 1fr)`;

        // Render only cells visible in the viewport
        for (let viewY = 0; viewY < this.viewHeight; viewY++) {
            for (let viewX = 0; viewX < this.viewWidth; viewX++) {
                const worldX = viewX + this.viewportX;
                const worldY = viewY + this.viewportY;

                if (worldX < this.worldWidth && worldY < this.worldHeight) {
                    const cell = this.cells[worldY][worldX];
                    this.element.appendChild(cell.getElement());
                }
            }
        }
    }

    public moveViewport(deltaX: number, deltaY: number): void {
        // Calculate new viewport position
        const newViewportX = Math.max(0, Math.min(this.worldWidth - this.viewWidth, this.viewportX + deltaX));
        const newViewportY = Math.max(0, Math.min(this.worldHeight - this.viewHeight, this.viewportY + deltaY));

        // Only update if the position changed
        if (newViewportX !== this.viewportX || newViewportY !== this.viewportY) {
            this.viewportX = newViewportX;
            this.viewportY = newViewportY;
            this.updateViewport();
        }
    }

    public centerViewportOn(worldPosition: Position): void {
        // Calculate viewport position to center on the given world position
        this.viewportX = Math.max(0, Math.min(this.worldWidth - this.viewWidth,
            worldPosition.x - Math.floor(this.viewWidth / 2)));
        this.viewportY = Math.max(0, Math.min(this.worldHeight - this.viewHeight,
            worldPosition.y - Math.floor(this.viewHeight / 2)));
        this.updateViewport();
    }

    // Convert viewport coordinates to world coordinates
    public viewToWorldPosition(viewPos: Position): Position {
        return {
            x: viewPos.x + this.viewportX,
            y: viewPos.y + this.viewportY
        };
    }

    // Convert world coordinates to viewport coordinates
    public worldToViewPosition(worldPos: Position): Position | null {
        const viewX = worldPos.x - this.viewportX;
        const viewY = worldPos.y - this.viewportY;

        // Check if world position is currently in viewport
        if (viewX >= 0 && viewX < this.viewWidth && viewY >= 0 && viewY < this.viewHeight) {
            return { x: viewX, y: viewY };
        }
        return null; // Position is outside viewport
    }

    // Other existing methods need to be updated to work with world coordinates

    public getCell(worldPosition: Position): Cell | null {
        if (this.isWithinWorldBounds(worldPosition)) {
            return this.cells[worldPosition.y][worldPosition.x];
        }
        return null;
    }

    public isWithinWorldBounds(position: Position): boolean {
        return (
            position.x >= 0 && position.x < this.worldWidth &&
            position.y >= 0 && position.y < this.worldHeight
        );
    }

    public isWithinViewport(worldPosition: Position): boolean {
        return worldPosition.x >= this.viewportX &&
            worldPosition.x < this.viewportX + this.viewWidth &&
            worldPosition.y >= this.viewportY &&
            worldPosition.y < this.viewportY + this.viewHeight;
    }

    // Continue with other methods, making sure they work with world coordinates...

    public getWorldWidth(): number {
        return this.worldWidth;
    }

    public getWorldHeight(): number {
        return this.worldHeight;
    }

    public getViewWidth(): number {
        return this.viewWidth;
    }

    public getViewHeight(): number {
        return this.viewHeight;
    }

    // Keeping the existing methods but ensuring they work with world coordinates
    public getNeighbors(worldPosition: Position): Cell[] {
        // Implementation remains similar but uses world coordinates
        const neighbors: Cell[] = [];
        const directions = [
            { x: 0, y: -1 }, // up
            { x: 1, y: 0 },  // right
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }, // left
        ];

        for (const dir of directions) {
            const newPos = {
                x: worldPosition.x + dir.x,
                y: worldPosition.y + dir.y
            };

            const cell = this.getCell(newPos);
            if (cell && cell.isWalkable()) {
                neighbors.push(cell);
            }
        }

        return neighbors;
    }

    public reset(): void {
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                this.cells[y][x].reset();
            }
        }
    }

    public resetPath(): void {
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                const cell = this.cells[y][x];
                if (cell.getType() === CellType.Path || cell.getType() === CellType.Visited || cell.getType() === CellType.Target) {
                    cell.reset();
                }
            }
        }
    }

    public getRandomEmptyPosition(): Position | null {
        const emptyCells: Position[] = [];

        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                const cell = this.cells[y][x];
                if (cell.getType() === CellType.Empty) {
                    emptyCells.push({ x, y });
                }
            }
        }

        if (emptyCells.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }
}
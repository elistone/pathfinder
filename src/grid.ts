import { Cell } from './cell';
import { Position, GridOptions, CellType } from './types';

export class Grid {
    private cells: Cell[][] = [];
    private element: HTMLElement;
    private width: number = 0;
    private height: number = 0;
    private cellSize: number;

    constructor(options: GridOptions) {
        this.element = options.container;
        this.cellSize = options.cellSize || 30;
        this.resize();

        // Add resize event listener
        window.addEventListener('resize', () => this.resize());
    }

    public resize(): void {
        const containerWidth = this.element.clientWidth;
        const containerHeight = this.element.clientHeight;

        // Calculate how many cells can fit in the container
        this.width = Math.floor(containerWidth / this.cellSize);
        this.height = Math.floor(containerHeight / this.cellSize);

        // Need at least 5x5 grid
        this.width = Math.max(5, this.width);
        this.height = Math.max(5, this.height);

        this.initialize();
    }

    private initialize(): void {
        this.element.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
        this.element.style.gridTemplateRows = `repeat(${this.height}, 1fr)`;

        // Clear existing grid
        this.element.innerHTML = '';
        this.cells = [];

        // Create cells
        for (let y = 0; y < this.height; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < this.width; x++) {
                const cell = new Cell({ x, y });
                this.element.appendChild(cell.getElement());
                row.push(cell);
            }
            this.cells.push(row);
        }
    }

    public getCell(position: Position): Cell | null {
        if (this.isWithinBounds(position)) {
            return this.cells[position.y][position.x];
        }
        return null;
    }

    public getCells(): Cell[][] {
        return this.cells;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public isWithinBounds(position: Position): boolean {
        return (
            position.x >= 0 && position.x < this.width &&
            position.y >= 0 && position.y < this.height
        );
    }

    public getNeighbors(position: Position): Cell[] {
        const neighbors: Cell[] = [];
        const directions = [
            { x: 0, y: -1 }, // up
            { x: 1, y: 0 },  // right
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }, // left
        ];

        for (const dir of directions) {
            const newPos = {
                x: position.x + dir.x,
                y: position.y + dir.y
            };

            const cell = this.getCell(newPos);
            if (cell && cell.isWalkable()) {
                neighbors.push(cell);
            }
        }

        return neighbors;
    }

    public reset(): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x].reset();
            }
        }
    }

    public resetPath(): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                if (cell.getType() === CellType.Path || cell.getType() === CellType.Visited || cell.getType() === CellType.Target) {
                    cell.reset();
                }
            }
        }
    }

    public getRandomEmptyPosition(): Position | null {
        const emptyCells: Position[] = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
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
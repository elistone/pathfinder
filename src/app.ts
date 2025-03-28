import {Grid} from './grid';
import {Player} from './player';
import {PathFinder} from './pathfinder';
import {WorldGenerator} from './worldGenerator';
import {CellType, Position} from './types';
import {SeededRandom} from './seededRandom';

class PathfindingApp {
    private grid: Grid;
    private player: Player;
    private pathFinder: PathFinder;
    private worldGenerator: WorldGenerator;
    private isRandomMode = false;
    private isMoving = false;
    private randomModeTimer: number | null = null;
    private movementCancelled = false; // Flag to track cancelled movement
    private _currentTimeout: number | null = null;

    constructor() {
        // Get the grid container
        const gridContainer = document.getElementById('grid-container') as HTMLElement;

        // Create grid with adaptive size
        this.grid = new Grid({
            container: gridContainer
        });

        // Create player at a starting position
        const startPosition: Position = { x: 0, y: 0 };
        this.player = new Player(this.grid, startPosition);

        // Create pathfinder
        this.pathFinder = new PathFinder(this.grid);

        // Create world generator with a random seed
        const initialSeed = SeededRandom.generateSeedString();
        this.worldGenerator = new WorldGenerator(this.grid, initialSeed);

        // Generate world on startup
        this.generateWorld();

        // Update the seed display
        this.updateSeedDisplay();

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Grid click event
        const gridContainer = document.getElementById('grid-container');
        if (gridContainer) {
            gridContainer.addEventListener('click', this.handleGridClick.bind(this));
        }

        // Reset player button
        const resetButton = document.getElementById('reset-btn');
        if (resetButton) {
            resetButton.addEventListener('click', this.resetGrid.bind(this));
        }

        // Toggle random mode button
        const toggleRandomButton = document.getElementById('toggle-random-btn');
        if (toggleRandomButton) {
            toggleRandomButton.addEventListener('click', this.toggleRandomMode.bind(this));
        }

        // Apply seed button
        const applySeedButton = document.getElementById('apply-seed-btn');
        if (applySeedButton) {
            applySeedButton.addEventListener('click', this.applySeed.bind(this));
        }

        // Copy seed button
        const copySeedButton = document.getElementById('copy-seed-btn');
        if (copySeedButton) {
            copySeedButton.addEventListener('click', this.copySeed.bind(this));
        }

        // Seed input enter key
        const seedInput = document.getElementById('seed-input') as HTMLInputElement;
        if (seedInput) {
            seedInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.applySeed();
                }
            });
        }
    }

    /**
     * Update the seed display with the current seed
     */
    private updateSeedDisplay(): void {
        const currentSeedElement = document.getElementById('current-seed');
        if (currentSeedElement) {
            currentSeedElement.textContent = this.worldGenerator.getSeed();
        }
    }

    /**
     * Apply a new seed from the input field
     */
    private applySeed(): void {
        const seedInput = document.getElementById('seed-input') as HTMLInputElement;
        if (!seedInput) return;

        let seed = seedInput.value.trim();
        if (seed === '') {
            // Generate a random seed if none provided
            seed = SeededRandom.generateSeedString();
        }

        // Apply the seed and generate a new world
        this.generateWorld(seed);

        // Clear the input field
        seedInput.value = '';

        // Update the seed display
        this.updateSeedDisplay();
    }

    /**
     * Copy the current seed to clipboard
     */
    private copySeed(): void {
        const seedValue = this.worldGenerator.getSeed();

        // Copy to clipboard
        navigator.clipboard.writeText(seedValue)
            .then(() => {
                // Show temporary success message
                const copySeedButton = document.getElementById('copy-seed-btn');
                if (copySeedButton) {
                    const originalText = copySeedButton.textContent;
                    copySeedButton.textContent = '✓';
                    copySeedButton.style.color = '#4CAF50';

                    setTimeout(() => {
                        copySeedButton.textContent = originalText;
                        copySeedButton.style.color = '';
                    }, 2000);
                }
            })
            .catch(err => {
                console.error('Failed to copy seed: ', err);
            });
    }

    private async handleGridClick(event: MouseEvent): Promise<void> {
        // If in random mode or already moving, ignore clicks
        if (this.isRandomMode || this.isMoving) return;

        const target = event.target as HTMLElement;
        if (!target.classList.contains('cell')) return;

        const x = parseInt(target.dataset.x || '0', 10);
        const y = parseInt(target.dataset.y || '0', 10);
        const clickedPosition: Position = { x, y };
        const clickedCell = this.grid.getCell(clickedPosition);

        if (!clickedCell) return;

        // Path to the clicked position if it's not a wall and not the current player position
        if (clickedCell.getType() !== CellType.Wall && clickedCell.getType() !== CellType.Player) {
            await this.navigateToPosition(clickedPosition);
        }
    }

    private async navigateToPosition(targetPosition: Position): Promise<boolean> {
        // Reset previous path but preserve walls
        this.grid.resetPath();

        // Reset movement cancelled flag
        this.movementCancelled = false;

        // Get target cell
        const targetCell = this.grid.getCell(targetPosition);
        if (!targetCell) return false;

        // Mark target
        targetCell.setType(CellType.Target);

        // Find path to target position
        this.isMoving = true;
        const playerPosition = this.player.getPosition();
        const path = await this.pathFinder.findPath(playerPosition, targetPosition);

        if (path && path.length > 1) {
            // First visualize the entire path
            await this.visualizePath(path);

            // Check if movement was cancelled during visualization
            if (this.movementCancelled) {
                this.clearFrames();
                return false;
            }

            // Then move along the path
            await this.moveAlongPath(path);

            // Only clear frames if movement wasn't cancelled
            if (!this.movementCancelled) {
                this.clearFrames();
            }

            return !this.movementCancelled;
        } else {
            console.log('No path found!');
            // Keep the target visible for a moment before clearing it
            setTimeout(() => {
                if (this.movementCancelled) return;

                const cell = this.grid.getCell(targetPosition);
                if (cell && cell.getType() === CellType.Target) {
                    cell.reset();
                }
            }, 2000);

            this.isMoving = false;
            return false;
        }
    }

    // Method to clear visualization frames
    private clearFrames(): void {
        for (let y = 0; y < this.grid.getWorldHeight(); y++) {
            for (let x = 0; x < this.grid.getWorldWidth(); x++) {
                const cell = this.grid.getCell({ x, y });
                if (cell) {
                    if (cell.getType() === CellType.Path || cell.getType() === CellType.Visited || cell.getType() === CellType.Target) {
                        cell.reset();
                    }
                }
            }
        }
        this.player.clearTrail();
        this.isMoving = false;
    }

    // Method to visualize the entire path before moving
    private async visualizePath(path: Position[]): Promise<void> {
        // Skip the first position (player's current position) and last position (target)
        for (let i = 1; i < path.length - 1; i++) {
            // Check if movement was cancelled
            if (this.movementCancelled) {
                return;
            }

            const cell = this.grid.getCell(path[i]);
            if (cell) {
                cell.setType(CellType.Path);
            }
        }

        // Add a delay to let the user see the complete path before movement begins
        if (!this.movementCancelled) {
            await new Promise<void>(resolve => {
                // Store timeout ID so it can be cancelled if needed
                this._currentTimeout = setTimeout(() => {
                    resolve();
                }, 500);
            });
            this._currentTimeout = null;
        }
    }

    private async moveAlongPath(path: Position[]): Promise<void> {
        // Skip the first position (player's current position)
        for (let i = 1; i < path.length; i++) {
            // Check if movement was cancelled
            if (this.movementCancelled) {
                return;
            }

            const currentPosition = path[i];

            await new Promise<void>(resolve => {
                // Store timeout ID so it can be cancelled if needed
                this._currentTimeout = setTimeout(() => {
                    // Check again if movement was cancelled
                    if (!this.movementCancelled) {
                        // Move player to current position
                        this.player.moveTo(currentPosition);
                    }
                    resolve();
                }, 200);
            });
        }

        this._currentTimeout = null;
        this.isMoving = false;
    }

    private resetGrid(): void {
        // Stop random mode if active
        if (this.isRandomMode) {
            this.toggleRandomMode();
        }

        // Cancel any ongoing movement
        this.movementCancelled = true;
        this.isMoving = false;

        // Cancel any active timeout
        if (this._currentTimeout !== null) {
            clearTimeout(this._currentTimeout);
            this._currentTimeout = null;
        }

        // Clear the previous player position
        const currentPosition = this.player.getPosition();
        const currentCell = this.grid.getCell(currentPosition);
        if (currentCell) {
            currentCell.reset();
        }

        // Clear any path visualization but preserve walls
        this.clearFrames();

        // Create new player at start position
        const startPosition: Position = { x: 0, y: 0 };
        this.player = new Player(this.grid, startPosition);
    }

    private toggleRandomMode(): void {
        this.isRandomMode = !this.isRandomMode;

        const toggleButton = document.getElementById('toggle-random-btn');
        if (toggleButton) {
            if (this.isRandomMode) {
                toggleButton.textContent = 'Disable Random Mode';
                toggleButton.classList.add('active');
                this.startRandomMode();
            } else {
                toggleButton.textContent = 'Enable Random Mode';
                toggleButton.classList.remove('active');
                this.stopRandomMode();
            }
        }
    }

    private startRandomMode(): void {
        this.pickRandomTarget();
    }

    private stopRandomMode(): void {
        if (this.randomModeTimer !== null) {
            window.clearTimeout(this.randomModeTimer);
            this.randomModeTimer = null;
        }
    }

    private async pickRandomTarget(): Promise<void> {
        if (!this.isRandomMode) return;

        // Don't pick a new target if we're still moving
        if (this.isMoving) {
            // Check again after a short delay
            this.randomModeTimer = window.setTimeout(() => this.pickRandomTarget(), 500);
            return;
        }

        const randomPosition = this.grid.getRandomEmptyPosition();
        if (randomPosition) {
            const success = await this.navigateToPosition(randomPosition);

            // Schedule next target selection
            const delay = success ?
                Math.random() * 2000 + 1000 : // Between 1-3 seconds if successful
                500; // Try again soon if path failed

            this.randomModeTimer = window.setTimeout(() => this.pickRandomTarget(), delay);
        } else {
            // No empty cells, try again later
            this.randomModeTimer = window.setTimeout(() => this.pickRandomTarget(), 1000);
        }
    }

    // Generate world method with optional seed parameter
    private generateWorld(seed?: string | number): void {
        // Stop random mode if active
        if (this.isRandomMode) {
            this.toggleRandomMode();
        }

        // Cancel any ongoing movement
        this.movementCancelled = true;
        this.isMoving = false;

        // Cancel any active timeout
        if (this._currentTimeout !== null) {
            clearTimeout(this._currentTimeout);
            this._currentTimeout = null;
        }

        console.log(`Starting world generation with seed: ${seed || 'random'}`);

        // Reset grid first
        this.grid.reset();

        console.log(`Grid size: ${this.grid.getWorldWidth()}x${this.grid.getWorldHeight()}`);

        // Generate the world with the seed
        this.worldGenerator.generateWorld(seed);

        console.log("World generation complete");

        // Reset player to start position
        const startPosition: Position = { x: 0, y: 0 };
        this.player = new Player(this.grid, startPosition);

        // Update the seed display
        this.updateSeedDisplay();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingApp();
});
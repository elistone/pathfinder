import { Position, CellType } from './types';
import { Grid } from './grid';

export class Player {
    private position: Position;

    constructor(
        private grid: Grid,
        startPosition: Position
    ) {
        this.position = startPosition;
        this.updatePlayerPosition(this.position);
        this.grid.centerViewportOn(this.position);
    }

    public getPosition(): Position {
        return { ...this.position };
    }

    public moveTo(position: Position): void {
        // First, clear the old player position
        const currentCell = this.grid.getCell(this.position);
        if (currentCell) {
            currentCell.reset();
        }

        // Then update to the new position
        this.position = { ...position };
        this.updatePlayerPosition(this.position);

        // Center the viewport on the player
        this.grid.centerViewportOn(this.position);
    }

    private updatePlayerPosition(position: Position): void {
        const cell = this.grid.getCell(position);
        if (cell) {
            cell.setType(CellType.Player);
        }
    }
}
import { Position, CellType } from './types';

export class Cell {
    private element: HTMLElement;
    private currentType: CellType;

    constructor(
        public readonly position: Position,
    ) {
        this.currentType = CellType.Empty;
        this.element = document.createElement('div');
        this.element.className = 'cell';
        this.element.dataset.x = position.x.toString();
        this.element.dataset.y = position.y.toString();
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getType(): CellType {
        return this.currentType;
    }

    public setType(type: CellType): void {
        // Remove previous type classes
        this.element.classList.remove('player-cell', 'wall-cell', 'path-cell', 'visited-cell', 'target-cell');

        // Add new type class
        switch (type) {
            case CellType.Player:
                this.element.classList.add('player-cell');
                break;
            case CellType.Wall:
                this.element.classList.add('wall-cell');
                break;
            case CellType.Path:
                this.element.classList.add('path-cell');
                break;
            case CellType.Visited:
                this.element.classList.add('visited-cell');
                break;
            case CellType.Target:
                this.element.classList.add('target-cell');
                break;
        }

        this.currentType = type;
    }

    public reset(): void {
        this.setType(CellType.Empty);
    }

    public isWalkable(): boolean {
        return this.currentType !== CellType.Wall;
    }
}
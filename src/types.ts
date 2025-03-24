export interface Position {
    x: number;
    y: number;
}

export interface GridOptions {
    container: HTMLElement;
    cellSize?: number;
}

export enum CellType {
    Empty = 'empty',
    Wall = 'wall',
    Player = 'player',
    Path = 'path',
    Visited = 'visited',
    Target = 'target'
}

export interface CellNode {
    position: Position;
    f: number; // f = g + h (total cost)
    g: number; // cost from start to current node
    h: number; // heuristic (estimated cost from current to goal)
    parent: CellNode | null;
}
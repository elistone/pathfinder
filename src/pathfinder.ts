import { Position, CellNode, CellType } from './types';
import { Grid } from './grid';

export class PathFinder {
    constructor(private grid: Grid) {}

    public async findPath(start: Position, end: Position): Promise<Position[] | null> {
        return this.aStar(start, end);
    }

    private async aStar(start: Position, end: Position): Promise<Position[] | null> {
        const openList: CellNode[] = [];
        const closedList: Map<string, boolean> = new Map();

        // Create start node
        const startNode: CellNode = {
            position: start,
            f: 0,
            g: 0,
            h: this.heuristic(start, end),
            parent: null
        };

        openList.push(startNode);

        while (openList.length > 0) {
            // Find node with lowest f score
            let currentIndex = 0;
            for (let i = 0; i < openList.length; i++) {
                if (openList[i].f < openList[currentIndex].f) {
                    currentIndex = i;
                }
            }

            const currentNode = openList[currentIndex];

            // Check if we reached the end
            if (currentNode.position.x === end.x && currentNode.position.y === end.y) {
                return this.reconstructPath(currentNode);
            }

            // Remove current node from openList and add to closedList
            openList.splice(currentIndex, 1);
            const posKey = `${currentNode.position.x},${currentNode.position.y}`;
            closedList.set(posKey, true);

            // Mark as visited for visualization (except start node and end node)
            if (!(currentNode.position.x === start.x && currentNode.position.y === start.y) &&
                !(currentNode.position.x === end.x && currentNode.position.y === end.y)) {
                const cell = this.grid.getCell(currentNode.position);
                if (cell && cell.getType() !== CellType.Player && cell.getType() !== CellType.Target) {
                    cell.setType(CellType.Visited);
                    // Add a small delay for visualization
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            // Get neighbors
            const neighbors = this.grid.getNeighbors(currentNode.position);

            for (const neighborCell of neighbors) {
                const neighborPos = neighborCell.position;
                const neighborKey = `${neighborPos.x},${neighborPos.y}`;

                // Skip if in closed list
                if (closedList.has(neighborKey)) {
                    continue;
                }

                // Calculate g, h, and f values
                const gScore = currentNode.g + 1; // Assuming all movements cost 1
                const hScore = this.heuristic(neighborPos, end);
                const fScore = gScore + hScore;

                // Check if neighbor is already in openList with a better score
                const openNode = openList.find(node =>
                    node.position.x === neighborPos.x && node.position.y === neighborPos.y
                );

                if (openNode && gScore >= openNode.g) {
                    continue;
                }

                // Add neighbor to openList
                const neighborNode: CellNode = {
                    position: neighborPos,
                    f: fScore,
                    g: gScore,
                    h: hScore,
                    parent: currentNode
                };

                if (!openNode) {
                    openList.push(neighborNode);
                } else {
                    // Update existing node
                    openNode.f = fScore;
                    openNode.g = gScore;
                    openNode.parent = currentNode;
                }
            }
        }

        // No path found
        return null;
    }

    private heuristic(a: Position, b: Position): number {
        // Manhattan distance
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private reconstructPath(endNode: CellNode): Position[] {
        const path: Position[] = [];
        let current: CellNode | null = endNode;

        while (current !== null) {
            path.unshift({ ...current.position });
            current = current.parent;
        }

        return path;
    }
}
export class SeededRandom {
    private seed: number;
    private currentSeed: number;

    constructor(seed?: string | number) {
        if (seed === undefined) {
            // Generate a random seed
            seed = Math.floor(Math.random() * 1000000000);
        } else if (typeof seed === 'string') {
            // Convert string to number seed using simple hash
            seed = this.hashString(seed);
        }

        this.seed = seed;
        this.currentSeed = seed;
    }

    /**
     * Get the current seed value
     */
    public getSeed(): number {
        return this.seed;
    }

    /**
     * Get the seed as a string (for display)
     */
    public getSeedString(): string {
        return this.seed.toString();
    }

    /**
     * Set a new seed value
     */
    public setSeed(seed: string | number): void {
        if (typeof seed === 'string') {
            this.seed = this.hashString(seed);
        } else {
            this.seed = seed;
        }
        this.currentSeed = this.seed;
    }

    /**
     * Reset the RNG to the initial seed state
     */
    public reset(): void {
        this.currentSeed = this.seed;
    }

    /**
     * Generate a random number between 0 and 1 (exclusive)
     */
    public random(): number {
        // Mulberry32 algorithm - simple but good distribution
        let t = this.currentSeed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        const result = ((t ^ t >>> 14) >>> 0) / 4294967296;
        return result;
    }

    /**
     * Generate a random integer between min and max (inclusive)
     */
    public randomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /**
     * Shuffle an array using this RNG (Fisher-Yates algorithm)
     */
    public shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Generate a random boolean with given probability
     */
    public randomBoolean(probability = 0.5): boolean {
        return this.random() < probability;
    }

    /**
     * Simple string hash function
     */
    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash || 1); // Avoid 0 as a seed
    }

    /**
     * Generate a random seed string (useful for sharing)
     */
    public static generateSeedString(length: number = 8): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
/**
 * A collection of generic mathematical and calculation utility functions.
 */
export class MathUtils {

    /**
     * Generates a random distance (1-50) for calculation purposes.
     */
    static calculateRandomDistance(): number {
        return Math.floor(Math.random() * 50) + 1;
    }

    /**
     * Calculates the final price based on the price per kilometer and distance.
     * @param pricePerKm The base rate per unit of distance.
     * @param distance The calculated distance of the ride.
     */
    static calculateFinalPrice(pricePerKm: number, distance: number): number {
        return pricePerKm * distance;
    }
}
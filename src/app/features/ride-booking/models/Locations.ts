export class Location {
    pickupLocation: string = '';
    dropLocation: string = '';

    isValidLocation(): boolean {
        return !this.isAnyFieldEmpty() && !this.isStartAndDestinationSame()
    }

    isAnyFieldEmpty(): boolean {
        return this.pickupLocation.trim().length === 0 || this.dropLocation.trim().length === 0;
    }

    isStartAndDestinationSame(): boolean {
        const from = this.pickupLocation.trim().toLowerCase();
        const to = this.dropLocation.trim().toLowerCase();
        return from === to;
    }
}
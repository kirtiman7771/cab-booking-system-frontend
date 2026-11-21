// export default class RideReview {
//   rideId!: number;
//   userId!: number;
//   driverId!: number;
//   pickup!: string;
//   drop!: string;
//   fare!: number;
//   status!: 'Leave a Review' | 'Reviewed' ;
//   date!: Date;
//   reviewed!: boolean;

//   rating?: number;           //1 to 5 stars
//   comments?: string;         // user feedback
//   tags?: string[];           // highlights like "Polite Driver", "Clean Car"
//   passengerName?:string;

//   constructor(
//     rideId: number,
//     userId: number,
//     driverId: number,
//     pickup: string,
//     drop: string,
//     fare: number,
//     status: 'Leave a Review' | 'Reviewed',
//     date: Date,
//     reviewed: boolean,
//     rating?: number,
//     comments?: string,
//     tags?: string[],
//     passengerName?:string
//   ) {
//     this.rideId = rideId;
//     this.userId = userId;
//     this.driverId = driverId;
//     this.pickup = pickup;
//     this.drop = drop;
//     this.fare = fare;
//     this.status = status;
//     this.date = date;
//     this.reviewed = reviewed;
//     this.rating = rating;
//     this.comments = comments;
//     this.tags = tags;
//     this.passengerName=passengerName;
//   }
// }

export interface RideReview {
  id?: string;
  userId: string;
  driverId: string;
  rating: number; // Must be between 1 and 5
  comments?: string; // Optional
  rideId: string;
}

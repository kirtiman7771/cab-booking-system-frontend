export interface DriverDashboardModel {
    driverId: string;
    
    todaysEarnings: number;
    todaysRides: number;
    driverRating: number;
    additionalMetricLabel: string;
    additionalMetricValue: string;

    weeklyEarningsGoal: number;
    weeklyEarningsAchieved: number;
    weeklyRidesGoal: number;
    weeklyRidesAchieved: number;
    ratingMaintenanceGoal: number;
    ratingMaintenanceAchieved: number;
    acceptanceRateGoal: number;
    acceptanceRateAchieved: number;


    earningChange: number; 
    rideChange: number;
    hoursOnline: number;
    hoursOnlineThisWeek: number;

    weeklyGoals: {
        earnings: { current: number; goal: number; completion: number };
        rides: { current: number; goal: number; completion: number };
        rating: { current: number; goal: number; completion: number };
        acceptance: { current: number; goal: number; completion: number };
    };
}
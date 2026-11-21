# Vector Cab Booking

Vector is an Angular web application for booking and managing cab rides. It includes rider and driver experiences, ride booking, ride history, profiles, payments, and driver ride management.

## Features

- Rider and driver registration and sign-in
- Rider dashboard, profile, ride history, and upcoming rides
- Driver dashboard, profile, availability, ride history, and ride requests
- Ride booking and vehicle selection
- Payment and payment receipt screens
- Rating and feedback components

## Tech stack

- Angular 19
- TypeScript and RxJS
- Angular Material and Bootstrap
- Karma and Jasmine for unit tests

## Prerequisites

- Node.js and npm
- The project’s Spring Boot backend for API-backed functionality (the development URL is `http://localhost:8085`)

## Getting started

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200). The Angular development server reloads when application files change.

The app is configured to use the Spring Boot API by default. Set `springApiUrl` in `src/environment/environment.ts` to the URL where your backend is running. The app also supports `mock` and `json` ride repository modes through the `repositoryType` setting in the same file. Some API services use the local JSON Server at `http://localhost:3000`; if the flow you are using needs it, start it in a separate terminal with:

```bash
npx json-server db.json --port 3000
```

Do not use the sample data in `db.json` as real account or payment data.

## Application routes

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/services`, `/about`, `/contact` | Public information pages |
| `/login`, `/rider-login`, `/driver-login` | Sign-in |
| `/registration` | Rider registration |
| `/driver-registration` | Driver registration |
| `/rider/dashboard` | Rider dashboard |
| `/rider/history` | Rider ride history |
| `/rider/upcoming-ride` | Rider upcoming rides |
| `/rider/profile` | Rider profile |
| `/driver/dashboard` | Driver dashboard |
| `/driver/unassigned-rides` | Available ride requests |
| `/driver/upcoming-ride` | Driver upcoming rides |
| `/driver/history` | Driver ride history |
| `/driver/profile` | Driver profile |

Rider and driver routes are protected and require the corresponding signed-in role.

## Development commands

| Command | Description |
| --- | --- |
| `npm start` | Run the development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run watch` | Build in development mode and rebuild on changes |
| `npm test` | Run unit tests with Karma |
| `npm run test:ride-booking` | Run ride-booking unit tests |

## Project layout

```text
src/app/
  core/       Shared services, guards, interceptors, and utilities
  features/   Authentication, rider, driver, ride, payment, and rating features
  shared/     Navigation, landing, contact, and other shared UI
src/environment/  Development and production environment settings
db.json            Local sample data for JSON Server
```

## Production configuration

Before deploying, configure `springApiUrl` in `src/environment/environment.prod.ts` to point to your deployed backend. The checked-in value is a placeholder and must be replaced for production.

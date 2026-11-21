// src/app/services/ride-websocket.service.ts (Final Corrected Version)

import { Injectable, OnDestroy } from '@angular/core';
import { Client, StompHeaders, StompSubscription, IFrame, ActivationState } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject, filter, take } from 'rxjs';
import { Ride } from '../models/Ride';

@Injectable({
  providedIn: 'root'
})
export class RideWebSocketService implements OnDestroy {
  private stompClient: Client;
  private readonly socketUrl = 'http://localhost:8080/rides/ws';
  private token: string = ''

  private connectionStatus = new BehaviorSubject<boolean>(false);
  public isConnected$: Observable<boolean> = this.connectionStatus.asObservable();

  private topicSubscriptions = new Map<string, StompSubscription>();

  constructor() {
    this.token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9EUklWRVIiLCJzdWIiOiJhcmp1bi5zaGFybWFAY2FiLmNvbSIsImlhdCI6MTc2MTkxMDk1MCwiZXhwIjoxNzYxOTE0NTUwfQ.mA-VeAe4XcqA29hmtfhkuirm7bp2pVp-zWCnlpE3sok"
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.socketUrl) as WebSocket,

      connectHeaders: {
        token: this.token // 👈 Pass JWT here
      },

      reconnectDelay: 5000,
      debug: (msg: string) => { /* ... */ },
      onConnect: (frame: IFrame) => {
        console.log('WebSocket: Connected via STOMP/SockJS');
        this.connectionStatus.next(true);
      },
      onStompError: (frame: IFrame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        this.connectionStatus.next(false);
      },
      onDisconnect: () => {
        console.log('WebSocket: Disconnected');
        this.connectionStatus.next(false);
      }
    });
  }

  /**
   * Activates the connection lazily upon first request.
   * Only activates if the client is completely INACTIVE.
   */
  private connect(): void {
    // 💡 BEST PRACTICE: Check only for the INACTIVE state to trigger activation.
    if (this.stompClient.state === ActivationState.INACTIVE) {

      console.log('WebSocket: Activating connection...');
      this.stompClient.activate();
    }
  }

  /**
   * Subscribes to a specific ride topic, ensuring the connection is active.
   */
  public subscribeToRideUpdates(rideId: string): Observable<Ride> {
    const topic = `/topic/rides/${rideId}`;
    const subject = new Subject<Ride>();

    // 1. Trigger the lazy connection
    this.connect();

    // 2. Wait for connection success before sending SUBSCRIBE frame
    this.isConnected$.pipe(
      filter(connected => connected),
      take(1)
    ).subscribe(() => {

      const stompSubscription = this.stompClient.subscribe(topic, (message) => {
        try {
          const payload = JSON.parse(message.body);
          subject.next(payload as Ride);
        } catch (e) {
          console.error('Failed to parse STOMP message:', e);
        }
      });
      this.topicSubscriptions.set(rideId, stompSubscription);

      // 3. Auto-cleanup the STOMP subscription 
      subject.subscribe({
        complete: () => this.unsubscribeFromTopic(rideId),
        error: () => this.unsubscribeFromTopic(rideId)
      });
    });

    return subject.asObservable();
  }

  private unsubscribeFromTopic(rideId: string): void {
    const stompSub = this.topicSubscriptions.get(rideId);
    if (stompSub) {
      stompSub.unsubscribe();
      this.topicSubscriptions.delete(rideId);
      console.log(`WebSocket: Unsubscribed from ride ${rideId}`);

      if (this.topicSubscriptions.size === 0) {
        // Deactivate the connection if no more active subscriptions
        this.stompClient.deactivate();
      }
    }
  }

  /**
   * Cleans up the connection when the service is destroyed.
   * Only deactivate if the connection is currently ACTIVE.
   */
  ngOnDestroy(): void {
    if (this.stompClient.state === ActivationState.ACTIVE) {
      this.stompClient.deactivate();
    }
    this.connectionStatus.complete();
  }
}
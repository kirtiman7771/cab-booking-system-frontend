import { TestBed } from '@angular/core/testing';

import { RideHistoryService } from '../services/ride-history.service';

describe('RideHistoryService', () => {
  let service: RideHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RideHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

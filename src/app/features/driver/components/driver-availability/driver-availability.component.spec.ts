import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverAvailabilityComponent } from './driver-availability.component';

describe('DriverAvailabilityComponent', () => {
  let component: DriverAvailabilityComponent;
  let fixture: ComponentFixture<DriverAvailabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DriverAvailabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

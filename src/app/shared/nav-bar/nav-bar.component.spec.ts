import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavBarComponent } from './nav-bar.component';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, BehaviorSubject } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from '../../features/auth/components/login/login.component';
import { UserRegistrationComponent } from '../../features/auth/components/user-registration/user-registration.component';
import { AuthService } from '../../features/auth/services/auth.service';


describe('NavBarComponent', () => {
  let component: NavBarComponent;
  let fixture: ComponentFixture<NavBarComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockUser = { name: 'Test User', firstName: 'Test' };
  const isLoggedInSubject = new BehaviorSubject<boolean>(false);
  const userTypeSubject = new BehaviorSubject<'rider' | 'driver' | null>(null);

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'getUser'], {
      isLoggedIn$: isLoggedInSubject.asObservable(),
      userType$: userTypeSubject.asObservable()
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [NavBarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavBarComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    authService.getUser.and.returnValue(mockUser);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with isLoggedIn$ and userType$ observables', () => {
    component.ngOnInit();
    expect(component.isLoggedIn$).toBeDefined();
    expect(component.userType$).toBeDefined();
  });

  it('should update userName and driverName when user logs in', () => {
    isLoggedInSubject.next(true);
    authService.getUser.and.returnValue(mockUser);
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.userName).toBe(mockUser.name);
    expect(component.driverName).toBe(mockUser.firstName);
  });

  it('should reset userName when user logs out', () => {
    component.userName = 'Some User';
    isLoggedInSubject.next(false);
    fixture.detectChanges();
    expect(component.userName).toBe("");
  });

  it('should toggle isDropdownOpen', () => {
    component.isDropdownOpen = false;
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBe(true);
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should navigate to /rider-login when loginAs("rider") is called', () => {
    component.loginAs('rider');
    expect(router.navigate).toHaveBeenCalledWith(['/rider-login']);
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should navigate to /driver-registraion when loginAs("driver") is called', () => {
    component.loginAs('driver');
    expect(router.navigate).toHaveBeenCalledWith(['/driver-registraion']);
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should open LoginComponent dialog for openUserLogin', () => {
    component.openUserLogin();
    expect(dialog.open).toHaveBeenCalledWith(LoginComponent, {});
  });

  it('should open UserRegistrationComponent dialog for openUserRegistration', () => {
    component.openUserRegistration();
    expect(dialog.open).toHaveBeenCalledWith(UserRegistrationComponent, {});
  });

  it('should open LoginComponent dialog with specific dimensions for openDriverLogin', () => {
    component.openDriverLogin();
    expect(dialog.open).toHaveBeenCalledWith(LoginComponent, {
      width: '400px',
      height: '400px'
    });
  });

  it('should call authService.logout() when logout is called', () => {
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
  });
});
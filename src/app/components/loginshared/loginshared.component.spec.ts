import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginsharedComponent } from './loginshared.component';

describe('LoginsharedComponent', () => {
  let component: LoginsharedComponent;
  let fixture: ComponentFixture<LoginsharedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginsharedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginsharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

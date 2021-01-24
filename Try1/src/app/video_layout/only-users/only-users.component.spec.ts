import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlyUsersComponent } from './only-users.component';

describe('OnlyUsersComponent', () => {
  let component: OnlyUsersComponent;
  let fixture: ComponentFixture<OnlyUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OnlyUsersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OnlyUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

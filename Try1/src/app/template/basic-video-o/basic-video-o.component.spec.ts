import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicVideoOComponent } from './basic-video-o.component';

describe('BasicVideoOComponent', () => {
  let component: BasicVideoOComponent;
  let fixture: ComponentFixture<BasicVideoOComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasicVideoOComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicVideoOComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

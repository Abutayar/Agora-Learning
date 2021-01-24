import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgoraOne2oneComponent } from './agora-one2one.component';

describe('AgoraOne2oneComponent', () => {
  let component: AgoraOne2oneComponent;
  let fixture: ComponentFixture<AgoraOne2oneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgoraOne2oneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgoraOne2oneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

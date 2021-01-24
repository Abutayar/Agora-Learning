import { TestBed } from '@angular/core/testing';

import { AgoraManagerService } from './agora-manager.service';

describe('AgoraManagerService', () => {
  let service: AgoraManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgoraManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

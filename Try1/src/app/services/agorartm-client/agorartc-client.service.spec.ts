import { TestBed } from '@angular/core/testing';

import { AgorartcClientService } from './agorartc-client.service';

describe('AgorartcClientService', () => {
  let service: AgorartcClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgorartcClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

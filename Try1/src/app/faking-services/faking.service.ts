import { Injectable } from '@angular/core';
import { users } from './fake-user';

@Injectable({
  providedIn: 'root',
})
export class FakingService {
  constructor() {}

  getUserByUsername(username: string): any {
    const user = users.find((u) => u.username === username.toLowerCase());
    return user;
  }
  getUserByvideoStreamID(videoStreamID: string): any {
    const user = users.find(
      (u) => u.videoStreamID.toString() === videoStreamID.toLowerCase()
    );
    return user;
  }


}

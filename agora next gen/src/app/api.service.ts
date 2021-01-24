import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface IUserList {
  _id: string;
  index: string;
  guid: string;
  isActive: string;
  balance: string;
  picture: string;
  age: string;
  eyeColor: string;
  name: {
    first: string;
    last: string;
  };
  company: string;
  email: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly url =   'https://agora-server-tea.herokuapp.com'; // /'http://localhost:4000';
  constructor(private httpClient: HttpClient) {}

  getUserList(): Promise<{ userList: IUserList[] }> {
    return this.httpClient
      .get<{ userList: IUserList[] }>(`${this.url}/userlist`)
      .toPromise();
  }

  registerScreenShared(channelName, isSharing, username, uid): Promise<any> {
    return this.httpClient
      .post(`${this.url}/screenShared`, {
        channelName,
        isSharing,
        username,
        uid,
      })
      .toPromise();
  }

  getScreenShareStatus(channelName): Promise<any> {
    return this.httpClient
      .get(`${this.url}/screenShared`, {
        params: {
          channelName,
        },
      })
      .toPromise();
  }


  getToken(channelName): Promise<any> {
    return this.httpClient
      .get(`${this.url}/access_token`, {
        params: {
          channelName,
        },
      })
      .toPromise();
  }
}

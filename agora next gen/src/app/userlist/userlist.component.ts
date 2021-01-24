import { Component, OnInit } from '@angular/core';
import { ApiService , IUserList } from '../api.service';

@Component({
  selector: 'app-userlist',
  templateUrl: './userlist.component.html',
  styleUrls: ['./userlist.component.css'],
})
export class UserlistComponent implements OnInit {
  userList: IUserList[];
  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.gtUserDetail();
  }

  async gtUserDetail(): Promise<void> {
    try {
      const response = await this.api.getUserList();
      console.log(response);
      this.userList = response.userList;
    } catch (e) {
      console.error(e.message, e);
    }
  }

  initCall(): void {
    console.log('Call');
  }
}

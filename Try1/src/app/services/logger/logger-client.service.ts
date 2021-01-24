import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerClientService {
  constructor() {}

  info(message: string, extra: any = ''): void {
    console.log(
      `%c [WA] INFO : ${message} `,
      'background: blue; color: #fff',
      extra
    );
  }

  success(message: string, extra: any = ''): void {
    console.log(
      `%c [WA] SUCCESS : ${message} `,
      'background: green; color: #fff',
      extra
    );
  }

  warn(message: string, extra: any = ''): void {
    console.log(
      `%c [WA] WARN : ${message} `,
      'background: yellow; color: #000',
      extra
    );
  }

  error(message: string, extra: any = ''): void {
    console.log(
      `%c [WA] ERROR : ${message} `,
      'background: red; color: #fff',
      extra
    );
  }
}

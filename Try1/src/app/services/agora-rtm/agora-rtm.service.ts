import { Injectable } from '@angular/core';
import AgoraRTM from 'agora-rtm-sdk';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoggerClientService } from '../logger/logger-client.service';

@Injectable({
  providedIn: 'root',
})
export class AgoraRTMService {
  private clientRTM = AgoraRTM.createInstance(environment.RTM_APP_KEY);
  messageObserver = new Subject<{ from: string; data: any }>();
  constructor(private logger: LoggerClientService) {
    this.clientRTM.on('ConnectionStateChanged', (newState, reason) => {
      this.logger.info(
        'on connection state changed to ' + newState + ' reason: ' + reason
      );
      this.listenUserMessage();
    });
  }

  listenUserMessage(): void {
    this.clientRTM.on('MessageFromPeer', (data, peerId) => {
      const message = {
        from: peerId,
        data: this.decodeText((data as any).rawMessage),
      };
      this.logger.info('message recieved', message);
      this.messageObserver.next(message);
    });
  }

  sendMessageToUser(
    id: string,
    data: { action: 'on' | 'off'; event: 'audio' | 'user' | 'video' }
  ): void {
    const enc = new TextEncoder();
    this.clientRTM
      .sendMessageToPeer(
        { rawMessage: enc.encode(JSON.stringify(data)) }, // An RtmMessage object.
        `user-${id}` // The user ID of the remote user.
      )
      .then((sendResult) => {
        if (sendResult.hasPeerReceived) {
          /* Your code for handling the event that the remote user receives the message. */
          this.logger.success(`Message Recieved by User : ${id}`, data);
        } else {
          this.logger.warn(`Message not Recieved by User : ${id}`, data);
          /* Your code for handling the event that the message is received by the server but the remote user cannot be reached. */
        }
      })
      .catch((error) => {
        this.logger.error(`${error.message}`, error);
        /* Your code for handling the event of a message send failure. */
      });
  }

  login(id: string): void {
    this.clientRTM
      .login({ uid: `user-${id}` })
      .then(() => {
        this.logger.success('AgoraRTM client login success : ', id);
      })
      .catch((err) => {
        this.logger.error('AgoraRTM client login failure');
      });
  }

  logout(): void {
    this.clientRTM.logout();
  }

  decodeText(arr): void {
    const utf8decoder = new TextDecoder();
    return JSON.parse(utf8decoder.decode(arr));
  }
}

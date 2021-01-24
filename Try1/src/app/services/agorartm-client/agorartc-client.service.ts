import { Injectable } from '@angular/core';
import * as AgoraRTC from 'agora-rtc-sdk';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from 'src/environments/environment';
import { LoggerClientService } from '../logger/logger-client.service';
import { AgoraRTCListenerService } from './listener/agorartc-listener.service';

const APP_ID = environment.RTC_APP_KEY;

@Injectable({
  providedIn: 'root',
})
export class AgorartcClientService {
  client: AgoraRTC.Client;
  public $userSubscribe: Observable<AgoraRTC.Stream>;
  public $userUnsubscribe: Observable<AgoraRTC.Stream>;
  public $userAudioStatus: Observable<{ id: string; status: boolean }>;
  public $userVideoStatus: Observable<{ id: string; status: boolean }>;
  constructor(
    public logger: LoggerClientService,
    private agorartcListener: AgoraRTCListenerService
  ) {
    this.$userSubscribe = this.agorartcListener.userSubcribed$;
    this.$userUnsubscribe = this.agorartcListener.userUnsubcribed$;
    this.$userAudioStatus = this.agorartcListener.userAudioStatus$;
    this.$userVideoStatus = this.agorartcListener.userVideoStatus$;
  }

  initClient(option?: AgoraRTC.ClientConfig): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
      if (AgoraRTC.checkSystemRequirements()) {
        this.client = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8',
        });

        this.client.init(
          APP_ID,
          () => {
            this.logger.success('AgoraRTC client initialized');
            resolve();
          },
          (err) => {
            this.logger.error('AgoraRTC client init failed', err);
            reject(err);
          }
        );
      } else {
        reject();
      }
    });
    return promise;
  }

  joinChannel(
    tokenOrKey: string,
    channelName: string,
    id: string | number = null
  ): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
      this.client.join(
        tokenOrKey,
        channelName,
        id,
        (uid) => {
          this.logger.success(`Join Channel with ${uid}`);
          resolve(String(uid));
        },
        (err) => {
          this.logger.error(`Failed to Join Channel Reason - ${err}`);
          reject(err);
        }
      );
    });
    return promise;
  }

  createLocalStream(option: AgoraRTC.StreamSpec): AgoraRTC.Stream {
    const localStream = AgoraRTC.createStream(option);
    return localStream;
  }

  initStream(stream: AgoraRTC.Stream): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.init(
        () => {
          resolve();
        },
        (err) => reject(err)
      );
    });
  }

  publishStream(stream: AgoraRTC.Stream): void {
    stream.setAudioProfile('high_quality_stereo');
    stream.setVideoProfile('720p_2');
    this.client.publish(stream, (err) => {
      this.logger.error(err);
    });
  }

  listener(): void {
    this.agorartcListener.listener(this.client);
  }

  leaveClient(): void {
    this.client.getSessionStats((stats) => {
      this.logger.info('User Leave', stats);
    });
    this.client.leave(() => {
      this.logger.success('Your Leaved');
    });
  }

  handleError(err): void {
    this.logger.error('Error Handler', err);
  }
}

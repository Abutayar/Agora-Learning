import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/internal/operators';
import { LoggerClientService } from '../../logger/logger-client.service';

@Injectable({
  providedIn: 'root',
})
export class AgoraRTCListenerService {
  userSubcribed = new BehaviorSubject<AgoraRTC.Stream>(undefined);
  userSubcribed$ = this.userSubcribed
    .asObservable()
    .pipe(filter((x) => x !== undefined));

  userUnsubcribed = new BehaviorSubject<AgoraRTC.Stream>(undefined);
  userUnsubcribed$ = this.userUnsubcribed
    .asObservable()
    .pipe(filter((x) => x !== undefined));
  userAudioStatus = new BehaviorSubject<{ id: string; status: boolean }>(
    undefined
  );
  userAudioStatus$ = this.userAudioStatus
    .asObservable()
    .pipe(filter((x) => x !== undefined));
  userVideoStatus = new BehaviorSubject<{ id: string; status: boolean }>(
    undefined
  );
  userVideoStatus$ = this.userVideoStatus
    .asObservable()
    .pipe(filter((x) => x !== undefined));
  isListenering: boolean;
  constructor(private logger: LoggerClientService) {}

  listener(client: AgoraRTC.Client): void {
    this.isListenering = true;
    client.on('stream-added', (evt) => {
      this.logger.info('Stream Added', evt.stream);
      client.subscribe(evt.stream, {}, this.handleError);
    });

    // Play the remote stream when it is subsribed
    client.on('stream-subscribed', (evt) => {
      const stream = evt.stream as AgoraRTC.Stream;
      this.logger.info('Stream Subscribed', evt.stream);
      this.userSubcribed.next(stream);
    });

    // Remove the corresponding view when a remote user unpublishes.
    client.on('stream-removed', (evt) => {
      const stream = evt.stream;
      /* const streamId = String(stream.getId()); */
      this.logger.info('Stream Closed', evt.stream);
      stream.close();
      this.userSubcribed.next(undefined);
      this.userUnsubcribed.next(stream);
    });

    // Remove the corresponding view when a remote user leaves the channel.
    client.on('peer-leave', (evt: any) => {
      const stream = evt.stream;
      /* const streamId = String(stream.getId()); */
      this.logger.info('Peer Leaved', evt.stream);
      stream.close();
      this.userSubcribed.next(undefined);
      this.userUnsubcribed.next(stream);
    });

    client.on('mute-audio', (evt) => {
      this.logger.info(`User Muted ${evt.uid}`, evt.stream);
      this.userAudioStatus.next({
        id: evt.uid,
        status: false,
      });
    });
    client.on('unmute-audio', (evt) => {
      this.logger.info(`User Unmuted ${evt.uid}`, evt.stream);
      this.userAudioStatus.next({
        id: evt.uid,
        status: true,
      });
    });
    client.on('mute-video', (evt) => {
      this.logger.info(`Video Paused ${evt.uid}`, evt.stream);
      this.userVideoStatus.next({
        id: evt.uid,
        status: false,
      });
    });
    client.on('unmute-video', (evt) => {
      this.logger.info(`Video Play ${evt.uid}`, evt.stream);
      this.userVideoStatus.next({
        id: evt.uid,
        status: true,
      });
    });
  }

  /*  unlistener(): void {
    this.userSubcribed.unsubscribe();
    this.userUnsubcribed.unsubscribe();
  }
 */
  handleError(err): void {
    this.logger.error('Error Fallback', err);
  }
}

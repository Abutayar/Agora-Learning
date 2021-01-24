import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter } from 'rxjs/internal/operators';
import { FakingService } from 'src/app/faking-services/faking.service';
import { environment } from 'src/environments/environment';
import { AgorartcClientService } from '../agorartm-client/agorartc-client.service';
import { LoggerClientService } from '../logger/logger-client.service';

/* export interface IStreamListClassified {
  localStream: AgoraRTC.Stream;
  remoteStream: AgoraRTC.Stream[];
  screenStream: AgoraRTC.Stream;
} */

export interface IStreamDetail {
  user: {
    id: string;
    role: 'host' | 'speaker';
    username: string;
    firstname: string;
    lastname: string;
    videoStreamID: number;
    screenStreamID: number;
    self: boolean;
  };
  settings: {
    audioActive?: boolean;
    videoActive?: boolean;
  };
  stream: AgoraRTC.Stream;
}

export interface IUserStreamClassified {
  localStream: IStreamDetail;
  remoteStream: IStreamDetail[];
  screenStream: IStreamDetail;
}

/* export interface IRemoteUserAction {
  audioActive?: boolean;
  videoActive?: boolean;
}
 */
const TOKEN = environment.RTC_APP_SECRET;
const CHANNEL_NAME = 'theapp';

@Injectable({
  providedIn: 'root',
})
export class AgoraManagerService implements OnDestroy {
  listOfStream: IUserStreamClassified = {
    localStream: null,
    remoteStream: [],
    screenStream: null,
  };
  token = TOKEN;
  /* remoteUserAction: IRemoteUserAction = {}; */
  streamsList = new BehaviorSubject<IUserStreamClassified>(this.listOfStream);
  streamsList$ = this.streamsList
    .asObservable()
    .pipe(filter((x) => x == null || x.localStream != null));
  /*  publishRemoteStatus = new BehaviorSubject<IRemoteUserAction>(
    this.remoteUserAction
  );
  publishRemoteStatus$ = this.publishRemoteStatus
    .asObservable()
    .pipe(filter((x) => x !== undefined)); */
  public logger: LoggerClientService;
  subscription: Subscription[] = [];
  constructor(
    private agorartcClient: AgorartcClientService,
    private fakeService: FakingService
  ) {
    this.logger = this.agorartcClient.logger;
  }

  async join(id: string | number = null): Promise<void> {
    try {
      await this.agorartcClient.initClient();
      const uid = await this.agorartcClient.joinChannel(
        this.token,
        CHANNEL_NAME,
        id
      );
      const localStream = this.agorartcClient.createLocalStream({
        streamID: uid,
        video: true,
        audio: true,
      });
      this.agorartcClient.listener();
      await this.agorartcClient.initStream(localStream);
      this.agorartcClient.publishStream(localStream);
      this.listOfStream.localStream = this.createUserStreamObj(
        localStream,
        true
      );
      this.streamsList.next(this.listOfStream);
      const subscription = this.agorartcClient.$userSubscribe.subscribe(
        (stream) => {
          this.logger.info('Stream Received', stream);
          const cloneStream = stream;
          const index = this.listOfStream.remoteStream.findIndex(
            (x) => x.stream.getId() === cloneStream.getId()
          );
          if (index > -1) {
            this.listOfStream.remoteStream.splice(index, 1);
          }
          this.listOfStream.remoteStream.push(
            this.createUserStreamObj(cloneStream)
          );
          const sid = cloneStream.getId().toString();
          this.streamsList.next(this.listOfStream);
        }
      );
      this.subscription.push(subscription);
      this.manageRemoteUserAudioVideoStatus();
      this.managerStreamLeave();
    } catch (error) {}
  }

  managerStreamLeave(): void {
    const subscription = this.agorartcClient.$userUnsubscribe.subscribe(
      (stream) => {
        this.listOfStream.remoteStream = this.listOfStream.remoteStream.filter(
          (s) => s.stream.getId() !== stream.getId()
        );
        this.streamsList.next(this.listOfStream);
      }
    );
    this.subscription.push(subscription);
  }

  manageleave(): void {
    this.agorartcClient.leaveClient();
    this.listOfStream.localStream = null;
    this.listOfStream.remoteStream = [];
    this.streamsList.next(null);
    this.unSubscribeAll();
  }

  unSubscribeAll(): void {
    this.subscription.forEach((sub) => sub.unsubscribe());
    this.subscription = [];
    this.logger.info('Subscription Clear', this.subscription);
  }

  createUserStreamObj(stream: AgoraRTC.Stream, self = false): IStreamDetail {
    const streamID = stream.getId();
    const user = this.fakeService.getUserByvideoStreamID(
      streamID.toString()
    ) as IStreamDetail['user'];
    user.self = self;
    const videoTrack = stream.getVideoTrack();
    return {
      user,
      settings: {
        audioActive: true,
        // tslint:disable-next-line: no-string-literal
        videoActive: videoTrack ? videoTrack['enabled'] : false,
      },
      stream,
    };
  }

  manageRemoteUserAudioVideoStatus(): void {
    const subscription = this.agorartcClient.$userAudioStatus.subscribe(
      (status) => {
        // this.remoteUserAction[status.id].audioActive = status.status;
        const index = this.listOfStream.remoteStream.findIndex(
          (x) => x.stream.getId() === status.id
        );
        this.listOfStream.remoteStream[index].settings.audioActive =
          status.status;
        this.streamsList.next(this.listOfStream);
        /* this.publishRemoteStatus.next(this.remoteUserAction); */
      }
    );
    const subscription1 = this.agorartcClient.$userVideoStatus.subscribe(
      (status) => {
        // this.remoteUserAction[status.id].audioActive = status.status;
        const index = this.listOfStream.remoteStream.findIndex(
          (x) => x.stream.getId() === status.id
        );
        this.listOfStream.remoteStream[index].settings.videoActive =
          status.status;
        this.streamsList.next(this.listOfStream);
        /* this.publishRemoteStatus.next(this.remoteUserAction); */
      }
    );
    this.subscription.push(subscription);
    this.subscription.push(subscription1);
  }

  get sessionStats(): number {
    return this.listOfStream.remoteStream.length + 1;
  }

  ngOnDestroy(): void {
    this.unSubscribeAll();
  }
}

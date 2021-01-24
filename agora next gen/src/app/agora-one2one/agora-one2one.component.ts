import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  LiveStreamingTranscodingConfig,
} from 'agora-rtc-sdk-ng';
import { ApiService } from '../api.service';

const SPEAKER = ['rajnish', 'abhay'];
const HOST_LIST = ['rajnish'];
const RTMP = 'rtmp://a.rtmp.youtube.com/live2/pvgc-1079-qxd5-ma16-2j1a'.trim();
@Component({
  selector: 'app-agora-one2one',
  templateUrl: './agora-one2one.component.html',
  styleUrls: ['./agora-one2one.component.css'],
})
export class AgoraOne2oneComponent implements OnInit, OnDestroy {
  /* Element */
  @ViewChild('player_container') playerContainer: ElementRef;
  @ViewChild('self_player') selfPlayer: ElementRef;
  @ViewChild('shareScreenEl') shareScreenEl: ElementRef;
  @ViewChild('presenter') presenter: ElementRef;
  @ViewChild('otherSpeaker') otherSpeaker: ElementRef;
  isShareScreen = false;
  public speaker = SPEAKER;
  public host = HOST_LIST;
  client: IAgoraRTCClient;
  userConnected = false;
  localTracks = {
    videoTrack: null,
    audioTrack: null,
    screenTrack: undefined,
  };
  options = {
    appid: '',
    channel: 'tea-demo',
    uid: null,
    suid: null,
    username: null,
    token: '',
  };
  remoteTemplate = `
    <div class="player remote-playerlist flex-grow-1 flex-shrink-0"></div>
  `;

  screenSharing = {
    isScreenSharing: false,
    uid: undefined,
    username: undefined,
  };
  remoteUsers: { [key: string]: IAgoraRTCRemoteUser } = {};
  remoteUsersTracker = {};
  streamingStarted: boolean;
  isVideoMute: boolean;
  isAudioMute: boolean;
  constructor(private rd2: Renderer2, private api: ApiService) {
    /* this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }); */
  }

  async ngOnInit(): Promise<void> {
    const response = await this.api.getToken(this.options.channel);
    this.options.token = response.token;
  }

  onSubmit(f: NgForm): void {
    if (f.invalid) {
      return;
    }
    console.log(f.value);
    /* this.options.uid = ;
    console.log('Option', this.options); */
    this.options.username = f.value.username;
    this.join(f.value.username);
  }

  async join(name: string): Promise<void> {
    // create Agora client
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });

    // add event listener to play remote tracks when remote user publishs.
    this.client.on('user-published', this.handleUserPublished.bind(this));
    this.client.on('user-unpublished', this.handleUserUnpublished.bind(this));

    if (SPEAKER.includes(name.toLowerCase())) {
      [
        this.options.uid,
        this.localTracks.audioTrack,
        this.localTracks.videoTrack,
      ] = await Promise.all([
        // join the channel
        this.client.join(
          this.options.appid,
          this.options.channel,
          this.options.token || null
        ),
        // create local tracks, using microphone and camera
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack({ encoderConfig: '720p_2', optimizationMode: 'motion' }),
      ]);

      // play local video track
      this.localTracks.videoTrack.play(this.selfPlayer.nativeElement);
      /* $('#local-player-name').text(`localVideo(${this.options.uid})`); */

      // publish local tracks to channel
      await this.client.publish(
        Object.values(this.localTracks).filter(
          (element) => element !== undefined
        )
      );
      this.rd2.setStyle(this.selfPlayer.nativeElement, 'display', 'block');
      console.log('publish success');
    } else {
      this.options.uid = await this.client.join(
        this.options.appid,
        this.options.channel,
        this.options.token || null
      );
      this.rd2.setStyle(this.selfPlayer.nativeElement, 'display', 'none');
    }
    this.userConnected = true;
    console.log(this.localTracks);
  }

  async subscribeStream(user: IAgoraRTCRemoteUser, mediaType): Promise<void> {
    console.log('User Sub', user);
    const uid = user.uid;
    // subscribe to a remote user
    await this.client.subscribe(user, mediaType);
    console.log('subscribe success');
    if (mediaType === 'video') {
      const player = this.createRemoteUserContainer(`player-${uid}`);

      this.remoteUsersTracker[uid] = user.videoTrack;
      this.remoteUsersTracker[uid].play(`player-${uid}`);
    }
    if (mediaType === 'audio') {
      user.audioTrack.play();
    }
  }

  createRemoteUserContainer(id): HTMLDivElement {
    const container = this.rd2.createElement('div') as HTMLDivElement;
    // Set the id of the div
    this.rd2.setAttribute(container, 'id', id);
    this.rd2.setAttribute(
      container,
      'class',
      'player remote flex-grow-1 flex-shrink-0'
    );
    // Append the created div to the body element
    this.rd2.appendChild(this.playerContainer.nativeElement, container);
    return container;
  }

  createRemoteUserContainer2(id): HTMLDivElement {
    const container = this.rd2.createElement('div') as HTMLDivElement;
    // Set the id of the div
    this.rd2.setAttribute(container, 'id', id);
    this.rd2.setAttribute(container, 'class', 'mini-player');
    // Append the created div to the body element
    this.rd2.appendChild(this.otherSpeaker.nativeElement, container);
    return container;
  }
  async leave(): Promise<void> {
    for (const trackName in this.localTracks) {
      if (trackName) {
        console.log(trackName);
        const track = this.localTracks[trackName];
        if (track) {
          track.stop();
          track.close();
          this.localTracks[trackName] = undefined;
        }
      }
    }

    // remove remote users and player views
    this.remoteUsers = {};
    const remoteConatiner = document.getElementsByClassName('remote');

    while (remoteConatiner[0]) {
      this.rd2.removeChild(
        this.playerContainer.nativeElement,
        remoteConatiner[0]
      );
    }
    // leave the channel
    await this.client.leave();

    console.log('client leaves channel success');
    this.userConnected = false;
  }

  stopStream(trackName): void {
    const track = this.localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      this.localTracks[trackName] = undefined;
    }
  }


  muteUnmuteVideo(): void {
    this.isVideoMute = !this.isVideoMute;
    this.localTracks.videoTrack.setEnabled(!this.isVideoMute);
  }

  muteUnmuteAudio(): void {
    this.isAudioMute = !this.isAudioMute;
    this.localTracks.audioTrack.setEnabled(!this.isAudioMute);
  }

  async handleUserPublished(user, mediaType): Promise<void> {
    const id = user.uid;
    this.remoteUsers[id] = user;
    await this.ScreenSharedStatus();
    this.updateLiveTranscoding(user);
    if (this.options.suid === id) {
      delete this.remoteUsers[id];
      return;
    }
    await this.subscribeStream(user, mediaType);
    console.log('User Handle', user);
    this.changeLayout();

  }

  async handleUserUnpublished(user): Promise<void> {
    const id = user.uid;
    delete this.remoteUsers[id];
    delete this.remoteUsersTracker[id];
    const el = document.getElementById(`player-${id}`);
    if (el) {
      this.rd2.removeChild(this.playerContainer.nativeElement, el);
    }
    /* console.log('User Handle', user);
    if (this.screenSharing.uid === id) {
      await this.api.registerScreenShared(
        this.options.channel,
        false,
        this.options.uid,
        this.options.suid
      );
    } */

    await this.ScreenSharedStatus();
    const temp = {
      uid: Object.keys(this.remoteUsers)[0],
    };
    Object.keys(this.remoteUsers).length > 0
      ? this.updateLiveTranscoding(temp)
      : this.removeLiveTranscoding();
    this.changeLayout();
  }

  async ScreenSharedStatus(): Promise<void> {
    const response = await this.api.getScreenShareStatus(this.options.channel);
    console.log('screen Status', response);
    this.screenSharing = response;
  }

  async shareScreen(): Promise<void> {
    if (this.localTracks.screenTrack) {
      this.stopStream('screenTrack');
      await this.api.registerScreenShared(
        this.options.channel,
        false,
        this.options.uid,
        this.options.suid
      );
    } else {
      const screenClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      this.options.suid = await screenClient.join(
        this.options.appid,
        this.options.channel,
        this.options.token || null
      );
      this.localTracks.screenTrack = await AgoraRTC.createScreenVideoTrack({
        optimizationMode: 'detail',
        encoderConfig: '1080p_1',
      });
      this.localTracks.screenTrack.addListener('ended', () => {
        console.log('Screen Stopped');
        this.shareScreen();
      });
      await screenClient.publish(this.localTracks.screenTrack);
      await this.api.registerScreenShared(
        this.options.channel,
        true,
        this.options.uid,
        this.options.suid
      );
    }
  }

  changeLayout(): void {
    console.log(
      'Change View',
      this.screenSharing,
      this.remoteUsers,
      this.remoteUsersTracker
    );
    if (
      this.screenSharing.isScreenSharing &&
      this.options.suid !== this.screenSharing.uid
    ) {
      console.log('Here');
      /* this.leave(); */
      this.isShareScreen = true;
      const screenTrack = this.remoteUsersTracker[this.screenSharing.uid];
      screenTrack.play(this.shareScreenEl.nativeElement);
      const presterTrack = this.remoteUsersTracker[this.screenSharing.username];
      presterTrack.play(this.presenter.nativeElement);
      if (this.localTracks.videoTrack) {
        this.createRemoteUserContainer2(`player-m-self`);
        this.localTracks.videoTrack.play('player-m-self');
      }
      for (const key in this.remoteUsersTracker) {
        if (
          Object.prototype.hasOwnProperty.call(this.remoteUsersTracker, key)
        ) {
          const element = this.remoteUsersTracker[key];
          console.log(key);

          if (
            key.toString() !== this.screenSharing.uid.toString() &&
            this.screenSharing.username.toString() !== key.toString()
          ) {
            this.createRemoteUserContainer2(`player-m-${key}`);
            element.play(`player-m-${key}`);
          }
        }
      }
    } else {
      this.localTracks.videoTrack.play(this.selfPlayer.nativeElement);
      this.isShareScreen = false;
      const remoteConatiner = document.getElementsByClassName('remote');

      while (remoteConatiner[0]) {
        this.rd2.removeChild(
          this.playerContainer.nativeElement,
          remoteConatiner[0]
        );
      }
      for (const key in this.remoteUsersTracker) {
        if (
          Object.prototype.hasOwnProperty.call(this.remoteUsersTracker, key)
        ) {
          const element = this.remoteUsersTracker[key];

          this.createRemoteUserContainer(`player-${key}`);
          element.play(`player-${key}`);
        }
      }
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  public onPageUnload($event: BeforeUnloadEvent): void {
    if (this.userConnected) {
      this.leave();
    }
  }

  updateLiveTranscoding(user): void {
    if (this.screenSharing.isScreenSharing) {
      this.setTranscodingForScreenShare();
      return;
    }

    if (!this.streamingStarted) {
      return;
    }

    // CDN transcoding configurations.
    const LiveTranscoding: LiveStreamingTranscodingConfig = {
      width: 1280,
      height: 720,
      videoBitrate: 1130,
      videoFrameRate: 24,
      lowLatency: false,
      audioSampleRate: 48000,
      audioBitrate: 48,
      audioChannels: 1,
      videoGop: 30,
      videoCodecProfile: 66,
      backgroundColor: 0x000000,
      transcodingUsers: [
        {
          uid: this.options.uid,
          alpha: 1,
          width: 1280 / 2,
          height: 720,
          zOrder: 1,
          x: 0,
          y: 0,
        },
      ],
    };
    LiveTranscoding.transcodingUsers = [
      ...LiveTranscoding.transcodingUsers,
      ...this.generateTranscodingUsers(),
    ];
    this.client.setLiveTranscoding(LiveTranscoding).then(() => {
      console.log('Updated live transcoding success');
    });
  }

  generateTranscodingUsers(): any {
    console.log('REMOTE USER', this.remoteUsers);
    const remoteUserId = Object.keys(this.remoteUsers);
    const userCount = remoteUserId.length;
    const TranscoderUser = [];
    for (let index = 0; index < userCount; index++) {
      TranscoderUser.push({
        uid: +remoteUserId[index],
        alpha: 1,
        width: 1280 / (userCount + 1),
        height: 720,
        zOrder: 1,
        x: 1280 / (index + 2),
        y: 0,
      });
    }
    return TranscoderUser;
  }

  setTranscodingForScreenShare(): void {
    if (!this.streamingStarted) {
      return;
    }
    // CDN transcoding configurations.
    const LiveTranscoding: LiveStreamingTranscodingConfig = {
      width: 1280,
      height: 720,
      videoBitrate: 1130,
      videoFrameRate: 24,
      lowLatency: false,
      audioSampleRate: 48000,
      audioBitrate: 48,
      audioChannels: 1,
      videoGop: 30,
      videoCodecProfile: 66,
      backgroundColor: 0x000000,
      transcodingUsers: [
        {
          uid: this.screenSharing.uid,
          alpha: 1,
          width: 1280,
          height: 720,
          zOrder: 1,
          x: 0,
          y: 0,
        },
        {
          uid: this.screenSharing.username,
          alpha: 1,
          width: 200,
          height: 200,
          zOrder: 2,
          x: 10,
          y: 10,
        },
      ],
    };
    this.client.setLiveTranscoding(LiveTranscoding).then(() => {
      console.log('Updated live transcoding success for screen Sharing');
    });
  }

  removeLiveTranscoding(): void {
    if (!this.streamingStarted) {
      return;
    }
    // CDN transcoding configurations.
    const LiveTranscoding: LiveStreamingTranscodingConfig = {
      width: 1280,
      height: 720,
      videoBitrate: 1130,
      videoFrameRate: 24,
      lowLatency: false,
      audioSampleRate: 48000,
      audioBitrate: 48,
      audioChannels: 1,
      videoGop: 30,
      videoCodecProfile: 66,
      backgroundColor: 0x000000,
      transcodingUsers: [
        {
          uid: this.options.uid,
          alpha: 1,
          width: 1280,
          height: 720,
          zOrder: 1,
          x: 0,
          y: 0,
        },
      ],
    };
    LiveTranscoding.transcodingUsers = [
      ...LiveTranscoding.transcodingUsers,
      ...this.generateTranscodingUsers(),
    ];
    this.client.setLiveTranscoding(LiveTranscoding).then(() => {
      console.log('Updated live transcoding success');
    });
  }

  startStream(): void {
    if (this.streamingStarted) {
      this.stopStreaming();
      return;
    }
    // CDN transcoding configurations.
    const LiveTranscoding: LiveStreamingTranscodingConfig = {
      width: 1280,
      height: 720,
      videoBitrate: 1130,
      videoFrameRate: 24,
      lowLatency: false,
      audioSampleRate: 48000,
      audioBitrate: 48,
      audioChannels: 1,
      videoGop: 30,
      videoCodecProfile: 66,
      backgroundColor: 0x000000,
      transcodingUsers: [
        {
          uid: this.options.uid,
          alpha: 1,
          width: 1280 / (Object.keys(this.remoteUsers).length + 1),
          height: 720,
          zOrder: 1,
          x: 0,
          y: 0,
        },
      ],
    };
    LiveTranscoding.transcodingUsers = [
      ...LiveTranscoding.transcodingUsers,
      ...this.generateTranscodingUsers(),
    ];
    // This is an asynchronous method. Please ensure that the asynchronous operation completes before conducting the next operation.
    this.client.setLiveTranscoding(LiveTranscoding).then(() => {
      console.log('set live transcoding success');
      this.client.startLiveStreaming(RTMP, true).then(
        () => {
          console.log('start live streaming success');
          this.streamingStarted = true;
        },
        (err) => {
          console.log(err);
        }
      );
    });
    this.client.on('live-streaming-error', (url, err) => {
      console.log(url, err);
    });
  }

  stopStreaming(): void {
    this.client.stopLiveStreaming(RTMP).then(() => {
      console.log('stop live streaming success');
      this.streamingStarted = false;
    });
  }

  ngOnDestroy(): void {
    this.leave();
  }
}

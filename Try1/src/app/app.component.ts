import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { FakingService } from './faking-services/faking.service';
import {
  AgoraManagerService,
  IStreamDetail,
} from './services/agora-manager/agora-manager.service';
import { AgoraRTMService } from './services/agora-rtm/agora-rtm.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnDestroy {
  title = 'agoraAppDemo';
  streaming = false;
  arrayOfStream: IStreamDetail[] = [];
  isVideoMuted: boolean;
  isAudioMuted: boolean;
  subscription: Subscription[] = [];
  /* remoteUserSetting: IRemoteUserAction; */
  errorMsg: any;
  loggedInRTC: boolean;
  width: any;
  body = document.getElementsByTagName('body');
  alertAction: any;
  @ViewChild('alert') alertTemplate: ElementRef;
  messageAction: any;
  alertStatus: boolean;
  constructor(
    public agoraMgr: AgoraManagerService,
    private $fake: FakingService,
    private agoraRTM: AgoraRTMService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      /* this.param1 = params['param1'];
      this.param2 = params['param2']; */
      if (params.token) {
        this.agoraMgr.token = params.token;
      }
    });
    this.resize();
  }

  @HostListener('window:resize', [])
  resize(): void {
    this.width = this.body[0].clientWidth;
    const height = this.body[0].clientHeight;
    const root = document.documentElement;
    root.style.setProperty('--width', this.width + 'px');
    root.style.setProperty('--height', height + 'px');
  }

  join(username: string): void {
    try {
      const user = this.$fake.getUserByUsername(username);
      if (user) {
        this.errorMsg = '';
        this.agoraMgr.logger.success('User Exists', user);
        this.agoraMgr.join(user.videoStreamID);
        const subscription = this.agoraMgr.streamsList$.subscribe(
          (streamsList) => {
            if (streamsList == null) {
              this.manageLeave();
              return;
            }
            this.streaming = true;
            this.arrayOfStream = [];
            this.arrayOfStream.push(streamsList.localStream);
            if (streamsList.remoteStream.length > 0) {
              streamsList.remoteStream.forEach((stream) => {
                this.arrayOfStream.push(stream);
              });
            }
            if (!this.loggedInRTC) {
              this.loginRtm();
            }
          }
        );
        this.messageObserver();
        this.subscription.push(subscription);
      } else {
        this.errorMsg = 'User Not Allowed';
      }
    } catch (e) {
      this.errorMsg = e.message || 'Agora Not Supported';
    }
  }

  messageObserver() {
    const subscription = this.agoraRTM.messageObserver.subscribe((data) => {
      this.agoraMgr.logger.info('Message Received', data);
      this.manageRemoteAction(data.data.event, data.data.action);
    });
    this.subscription.push(subscription);
  }
  muteVideo(): void {
    this.arrayOfStream[0].stream.muteVideo();
    this.arrayOfStream[0].settings.videoActive = false;
    this.isVideoMuted = true;
  }

  unMuteVideo(): void {
    this.arrayOfStream[0].stream.unmuteVideo();
    this.arrayOfStream[0].settings.videoActive = true;
    this.isVideoMuted = false;
  }
  muteAudio(): void {
    this.arrayOfStream[0].stream.muteAudio();
    this.arrayOfStream[0].settings.audioActive = false;
    this.isAudioMuted = true;
  }

  unMuteAudio(): void {
    this.arrayOfStream[0].stream.unmuteAudio();
    this.arrayOfStream[0].settings.audioActive = true;
    this.isAudioMuted = false;
  }

  leave(): void {
    if (confirm('Are you sure about this')) {
      this.agoraMgr.manageleave();
      this.manageLeave();
    }
  }

  manageLeave(): void {
    this.arrayOfStream.forEach((x) => x.stream.close());
    this.arrayOfStream = [];
    this.streaming = false;
    this.isVideoMuted = false;
    this.isAudioMuted = false;
    this.logoutRtm();
    this.unSubscribeAll();
    window.location.reload();
  }

  unSubscribeAll(): void {
    this.subscription.forEach((sub) => sub.unsubscribe());
    this.subscription = [];
    this.agoraMgr.logger.info('Subscription Clear');
  }

  loginRtm() {
    this.loggedInRTC = true;
    this.agoraRTM.login(this.agoraMgr.listOfStream.localStream.user.id);
  }

  logoutRtm() {
    this.agoraRTM.logout();
    this.loggedInRTC = false;
  }

  muteRemoteUser(id, setting) {
    if (this.agoraMgr.listOfStream.localStream.user.role === 'host') {
      this.agoraRTM.sendMessageToUser(id, {
        action: setting.audioActive ? 'off' : 'on',
        event: 'audio',
      });
    }
  }

  remoteUserVideo(id,setting) {
    if (this.agoraMgr.listOfStream.localStream.user.role === 'host') {
      this.agoraRTM.sendMessageToUser(id, { action: setting.videoActive ? 'off' : 'on', event: 'video' });
    }
  }

  removeRemoteUser(id) {
    if (this.agoraMgr.listOfStream.localStream.user.role === 'host') {
      this.agoraRTM.sendMessageToUser(id, { action: 'off', event: 'user' });
    }
  }

  openVerticallyCentered(content) {
    this.modalService.open(content, { centered: true });
  }

  openSm(content, message, action) {
    if (this.alertStatus) return;
    this.alertAction = action;
    this.messageAction = message;
    this.alertStatus = true;
    const data = this.modalService.open(content, {
      size: 'sm',
      backdrop: false,
      centered: true,
      windowClass: 'my-alert slide-left',
    });
  }

  alertMAction(model: NgbModalRef) {
    this.alertStatus = false;
    switch (this.alertAction) {
      case 'audio_on':
        this.unMuteAudio();
        model.close();
        break;
      case 'video_on':
        this.unMuteVideo();
        model.close();
      default:
        return;
    }
  }

  manageRemoteAction(event: 'audio' | 'user' | 'video', action: 'on' | 'off') {
    switch (event) {
      case 'audio':
        action === 'off'
          ? (this.muteAudio(), this.toastr.info('Host have mute your audio'))
          : this.openSm(
              this.alertTemplate,
              'Host want to turn on audio',
              `${event}_${action}`
            );
        break;
      case 'video':
        action === 'off'
          ? (this.muteVideo(), this.toastr.info('Host have mute your video'))
          : this.openSm(
              this.alertTemplate,
              'Host want to turn on camera',
              `${event}_${action}`
            );
        break;
      case 'user':
        this.toastr.info('Host have removed you');
        action === 'off' ? (this.agoraMgr.manageleave(), this.manageLeave()): void null;
        break;
    }
  }

  ngOnDestroy(): void {
    this.unSubscribeAll();
  }
}

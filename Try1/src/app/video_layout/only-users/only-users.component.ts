import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { LoggerClientService } from 'src/app/services/logger/logger-client.service';

@Component({
  selector: 'app-only-users',
  templateUrl: './only-users.component.html',
  styleUrls: ['./only-users.component.css'],
})
export class OnlyUsersComponent implements OnInit {
  @ViewChild('gallery') gallery: ElementRef;
  // tslint:disable-next-line: variable-name
  _streams: AgoraRTC.Stream[];
  @Input() set streams(s: AgoraRTC.Stream[]) {
    /* this._streams = []; */
    const _s = s
    this._streams = _s;
    this.logger.info('Stream', this._streams);
    setTimeout(() => this.recalculateLayout(), 100);
    this.recalculateLayout();
  }
  @Input() settings: any;
  constructor(private logger: LoggerClientService) {}

  ngOnInit(): void {
    this.logger.info('Settings', this.settings);
    this.recalculateLayout();
  }

  @HostListener('window:resize', [])
  recalculateLayout(): void {
    const gallery = document.getElementById('gallery');
    const userArea = document.getElementById('user-area');
    const screenWidth = userArea.getBoundingClientRect().width;
    const screenHeight = userArea.getBoundingClientRect().height;
    const videoCount = userArea.getElementsByTagName('app-basic-video-o').length;
    const aspectRatio = screenWidth > 565 ? 16 / 9 : 1 / 1;

    const { width, height, cols } = this.calculateLayout(
      screenWidth,
      screenHeight,
      videoCount,
      aspectRatio
    );

    gallery.style.setProperty('--width', width + 'px');
    gallery.style.setProperty('--height', height + 'px');
    gallery.style.setProperty('--cols', cols + '');
  }

  calculateLayout(
    containerWidth: number,
    containerHeight: number,
    videoCount: number,
    aspectRatio: number
  ): { width: number; height: number; cols: number } {
    let bestLayout = {
      area: 0,
      cols: 0,
      rows: 0,
      width: 0,
      height: 0,
    };

    // brute-force search layout where video occupy the largest area of the container
    for (let cols = 1; cols <= videoCount; cols++) {
      const rows = Math.ceil(videoCount / cols);
      const hScale = containerWidth / (cols * aspectRatio);
      const vScale = containerHeight / rows;
      let width: number;
      let height: number;
      if (hScale <= vScale) {
        width = Math.floor(containerWidth / cols);
        height = Math.floor(width / aspectRatio);
      } else {
        height = Math.floor(containerHeight / rows);
        width = Math.floor(height * aspectRatio);
      }
      const area = width * height;
      if (area > bestLayout.area) {
        bestLayout = {
          area,
          width,
          height,
          rows,
          cols,
        };
      }
    }
    return bestLayout;
  }

}

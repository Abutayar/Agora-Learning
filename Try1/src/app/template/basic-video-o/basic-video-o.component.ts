import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { IStreamDetail } from 'src/app/services/agora-manager/agora-manager.service';
import { LoggerClientService } from 'src/app/services/logger/logger-client.service';

@Component({
  selector: 'app-basic-video-o',
  templateUrl: './basic-video-o.component.html',
  styleUrls: ['./basic-video-o.component.css'],
})
export class BasicVideoOComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() streamD: IStreamDetail;
  @ViewChild('vc') private videoContainer: ElementRef;
  @Output() renderedPlayer = new EventEmitter<boolean>();
/*   @Input() setting: any; */
  private readonly prefix = 'user-';
  constructor(private logger: LoggerClientService) {
  }


  ngOnInit(): void {  }

  ngAfterViewInit(): void {
    const id = this.prefix + this.streamD.stream.getId();
    this.logger.info(`Render Stream Player for ${id}`,this.streamD.user);
    this.videoContainer.nativeElement.id = id;
    this.streamD.stream.play(id);
    this.renderedPlayer.emit(true);
  }

  ngOnDestroy(): void {
    this.streamD = undefined;
  }
}

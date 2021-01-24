import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-speedtest',
  templateUrl: './speedtest.component.html',
  styleUrls: ['./speedtest.component.css'],
})
export class SpeedtestComponent implements OnInit , OnDestroy {
  speed: string;
  timeout: any;
  constructor() {}

  ngOnInit(): void {
      const imageAddr =
        'http://www.tranquilmusic.ca/images/cats/Cat2.JPG' +
        '?n=' +
        Math.random();
      let startTime: number;
      let endTime: number;

      const download = new Image();
      download.onload = () => {
        endTime = new Date().getTime();
        this.showResults(endTime, startTime);
      };
      startTime = new Date().getTime();
      download.src = imageAddr;
  }

  showResults(endTime, startTime): void {
    const downloadSize = 5616998;
    const duration = (endTime - startTime) / 1000; // Math.round()
    const bitsLoaded = downloadSize * 8;
    const speedBps = (bitsLoaded / duration).toFixed(2);
    const speedKbps = (parseFloat(speedBps) / 1024).toFixed(2);
    const speedMbps = (parseFloat(speedKbps) / 1024).toFixed(2);
    /* alert(
      'Your connection speed is: \n' +
        speedBps +
        ' bps\n' +
        speedKbps +
        ' kbps\n' +
        speedMbps +
        ' Mbps\n'
    ); */
    this.speed = speedMbps + ' Mbps\n';
    this.timeout = setTimeout(() => {
      this.ngOnInit();
    }, 1000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeout);
  }

}

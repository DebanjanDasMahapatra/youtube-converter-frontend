import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { DownloadService } from './services/download.service';
import { SocketIO } from './socket';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

  title = 'youtube-converter';
  progbar: boolean = false;
  message: string = "";
  video_id: string = "";
  speed: number = 0;
  isDownloaded: boolean = false;
  pg: number = 0;
  remTime = {
    mins: 0,
    secs: 0
  }
  url: String = environment.baseURL;
  notificationEnabled: boolean = false;
  constructor(private downloadservice: DownloadService) {
  }

  ngOnInit(): void {
    this.progbar = false;
    this.message = "";
    this.video_id = "";
    this.isDownloaded = false;
    this.pg = 0;
    this.remTime = {
      mins: 0,
      secs: 0
    }
    this.speed = 0;
    Notification.requestPermission(result => {
      // console.log(result)
      this.notificationEnabled = result == 'granted';
    });
  }

  onSubmit(data: NgForm) {
    // console.log(data.value);
    var link = data.value.link;
    if (link.includes('youtu.be')) {
      var arr = link.split("/");
      this.video_id = arr[arr.length - 1]
      // console.log(arr[arr.length - 1]);
    }
    else {
      this.video_id = link.split('v=')[1];
      var ampersandPosition = this.video_id.indexOf('&');
      if (ampersandPosition != -1) {
        this.video_id = this.video_id.substring(0, ampersandPosition);
      }
      // console.log(this.video_id);
    }
    if (!(/^[a-zA-Z0-9-_]{11}$/.test(this.video_id))) {
      alert("Video Id is invalid");
      data.reset();
      return;
    }
    new SocketIO(this.video_id, (pg: number, remainingTime: number, speed: number) => {
      this.pg = pg;
      this.remTime = {
        mins: Math.floor(remainingTime / 60),
        secs: remainingTime % 60
      }
      this.speed = Number(Number(speed / 1024).toFixed(3));
    }, () => {
      this.isDownloaded = true;
    }, this.notificationEnabled).initiateDownload();

    this.message = "Your Video is being converted. Please wait!!"
    this.progbar = true;
    data.reset();

  }

  resetEverything(): void {
    this.ngOnInit();
  }

}
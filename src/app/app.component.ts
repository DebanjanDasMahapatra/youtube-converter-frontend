import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { SocketIO } from './socket';
import { DownloadService } from './download.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {

	isConverting: boolean = false;
	hasDownloaded: boolean = false;
	isDownloading: boolean = false;
	notificationEnabled: boolean = false;
	disconnected: boolean = true;
	maintenance: boolean = false;
	url: String = environment.baseURL;
	lastUpdated: String = environment.lastUpdated;
	videoId: string = "";
	videoName: string = '';
	speed: number = 0;
	progress: number = 0;
	message: { type: "success" | "warning" | "danger", text: string } = { type: "warning", text: "" }
	remTime: { mins: number, secs: number } = { mins: 0, secs: 0 }
	socketIO: SocketIO | null = null;
	subscription?: Subscription;

	constructor(private downloadService: DownloadService) { }

	ngOnInit(): void {
		this.resetEverything()
		this.socketIO = new SocketIO((progress: number, remainingTime: number, speed: number) => {
			// progressCallback
			this.progress = progress;
			this.remTime = {
				mins: Math.floor(remainingTime / 60),
				secs: remainingTime % 60
			}
			this.speed = Number(Number(speed / 1024).toFixed(3));
		}, (videoName: string) => {
			// completeCallback
			this.videoName = videoName;
			this.hasDownloaded = true;
			this.setMessageWithType("success", "Your audio is ready to be downloaded", false)
		}, (error: string) => {
			// errorCallback
			this.setMessageWithType("danger", error)
			this.resetEverything()
		}, () => {
			// disconnectCallback
			this.disconnected = true
		}, () => {
			// reconnectCallback
			this.disconnected = false
		}, () => {
			// maintenanceStartCallback
			this.maintenance = true
		}, () => {
			// maintenanceEndCallback
			this.maintenance = false
		}, this.notificationEnabled)
		Notification.requestPermission(result => {
			this.notificationEnabled = result == 'granted';
		});
	}

	onSubmit(data: NgForm) {
		const match: RegExpMatchArray | null = data.value.link.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(shorts\/)|(watch\?))\??v?=?([^#&?]*).*/);
		if (match && match[8].length == 11) {
			this.videoId = match[8]
			if (this.videoId && /^[a-zA-Z0-9-_]{11}$/.test(this.videoId)) {
				this.socketIO?.initiateDownload(this.videoId);
				this.isConverting = true;
				data.reset();
				return;
			}
		}
		this.setMessageWithType("danger", "Video Link is Invalid")
		data.reset();
	}

	checkAndDownload() {
		this.setMessageWithType("warning", "Checking File...", false)
		this.isDownloading = true;
		this.subscription = this.downloadService.checkIfMp3FileExists(this.videoName).subscribe(result => {
			this.isDownloading = false;
			if (result.status) {
				this.setMessageWithType("success", "Download Successful")
				window.location.href = `${this.url}/download/${this.videoName}`
			} else {
				this.setMessageWithType("danger", result.message)
			}
		}, error => {
			this.isDownloading = false;
			this.setMessageWithType("danger", "Some Unknown Error Occurred")
			console.error(error)
			this.resetEverything()
		});
	}

	setMessageWithType(type: "success" | "warning" | "danger", text: string, autoDismiss = true) {
		this.message = { type, text }
		if (autoDismiss)
			setTimeout(() => this.message.text = "", 5000)
	}

	resetEverything(): void {
		this.isConverting = false;
		this.videoId = "";
		this.videoName = ""
		this.hasDownloaded = false;
		this.progress = 0;
		this.remTime = { mins: 0, secs: 0 }
		this.speed = 0;
	}

	ngOnDestroy(): void {
		if (this.subscription) {
			this.subscription.unsubscribe()
		}
	}

}
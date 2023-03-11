import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

export class SocketIO {

	socket: Socket;

	videoId: string = '';
	id: string = '';
	private notificationEnabled: boolean = false;

	constructor(private progressCallback: (progress: number, remainingTime: number, speed: number) => void, private completeCallback: (videoName: string) => void, private errorCallback: (message: string) => void, private disconnectCallback: () => void, private reconnectCallback: () => void, private maintenanceStartCallback: () => void, private maintenanceEndCallback: () => void, private permission: boolean) {
		this.notificationEnabled = permission;
		this.socket = io(environment.baseURL);
		this.socket.on('connect', () => {
			console.warn("Connected");
			this.id = this.socket.id;
			reconnectCallback();
		});
		this.socket.on('disconnect', (reason) => {
			console.error("Disconnected");
			if (reason && reason == 'transport close') {
				disconnectCallback()
			}
		});
		this.socket.on('maintenance-start', () => {
			maintenanceStartCallback()
		});
		this.socket.on('maintenance-end', () => {
			maintenanceEndCallback()
		});
		this.socket.on('download-progress', ({ videoId, progress, remainingTime, speed }) => {
			if (this.videoId == videoId)
				progressCallback(progress, remainingTime, speed);
		});
		this.socket.on('download-complete', ({ videoId, videoName }) => {
			if (this.videoId == videoId) {
				completeCallback(videoName);
				this.cancelOrCompleteDownload(videoId)
			}
			if (this.notificationEnabled) {
				navigator.serviceWorker.getRegistration().then(notification => {
					const n = notification?.showNotification("Conversion Completed!", { body: 'Your Audio is now Ready for Downloading :)', icon: "../../favicon.ico" })
				})
			}
		});
		this.socket.on('download-error', ({ videoId, error }) => {
			if (this.videoId == videoId) {
				errorCallback(error)
				this.cancelOrCompleteDownload(videoId)
			}
		});
	}

	initiateDownload(videoId: string): void {
		this.videoId = videoId
		if (this.socket != null)
			this.socket.emit('download-initiate', videoId);
	}

	cancelOrCompleteDownload(videoId: string): void {
		if (this.socket != null)
			this.socket.emit('download-cancel-or-complete', videoId);
	}
}
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

export class SocketIO {

	socket: Socket;

	videoId: string = '';
	id: string = '';
	private notificationEnabled: boolean = false;

	public set username(v: string) {
		this.videoId = v;
	}
	public get value(): string {
		return this.videoId;
	}

	constructor(private n: string, private progressCallback: Function, private completeCallback: Function, private permission: boolean) {
		this.videoId = n;
		this.notificationEnabled = permission;
		this.socket = io(environment.baseURL, { query: { videoId: this.videoId } });
		this.socket.on('connect', () => {
			console.warn("Connected");
			this.id = this.socket.id;
		});
		this.socket.on('disconnect', () => {
			console.error("Disconnected");
		});
		this.socket.on('download-progress', ({ videoId, progress, remainingTime, speed }) => {
			// console.warn({ videoId, progress });
			if (this.videoId == videoId)
				progressCallback(progress, remainingTime, speed);
		});
		this.socket.on('download-complete', ({ videoId }) => {
			console.error({ videoId });
			if (this.notificationEnabled && this.videoId == videoId
				// && !document.hasFocus()
			) {
				this.socket.disconnect();
				completeCallback();
				navigator.serviceWorker.getRegistration().then(notification => {
					const n = notification?.showNotification("[YTD] Conversion Complete!", { body: 'Your audio is now ready for downloading', icon: "../../favicon.ico" })
				})

			}
		});
		this.socket.on('download-error', ({ videoId, error }) => {
			// console.warn({ videoId, progress });
			if (this.videoId == videoId)
				console.error(error);
		});
	}

	initiateDownload(): void {
		if (this.socket != null)
			this.socket.emit('download-initiate');
	}
}
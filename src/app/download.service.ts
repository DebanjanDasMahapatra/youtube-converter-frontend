import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor(private http: HttpClient) { }

  checkIfMp3FileExists(name: String): Observable<any> {
    return this.http.get<any>(environment.baseURL + "/check-file/" + name);
  }

}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor(private http: HttpClient) {
  }
  getMp3(id: String): Observable<any> {
    const url = "/initiate-download/" + id;
    return this.http.get(environment.baseURL + url);
  }

  getMp3download(id: String): Observable<any> {
    const url = "/download/" + id;
    return this.http.get(environment.baseURL + url);
  }
}

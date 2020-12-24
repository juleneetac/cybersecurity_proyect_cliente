import { Injectable } from '@angular/core';
import { Ambiente } from './ambiente';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class BancoService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });
  ambiente: Ambiente;  

  constructor(private http: HttpClient) {
    this.ambiente = new Ambiente();
   }

   ///////////////////////////////////FIRMA CIEGA/////////////////////////////////////////
  postSignCiega(body: object) {
    return this.http.post(this.ambiente.urlBanco + '/signCiega', body);
    }


  getDinero(body: object){
    return this.http.post(this.ambiente.urlBanco + '/getDinero', body);
  }

}

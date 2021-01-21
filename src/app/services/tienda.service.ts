import { Injectable } from '@angular/core';
import { Ambiente } from './ambiente';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import { Observable } from 'rxjs';
import { modelUser } from '../models/modeluser';

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });
  ambiente: Ambiente;  

  constructor(private http: HttpClient) {
    this.ambiente = new Ambiente();
   }
////////////////////////logins////////////////////////////////////////////////////
   login1(login1: modelUser): Observable<modelUser>{                               //el login sin secret sharing
    return this.http.post<modelUser>(this.ambiente.urlBanco + '/login1', login1);// DEVUELVE UN MODELUSUARIO + SU TOKEN !!!
  }

  login2sharing(login2: Object){ //: Observable<modelUser>{                               //el login sin secret sharing
    return this.http.post<modelUser>(this.ambiente.urlBanco + '/login2shared', login2);// DEVUELVE UN Object + SU TOKEN !!!
  }
/////////////////////////////////////////Verificar dinero(pagar en la tienda)///////////////////////////////////////////////////
  postpagarverificar(carterafirmada: object) {
      return this.http.post(this.ambiente.urlTienda + '/postpayverify', carterafirmada);
    }
  }






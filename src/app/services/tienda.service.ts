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
////////////////////////varios////////////////////////////////////////////////////
   login1(login1: modelUser): Observable<modelUser>{                               //el login sin secret sharing
    return this.http.post<modelUser>(this.ambiente.urlBanco + '/login1', login1);// DEVUELVE UN MODELUSUARIO + SU TOKEN !!!
  }

  login2sharing(login2: Object){ //: Observable<modelUser>{                               //el login sin secret sharing
    return this.http.post<modelUser>(this.ambiente.urlBanco + '/login2shared', login2);// DEVUELVE UN MODELUSUARIO + SU TOKEN !!!
  }

   /////////////////////////AES/////////////////////////////////////
   postCaso(addcaso: string, iv :string){//: Observable<void> 
    let c = {addcaso , iv}
    console.log(c)
    return this.http.post(this.ambiente.urlTienda + '/addPost', {addcaso, iv, headers: this.headers});
  }

  getFrase(): Observable<Object>{  //esto es el observable. me da un array de studnets
    return this.http.get<Object>(this.ambiente.urlTienda+ '/getFrase');  
    }

 /////////////////////////RSA/////////////////////////////////////
  postCasoRSA(body: object) {
  return this.http.post(this.ambiente.urlTienda + '/addPostRSA', body);
    }
  
  postSignRSA(body: object) {
    return this.http.post(this.ambiente.urlTienda + '/sign', body);
    }

  getFraseRSA() {
    return this.http.get(this.ambiente.urlTienda + '/getFraseRSA');
    }

  postpubKey(body: object) {  //send publicKey del cliente al servidor para encryptar mensaje
      return this.http.post(this.ambiente.urlTienda + '/postpubKey', body);
        }

  getpublicKeyRSA() {
    return this.http.get(this.ambiente.urlBanco + '/publickey');
    }

 /////////////////////////////// SECRET SHARING ///////////////////////////////////////////////
  postsecretSharing(shares: object) {
    return this.http.post(this.ambiente.urlTienda + '/postsecretsharing', shares);
  }
}

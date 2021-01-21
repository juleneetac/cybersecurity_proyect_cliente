import { Component, OnInit } from '@angular/core';
import { modelUser } from 'src/app/models/modeluser';
import { modelStorageuser } from 'src/app/models/modelstorageuser';
import { TiendaService } from 'src/app/services/tienda.service';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import { StorageComponent } from 'src/app/storage/storage/storage.component';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  user: modelUser;
  storageuser: modelStorageuser;
  username: string;
  password: string;

  constructor(
    private tiendaService: TiendaService, 
    private router: Router, 
    private toaster: NotificationService, 
    public storage: StorageComponent
    ) { }


  ngOnInit() {
    //this.storage.clearStorage()
  }

  goMain() {
    this.router.navigateByUrl("main")
  }

  login1(){
    let credencial: modelUser = new modelUser(this.username, this.password, 0)
  
    this.tiendaService.login1(credencial).subscribe(
      async res =>{
        const toast = await this.toaster.showSuccess("Correct Login", "Tienda Online")
        const response: any = res;
        this.storageuser = new modelStorageuser (response.username, response.jwt )
        console.log(this.storageuser);


        /////aqui derivamos una clave para guardarla en localstorage
       let salt = crypto.getRandomValues(new Uint8Array(16));
       let derivedKey = await deriveKey(salt, this.password)   //creo la key para poder cifrar despues el dinero de la cartera
       let exported = await exportCryptoKey(derivedKey)
       await this.storage.savederivedKey(JSON.stringify(buf2hex(exported)));  //aqui a parter de pasarlo a json le hago un export
       await this.storage.saveSalt(JSON.stringify(buf2hex(salt)));
      

        //Save info locally
        await this.storage.saveToken(this.storageuser.jwt);
        await this.storage.saveUser(JSON.stringify(this.storageuser));

        
  
        await this.goMain();    //Que al loguearte vayas al Main

      },
      err => {
        console.log(err);
        this.handleError(err);
      });
  }

  //errores
private async handleError(err: HttpErrorResponse) {
  if (err.status == 500) {
    const toast = await this.toaster.showError("Internal error", "Tienda Online")
  } 
  else if  (err.status == 404) {
    console.log('nose');
    const toast = await this.toaster.showError("No user registered", "Tienda Online")
  }
  else if  (err.status == 402) {
    console.log('salida');
    const toast = await this.toaster.showError("Mal password", "Tienda Online")
  }

  }



}

////////////////////////////////cosas utiles/////////////////////////////////////
function getKeyMaterial(password) {                   //convierte la clave
  let enc = new TextEncoder();
  return  window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
}


async function deriveKey(salt, password) {           
  let keyMaterial = await getKeyMaterial(password);
  let key = await window.crypto.subtle.deriveKey(
    {
      "name": "PBKDF2",
      salt: salt,
      "iterations": 100000,
      "hash": "SHA-256"
    },
    keyMaterial,
    { "name": "AES-GCM", "length": 256},
    true,
    [ "encrypt", "decrypt" ]
  );
  return key;
}

async function exportCryptoKey(key) {       //para converirlo a arraybuffer
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return exported;
}


function buf2hex(buffer) { // ArrayBuffer to hex
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

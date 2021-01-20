import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { modelStorageuser } from 'src/app/models/modelstorageuser';
import { modelUser } from 'src/app/models/modeluser';
import { NotificationService } from 'src/app/services/notification.service';
import { TiendaService } from 'src/app/services/tienda.service';
import { StorageComponent } from 'src/app/storage/storage/storage.component';

@Component({
  selector: 'app-loginshared',
  templateUrl: './loginshared.component.html',
  styleUrls: ['./loginshared.component.css']
})
export class LoginsharedComponent implements OnInit {
  usershared: Object;
  storageuser: modelStorageuser;
  username: string;
  shares0: string;//[] = []
  shares1: string;
  shares2: string;
  shares3: string;
  secretsharingtext;

  constructor(
    private tiendaService: TiendaService, 
    private router: Router, 
    private toaster: NotificationService, 
    public storage: StorageComponent
  ) { }

  ngOnInit() {
  }

  goMain() {
    this.router.navigateByUrl("main")
  }

  loginprueba(){
    console.log(this.username)
    //let credencial: modelUser = new modelUser(this.username, this.shares, 0, "")
  }

  login2(){
      //Secret sharing jul
      // 08013617ea9cb06c5248290ae3c62745f97f04ec45c2e9dfa1c8df86a46a126d9a8a
      // 08026c2ec9257dd8a4905214db924e38ef5108718a06cf1d5f22a38b5577246e29ac
      // 08035a3923b9cdb4f6d87b1e38556913164b0cf1cfb126a8fe8f7c7bf17c366fb345
      // 0804d85c8f4afaad553da428ab3a9cc2c30d105609938384beeb5b91aa4d486852e0

      //Secret sharing harjot
      // 0801a370d5f7fe7209ff336abfde23210151e51f9202eac887808c37151b56b2d45e
      // 08025be0b7f3e1e412e366d463a246f0020dd78a399bc93313b205f42a95accdb519
      // 0803f89062041f961b1c55bedc7d65bf033932f9abec2391945789b53feffa136124
      // 0804b6dd73fbdfd524dbccb5c65a8c4f04b5b3bd72b48fd826d60a6f549445337797
    let usershared = {
      username: this.username,
      shares:[this.shares0, this.shares1, this.shares2, this.shares3],
       }
   
  
    this.tiendaService.login2sharing(usershared).subscribe(
      async res =>{
        // this.secretsharingtext = res["recovered"]    // no recivimos el codugo de vuelta
        // console.log(this.secretsharingtext);

        const toast = await this.toaster.showSuccess("Correct Login", "Tienda Online")
        const response: any = res;
        this.storageuser = new modelStorageuser (response.username, response.jwt )
        console.log(this.storageuser);

        /////aqui derivamos una clave para guardarla en localstorage
        let shares = [this.shares0, this.shares1, this.shares2, this.shares3]
        let salt = crypto.getRandomValues(new Uint8Array(16));
        let i = 0;
        console.log(shares)

        while(i < 4) {
          if (shares[i] == undefined  || shares[i] == ""){  //Solo para comprobar por si acaso se queda en undefined alguna del array
            shares.splice(i, 1)  //quita uno elemento de la posicion i 
            if(shares.length <= i ){
              i = 6;   //numero cualquiera mayor que el lenght del shares[] para que se salga del while
            }
          }
          else{
            i++;
          }
        }
        let derivedKey = await deriveKey(salt, shares[0])   //creo la key para poder cifrar despues el dinero de la cartera
        let exported = await exportCryptoKey(derivedKey)
        await this.storage.savederivedKey(JSON.stringify(buf2hex(exported)));  //aqui a parter de pasarlo a json le hago un export
        await this.storage.saveSalt(JSON.stringify(buf2hex(salt)));
       ////////////////////////
        

        //Save info locally
        await this.storage.saveToken(this.storageuser.jwt);
        await this.storage.saveUser(JSON.stringify(this.storageuser));
        
  
        await this.goMain();    //Que al loguearte vayas al Main
      },
      
      (err) => {
        console.log("Claves incorrectas", err);
        this.handleError(err);
      }
    );
        
  }

  //errores
private async handleError(err: HttpErrorResponse) {
  if (err.status == 500) {
    const toast = await this.toaster.showError("Input lenght incorrect", "Tienda Online")
  } 
  else if  (err.status == 404) {
    console.log('nose');
    const toast = await this.toaster.showError("No user registered", "Tienda Online")
  }
  else if  (err.status == 402) {
    console.log('salida');
    const toast = await this.toaster.showError("Mal password", "Tienda Online")
  }
  // else if  (err.status == 401) {
  //   console.log('salida');
  //   const toast = await this.toaster.showError("Usuario vacio", "Tienda Online")
  // }
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

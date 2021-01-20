import { Component, OnInit } from '@angular/core';
import { TiendaService } from 'src/app/services/tienda.service';
import { BancoService } from 'src/app/services/banco.service';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Console } from 'console';
import * as myrsa from 'class_RSA/src/index.js';
import * as bcu from 'bigint-crypto-utils';
import * as bc from 'bigint-conversion';
import { RSA  as classRSA, RSA} from 'src/app/models/rsa';
import { PublicKey  as Classpublickey} from "src/app/models/public-key";
import * as objectSha from 'object-sha'
import * as paillierBigint from 'paillier-bigint'
import { split, combine } from 'shamirs-secret-sharing'
import { StorageComponent } from 'src/app/storage/storage/storage.component';
import { modelUser } from 'src/app/models/modeluser';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
//NOTAS IMPORTANTES para lo del Buffer:
//Poner esto en el polyfills.ts
//(window as any).global = window;
//(window as any).global.Buffer = (window as any).global.Buffer || require('buffer').Buffer;

//En el tsconfig.app.json poner despues de haber instalado node:
//"types": [ "node" ],
//"typeRoots": [ "../node_modules/@types" ]

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  rsa  = new classRSA;
  payquantity: number;    //variable para la cantidad que pagamos
  bankquantity: number;   //variable para la cantidad que pedir
  name: string; //textbox de encrypt RSA y firmar RSA
  sign: string; //textbox de firmar Ciega
  decrypted: string;  //resultado RSA de lo qiue envias al server
  decrypsen;          //resultado RSA de la frase que coges del server
  verifiedRSA: string;  //re4sultado de lo que fi9rmas RSA
  verifiedCiega: string;  //resultado de lo que firmas FIRMA CIEGA
  secretsharingtext;  //resultado del secretsharing
  publicKeyserver;   //publicKey del servidor  ¡¡¡¡¡¡¡!!!!!!
  body;
  iv;  //iv de AES
  _ONE: BigInt = BigInt(1);
  localperfil: modelUser;
  localpublickeyserver;
  localcarteracifrada = [];
  carterafirmada = []; //id de monedas firmadas
  keyhex;  //clave que está en localstorage y la cogemos
  keybuff; //imported key
  salt; //el salt que le pasamos al hacer el login
  passwordsacar;   //lo que introducire en el textbox para sacar dinero a tu cartera y luego se derivara en una clave para comparar
  passwordpay;      //lo que introducire en el textbox para pagar a la tienda
  //////////////////////para secretsharing hemos cogido siempre la 
  parapagar;
  


  constructor(
    private tiendaService: TiendaService, 
    private bancoService: BancoService, 
    private router: Router,
    private storage: StorageComponent,
    private toaster: NotificationService
        ) { }

    // SI NO FIUNCIONA CAMBIAR TODO LO DE localcarteracifrada POR carterafirmada

  async ngOnInit() {
    this.localperfil = JSON.parse(this.storage.getUser());
    this.localpublickeyserver =  JSON.parse(this.storage.getPublicKey())
    this.localpublickeyserver = new Classpublickey(bc.hexToBigint(this.localpublickeyserver.e),bc.hexToBigint(this.localpublickeyserver.n))
    console.log("La clave pública del servidor (banco): ")
    console.log(this.localpublickeyserver)
    let keyPair = await this.rsa.generateKeys();   //me da el keyPair del client
    //console.log(keyPair);  //claves del cliente
    //console.log(this.rsa.publicKey);
    //await this.getPublicKeyrsa();
    //await this.postpubKeyRSA();
    if (JSON.parse(this.storage.getCarteraCifrada()) == null){  //si iniciamos la aplicacion todavia no exisistira la cartera por tanto
      this.localcarteracifrada = []                             //esto lo determinará a 0
    }
    else{
      this.localcarteracifrada =  JSON.parse(this.storage.getCarteraCifrada())  //si ya hay moneda en el local storage las cogera
    }

    this.keyhex =  JSON.parse(this.storage.getderivedKey())
    this.salt =  JSON.parse(this.storage.getSalt())
    this.iv = crypto.getRandomValues(new Uint8Array(16));
    console.log("todo ok")
    
  }


/////////////////////////////////////////RSA+FIRMA CIEGA(pedir dinero)///////////////////////////////////////////////////
  async get1euro() {    // get de 1€ que tendrá firma ciega incorporada
    //let cantidadbanco = 5;   //this.quantity; 
    let idmoneda = [];
    let i = 0; 
    let blindedm = [];
    let n = this.localpublickeyserver.n
    let r = bcu.randBetween(n) //ya es un bigint
    let renc;
    let bigintm = [];
    let blindedmhex = [];

    let derivedKey = await deriveKey(hexToBuf(this.salt), this.passwordsacar)   //creo la key para poder cifrar despues el dinero de la cartera
    let derivedKeyhex = buf2hex(await exportCryptoKey(derivedKey))
    console.log("la que yo pongo (sacar): " + derivedKeyhex)
    console.log("la del local stoarge (sacar): " + this.keyhex)
    if(this.keyhex == derivedKeyhex){

      while (i < this.bankquantity){
        idmoneda[i]= await bcu.randBytes(32);
        idmoneda[i]= buf2hex(idmoneda[i])

        bigintm [i]  = (bc.textToBigint(idmoneda[i]))
        // cegado
        renc= this.localpublickeyserver.encryptsinconv(r) 
        blindedm[i] = (bigintm[i]*renc)%n 
        blindedmhex[i] = bc.bigintToHex(blindedm[i])   // el array pero en hexadecimal
        i++;
      } 

        
      let parafirmar = {
        cantidad: this.bankquantity,
        firmame: blindedmhex
      };  
    
      // Print the response to see if the response coincides with the message  
      this.bancoService.getDinero(parafirmar).subscribe(
          async (data) => {
            if(data['msg']== "trabaja mas vago") //ojo no cambiar mensaje ojo
            {
              console.log(data['msg'])
            }
            else{
              let s = data['msg']
              let x = 0; //para nuevas monedas
              let y = this.localcarteracifrada.length; //para el total de monedas incluyendo antiguas
        
              let suma = this.localcarteracifrada.length+s.length
            while ((y < suma) && (x<s.length)){ //esto podria habersehecho con un push pero bueno
              s[x] = bc.hexToBigint(s[x])
              this.localcarteracifrada[y] =bc.bigintToHex((s[x]*bcu.modInv(r,n))%n) 
              y++;
              x++;
            }
            console.log("Se han firmado cegadamente OK")
            console.log("Tienes este dinero en la cartera: "+ this.localcarteracifrada.length)
        
            ////////////// cifrar la cartera     
            this.keybuff = await crypto.subtle.importKey('raw', hexToBuf(this.keyhex), 'AES-GCM', false, ['encrypt', 'decrypt'])
            let i = 0
            let encrypted =[]
            while (i < this.localcarteracifrada.length){
              let encoded = getMessageEncoding(this.localcarteracifrada[i])
              encrypted[i] = await crypto.subtle.encrypt({
                name: "AES-GCM",
                iv: this.iv,
              },
              this.keybuff,
              encoded);
              this.localcarteracifrada[i] =new Uint8Array(encrypted[i]);  //EncryptedDataArray
              this.localcarteracifrada[i]=buf2hex(this.localcarteracifrada[i]);            //EncryptedDataString
              i++
            }        
            /////////////

            this.storage.saveCarteraCifrada(JSON.stringify(this.localcarteracifrada));
            this.localcarteracifrada =  JSON.parse(this.storage.getCarteraCifrada())
          }
          },
          (err) => {
            console.log("err", err);
          }
          );
        }
      else{
        const toast = this.toaster.showError("No puedes sacar dinero", "Incorrect password")
      }
  }

/////////////////////////////////////////Verificar dinero(pagar en la tienda)///////////////////////////////////////////////////
async pagar(){                //esto se le envia a la tienda y no al banco
  let cantidadtienda = this.payquantity;
  let i =0
  let cosasapagar = []  //esto son las monedas con las que pagamos

  let y = cantidadtienda  /////////////
  

  if(this.payquantity <= this.localcarteracifrada.length){  //miramos que lo que se va a comprar no sea mayor que lo que tenemos en cartera

    let derivedKey = await deriveKey(hexToBuf(this.salt), this.passwordpay)   //creo la key para poder cifrar despues el dinero de la cartera
    let derivedKeyhex = buf2hex(await exportCryptoKey(derivedKey))
    console.log("la que yo pongo (pagar): " + derivedKeyhex)
    console.log("la del local stoarge (pagar): " + this.keyhex)
    if(derivedKeyhex == this.keyhex){
      while( i < cantidadtienda)
      {
        //para descifrar las monedas que vamos a pagar y que estan cifradas 
        cosasapagar[i] = hexToBuf(this.localcarteracifrada.pop())
        //cosasapagar[i] = hexToBuf(this.localcarteracifrada[y]) 
        cosasapagar[i] = await crypto.subtle.decrypt({
              name: "AES-GCM",
              iv: this.iv
            }, 
            this.keybuff ,
            cosasapagar[i]);
        
        cosasapagar[i]= ab2str(cosasapagar[i]);      
        i++
      }

      this.storage.saveCarteraCifrada(JSON.stringify(this.localcarteracifrada));

      console.log("Monedas que se vana  pagar: ")
      console.log(cosasapagar)
      console.log("Tienes este dinero restante en la cartera: "+ this.localcarteracifrada.length)
      let paraverificar = {
        cantidad: cantidadtienda,
        verificame: cosasapagar,
      };  

      this.tiendaService.postpagarverificar(paraverificar).subscribe(
        (data) => {
          let respuesta = data['msg']
          console.log(respuesta)
          //let cant = data['intpagar']////////////para que la quite cuandon compruebq que es valida
          //let i = 0;/////////////
          // this.parapagar = this.localcarteracifrada.reverse
          // while(i<cant){/////////////
          // this.parapagar[i] = this.parapagar.pop()
          // i++
          // }/////////////
          
        },
        (err) => {
          console.log(err.error.msg)
          console.log("err", err);
        }
        );
        
      }
      else{
        const toast = this.toaster.showError("No puedes pagar", "Incorrect password")
      }
  }
  else{
    console.log("No tienes suficiente dinero en cartera, pídele al banco")
  }

  
}
///////////////////////////////////////Log out clear storage//////////////////////

async logout() {            //no lo uso porque ne el html pongo directamente irme a la ruta de home
  this.router.navigateByUrl("")
  this.storage.clearStorage()
}


}

////////////////////////////////////////COSAS UTILES///////////////////////////////////////////////////

function hexToBuf (hexStr) {  //pasar de hexadecimal a Buffer
  hexStr = !(hexStr.length % 2) ? hexStr : '0' + hexStr
  return Uint8Array.from(hexStr.trimLeft('0x').match(/[\da-f]{2}/gi).map((h) => {
      return parseInt(h, 16)
    })).buffer
}

function buf2hex(buffer) { // ArrayBuffer to hex
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function getMessageEncoding(texto : string) {
  let message = texto;
  let enc = new TextEncoder();
  return enc.encode(message);
}

function getArrayEncoding(texto : string) {  //la usaremos para hacer encode de un array usando un while
  let message = texto;
  let enc = new TextEncoder();
  return enc.encode(message);
}

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





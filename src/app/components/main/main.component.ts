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
  quantity: number;   //variable para la cantidad que pedir
  nameaes: string; //textbox de AES
  name: string; //textbox de encrypt RSA y firmar RSA
  sign: string; //textbox de firmar Ciega
  resultStr= ''; //resultado AES
  decrypted: string;  //resultado RSA de lo qiue envias al server
  decrypsen;          //resultado RSA de la frase que coges del server
  verifiedRSA: string;  //re4sultado de lo que fi9rmas RSA
  verifiedCiega: string;  //resultado de lo que firmas FIRMA CIEGA
  secretsharingtext;  //resultado del secretsharing
  publicKeyserver;   //publicKey del servidor  ¡¡¡¡¡¡¡!!!!!!
  body;
  iv;  //iv de AES
  keyhex = '89a1f34a907ff9f5d27309e73c113f8eb084f9da8a5fedc61bb1cba3f54fa5de'
  _ONE: BigInt = BigInt(1);
  localperfil: modelUser;
  localpublickeyserver;
  serverN;
  serverE;


  constructor(
    private casoService: TiendaService, 
    private bancoService: BancoService, 
    private storage: StorageComponent
    ) { }

  async ngOnInit() {
    this.localperfil = JSON.parse(this.storage.getUser());
    this.localpublickeyserver =  JSON.parse(this.storage.getPublicKey())
    this.localpublickeyserver = new Classpublickey(bc.hexToBigint(this.localpublickeyserver.e),bc.hexToBigint(this.localpublickeyserver.n))
    console.log("La ckave pública del servidor (banco): ")
    console.log(this.localpublickeyserver)
    let keyPair = await this.rsa.generateKeys();   //me da el keyPair del client
    //console.log(keyPair);  //claves del cliente
    //console.log(this.rsa.publicKey);
    //await this.getPublicKeyrsa();
    //await this.postpubKeyRSA();
    console.log("todo ok")
  }


/////////////////////////////////////////RSA+FIRMA CIEGA(pedir dinero)///////////////////////////////////////////////////
  async get1euro() {    // get de 1€ que tendrá firma ciega incorporada
    let cantidad = 5;   //this.quantity; 
    let idmoneda = [];
    let i = 0; 
    let blindedm = [];
    let n = this.localpublickeyserver.n
    let r = bcu.randBetween(n) //ya es un bigint
    let renc;
    let blindedmhex = [];

    while (i < cantidad){
      idmoneda[i]= await bcu.randBytes(32);
      idmoneda[i]= buf2hex(idmoneda[i])

      let bigintm = [];
      bigintm [i]  = (bc.textToBigint(idmoneda[i]))
      // cegado
      renc= this.localpublickeyserver.encryptsinconv(r) 
      blindedm[i] = (bigintm[i]*renc)%n 
      blindedmhex[i] = bc.bigintToHex(blindedm[i])   // el array pero en hexadecimal
      i++;
    } 

       
    let parafirmar = {
      cantidad: cantidad,
      firmame: blindedmhex
    };  
    //const signedbm= this.rsa.privateKey.signsinconv(blindedm) server 
   
    // Print the response to see if the response coincides with the message  
    this.bancoService.getDinero(parafirmar).subscribe(
        (data) => {
          let s = data['msg']
          let signedm = [];
          let verifiedm = [];
          //let s = bc.hexToBigint(data['msg']);
          let y = 0;
          while (y < s.length){
            s[y] = bc.hexToBigint(s[y])
            signedm[y] = (s[y]*bcu.modInv(r,n))%n
            verifiedm[y] = bc.bigintToText(this.localpublickeyserver.verify(signedm[y]))  //esto ,lo hara la tienda que es quien verifique la moneda
            y++;
          }
          console.log("Se han firmado cegadamente OK: aqui la prueba: ")
          console.log(verifiedm)
          console.log(idmoneda)

          // if (verifiedm ==this.sign) //SI EL MENSAJE ES IGUAL AL FIRMADO
          // this.verifiedCiega = verifiedm;
          // else this.verifiedCiega = "NO SE HA VERIFICADO CON EXITO"
        },
        (err) => {
          console.log("err", err);
        }
        );
  }


}

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



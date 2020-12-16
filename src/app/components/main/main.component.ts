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


  constructor(
    private casoService: TiendaService, 
    private bancoService: BancoService, 
    private storage: StorageComponent) { }

  async ngOnInit() {
    this.localperfil = JSON.parse(this.storage.getUser());
    let keyPair = await this.rsa.generateKeys();   //me da el keyPair del client
    console.log(keyPair);
    //console.log(this.rsa.publicKey);
    await this.getPublicKeyrsa();
    await this.postpubKeyRSA();
    console.log("todo ok")
  }

 /////////////////////////AES/////////////////////////////////////
  public async postCaso(event){
    let keybuff =  await crypto.subtle.importKey('raw', hexToBuf(this.keyhex), 'AES-CBC', false, ['encrypt'])
    console.log("has escrito AES: "+ this.nameaes)
    let encoded = getMessageEncoding(this.nameaes)

    this.iv = crypto.getRandomValues(new Uint8Array(16));
    let encrypted = await crypto.subtle.encrypt({
      name: "AES-CBC",
      iv: this.iv
    },
    keybuff,
    encoded);
    console.log("encriptado : " +  encrypted)
    let EncryptedDataArray=new Uint8Array(encrypted);
    let EncryptedDataString=ab2str(EncryptedDataArray);
    console.log("result" + EncryptedDataString)
    console.log("encriptado : " +  EncryptedDataString)
    console.log("iv : " +  this.iv)
    let ivStr = ab2str(this.iv) 
    console.log("ivStr "+ ivStr)
    //lom que hace el post
    this.casoService.postCaso(EncryptedDataString, ivStr).subscribe(
      res =>console.log(res),
      err=> console.log(err)
      );
  }

  public async getSentence(){   // como es async sera todo promise OJO
    let encrypted:ArrayBuffer;
    let keybuff =  await crypto.subtle.importKey('raw', hexToBuf(this.keyhex), 'AES-CBC', false, ['decrypt'])
    this.casoService.getFrase().subscribe(
      async (data) => { 
        this.body = data;
        console.log(this.body);
        encrypted = hexToBuf(this.body.encrypted)
        this.iv = hexToBuf(this.body.ivhex)
        let result = await crypto.subtle.decrypt({
           name: "AES-CBC",
           iv: this.iv
          }, 
         keybuff ,
         encrypted);
        this.resultStr= String.fromCharCode.apply(null, new Uint8Array(result));
        console.log("Frase: "+ this.resultStr)
        this.deleteSentence()

      },
      (err) => {
        console.log("err", err);
      }
    )  //el subject service es el declarado arriba en private
  }


  public deleteSentence(){   //la frase se borra pasados 3 segundos
    setTimeout(
      () => {
        this.resultStr = "", this.body = ""}, 3000);
    }


 /////////////////////////RSA/////////////////////////////////////
  async getSentencersa() {            //OK 
    //await this.postpubKeyRSA()
    this.casoService.getFraseRSA().subscribe(
       async (data) => {
          this.body = data;
          this.decrypsen = await this.rsa.privateKey.decrypt(this.body.msg)       
          console.log(this.decrypsen)  
          //this.deleteSentence()
        },
        (err) => {
          console.log("err", err);
        }
      );
    }
  
  
  async postCasorsa() {   //OK 
      let c = await this.publicKeyserver.encrypt(this.name);  
      let message = {
        msg: bc.bigintToHex(c)
      };
      // Print the response to see if the response coincides with the message
      this.casoService.postCasoRSA(message).subscribe(
          (data) => {
            this.decrypted = bc.bigintToText(bc.hexToBigint(data['msg']));
            console.log("has escrito RSA: "+ this.decrypted)
          },
          
          (err) => {
            console.log("err", err);
          }
        );
    }

   
  async signMsgrsa() {  // esto es sign de rsa
    let m = bc.bigintToHex(bc.textToBigint(this.name));
    let message = {
      msg: m
    };

    // Print the response to see if the response coincides with the message  
    this.casoService.postSignRSA(message).subscribe(
        (data) => {
          let s = bc.hexToBigint(data['msg']);
          let m = bc.bigintToText(this.publicKeyserver.verify(s));
          this.verifiedRSA = m;
        },
        (err) => {
          console.log("err", err);
        }
        );
   }

    async postpubKeyRSA() {
      //console.log(this.rsa.publicKey)
      //bc.bigintToText(this.rsa.publicKey);
      let publicclient = {
        e: bc.bigintToHex(this.rsa.publicKey.e),
        n: bc.bigintToHex(this.rsa.publicKey.n)
      }
      this.casoService.postpubKey(publicclient).subscribe(
          (data) => {
            console.log(data);
          },
          
          (err) => {
            console.log("err", err);
          }
        );
    }
    async getPublicKeyrsa() {  //pide la publicKey del servidor
      
      this.casoService.getpublicKeyRSA().subscribe(
          (data) => {
            this.publicKeyserver = new Classpublickey(bc.hexToBigint(data["e"]),bc.hexToBigint(data["n"]))
            console.log(this.publicKeyserver);
          },
          (err) => {
            console.log("err", err);
          }
        );
    }

/////////////////////////////////////////FIRMA CIEGA///////////////////////////////////////////////////
async getSentenceCiega() {            //OK 
  //await this.postpubKeyRSA()
  if(this.testblindsignature())
  {
    console.log("blind signature ok")
  }
  else console.log("blind signature ko")

  this.casoService.getFraseRSA().subscribe(
     async (data) => {
        this.body = data;
        //console.log("MI PUBLIC KEY : "+ this.rsa.publicKey.e);
        //console.log("MI Private KEY : "+ this.rsa.privateKey.d);
        //console.log("the body : "+ this.body.msg)
        this.decrypsen = await this.rsa.privateKey.decrypt(this.body.msg)       
        console.log(this.decrypsen)  
        //this.deleteSentence()
      },
      (err) => {
        console.log("err", err);
      }
    );
  }

testblindsignature(){ //firma ciega
    const m = "hello" 
    const bigintm = bc.textToBigint(m)
    // cegado
    const n = this.rsa.publicKey.n
    const r = bcu.randBetween(n) //ya es un bigint
    const renc= this.rsa.publicKey.encryptsinconv(r) 
    const blindedm = (bigintm*renc)%n 
    const signedbm= this.rsa.privateKey.signsinconv(blindedm)
    const signedm= (signedbm*bcu.modInv(r,n))%n
    const verifiedm= bc.bigintToText(this.rsa.publicKey.verify(signedm))

    console.log("m = "+ verifiedm)

    return m ===verifiedm
  }

  async signMsgciega() {  // ESTO FIRMA CIEGA DESDE EL SERVIDOR 
    let m = this.sign;  //textbox de la palabra que pasamos
    const bigintm = bc.textToBigint(m)
    // cegado
    const n = this.publicKeyserver.n
    const r = bcu.randBetween(n) //ya es un bigint
    const renc= this.publicKeyserver.encryptsinconv(r) 
    const blindedm = (bigintm*renc)%n 
    let message = {
      msg: bc.bigintToHex(blindedm)
    };  
    //const signedbm= this.rsa.privateKey.signsinconv(blindedm) server 
   
    // Print the response to see if the response coincides with the message  
    this.bancoService.postSignCiega(message).subscribe(
        (data) => {
          
          let s = bc.hexToBigint(data['msg']);
           const signedm= (s*bcu.modInv(r,n))%n
           const verifiedm= bc.bigintToText(this.publicKeyserver.verify(signedm))
          console.log(verifiedm)
         if (verifiedm ==this.sign) //SI EL MENSAJE ES IGUAL AL FIRMADO
          this.verifiedCiega = verifiedm;
          else this.verifiedCiega = "NO SE HA VERIFICADO CON EXITO"

        },
        (err) => {
          console.log("err", err);
        }
        );
  }




/////////////////////////////// SECRET SHARING ///////////////////////////////////////////////
// Hex de las shares[]
// 08019fb22cf853b58144156692a2824f10bd7592919544193bfcbe4f7dcf6a7a8784
// 08024895d22fc64166e87992a6ea08849d774fd219776877c261bf6d6b966b15f20a
// 080387cfd0d53120ad0badf0249bf4d5720773a17b2df884fd0ecbe2ea689102d9eb
// 08041501c95934ecd4540c0c4afe025f794fed1bcac3c16623e50fd804729f00c2b6
// 080577f901ad989bf4e5a572b88b9926514033f94b2e47680072376e4b2fb22f8a35
// 0806e7877666bb43d8ed33be6ccbddbd4f74d08618bf47e1c102ae3edc2d0030397f
// 0807d5979090b3e0b2fb5bc48e6c38a398d347ee6abd1571e6635c3a6f22bd17ddea

async postsecretSharing() {
  //console.log(this.rsa.publicKey)
  //bc.bigintToText(this.rsa.publicKey);
  let clavescompartidas = {
    shares:["08019fb22cf853b58144156692a2824f10bd7592919544193bfcbe4f7dcf6a7a8784",
            "08024895d22fc64166e87992a6ea08849d774fd219776877c261bf6d6b966b15f20a",
            "080387cfd0d53120ad0badf0249bf4d5720773a17b2df884fd0ecbe2ea689102d9eb",
            "08041501c95934ecd4540c0c4afe025f794fed1bcac3c16623e50fd804729f00c2b6"
            ]
// 080577f901ad989bf4e5a572b88b9926514033f94b2e47680072376e4b2fb22f8a35    solo nos hace falta 4 el resto los dejo comentados
// 0806e7877666bb43d8ed33be6ccbddbd4f74d08618bf47e1c102ae3edc2d0030397f
// 0807d5979090b3e0b2fb5bc48e6c38a398d347ee6abd1571e6635c3a6f22bd17ddea
  };
  this.casoService. postsecretSharing(clavescompartidas).subscribe(
      (data) => {
        this.secretsharingtext = data["recovered"]
        console.log(this.secretsharingtext);
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

function getMessageEncoding(texto : string) {
  let message = texto;
  let enc = new TextEncoder();
  return enc.encode(message);
}

 
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}


import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PublicKey  as Classpublickey} from "src/app/models/public-key";
import * as bc from 'bigint-conversion';
import { StorageComponent } from 'src/app/storage/storage/storage.component';
import { BancoService } from 'src/app/services/banco.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  publicKeyserver;

  constructor(
    private router: Router,
    private bancoService: BancoService,
    public storage: StorageComponent
  ) { }

  async ngOnInit(){
    this.storage.clearStorage()
    await this.getPublicKeyrsa();
  }


  goLogin1() {
    this.router.navigateByUrl("login1")
  }

  goLoginSharing() {
    this.router.navigateByUrl("loginsharing")
  }

  async getPublicKeyrsa() {  //pide la publicKey del servidor
    this.bancoService.getpublicKeyRSAbanco().subscribe(
        (data) => {
          this.publicKeyserver = new Classpublickey(bc.hexToBigint(data["e"]),bc.hexToBigint(data["n"]))
          console.log("PublicKey del server Banco: ");
          console.log(this.publicKeyserver)
          let publicKeyStorage = {   //lo guardo en un array porque no me deja bigint en localStorage
            e: data["e"],             //estará en hexadecimal
            n: data["n"]
          }
          this.storage.savePublicKey(JSON.stringify(publicKeyStorage));
        },
        (err) => {
          console.log("err", err);
        }
      );
  }


}

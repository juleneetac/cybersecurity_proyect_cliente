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
  password: string;//string[] = [];

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

  login1(){
    let credencial: modelUser = new modelUser(this.username, this.password, 0)
  
    this.tiendaService.login1(credencial).subscribe(
      async res =>{
        const toast = await this.toaster.showSuccess("Correct Login", "Tienda Online")
        const response: any = res;
        this.storageuser = new modelStorageuser (response.username, response.jwt )
        console.log(this.storageuser);

        //Save info locally
        await this.storage.saveToken(this.storageuser.jwt);
        await this.storage.saveUser(JSON.stringify(this.storageuser));
        
  
        await this.goMain();    //Que al loguearte vayas al Main
  
  
        //console.log(String(this.auth.authenticationState));
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
  // else if  (err.status == 401) {
  //   console.log('salida');
  //   const toast = await this.toaster.showError("Usuario vacio", "Tienda Online")
  // }
  }


}

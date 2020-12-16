import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { LoginsharedComponent } from './components/loginshared/loginshared.component';
import { MainComponent } from './components/main/main.component';

const routes: Routes = [
  
  {
    path:'login1',
    component: LoginComponent
  },
  {
    path:'loginsharing',
    component: LoginsharedComponent
  },
  {
    path:'main',
    component: MainComponent
  },
  {
    path:'',
    component: HomeComponent
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes,{
    enableTracing: true
    })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

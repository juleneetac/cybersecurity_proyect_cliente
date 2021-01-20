import { Component, NgModule, OnInit } from '@angular/core';

@Component({
  selector: 'app-storage',
  templateUrl: './storage.component.html',
  styleUrls: ['./storage.component.css']
})
export class StorageComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  async saveToken(token){
    localStorage.setItem('token', token);
}

getToken(){
    return localStorage.getItem('token');
}

async saveUser(user){
    localStorage.setItem('user', user);
}

getUser(){
    return localStorage.getItem('user');
}

async savePublicKey(publickey){
  localStorage.setItem('publickey', publickey);
}

getPublicKey(){
  return localStorage.getItem('publickey');
}

async saveCarteraCifrada(cartera){
  localStorage.setItem('cartera',cartera);
}

getCarteraCifrada(){
  return localStorage.getItem('cartera');
}

getderivedKey(){
  return localStorage.getItem('derivedKey' );
}

async savederivedKey(derivedKey){
  localStorage.setItem('derivedKey', derivedKey);
}

getSalt(){
  return localStorage.getItem('salt');
}

async saveSalt(salt){
  localStorage.setItem('salt', salt);
}

clearStorage(){
  return localStorage.clear();
}

}

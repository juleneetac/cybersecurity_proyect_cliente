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

clearStorage(){
  return localStorage.clear();
}

}

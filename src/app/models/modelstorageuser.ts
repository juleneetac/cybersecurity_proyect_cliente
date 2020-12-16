import * as bcu from 'bigint-crypto-utils';
import * as bc from 'bigint-conversion';

export class modelStorageuser {
    username: string;
    jwt: string;  //para el json web token
  
    constructor(username = "", jwt="") {
      this.username = username;
      this.jwt = jwt;
    }





}

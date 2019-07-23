import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout, retryWhen, delay, map, filter } from 'rxjs/operators';
import {
    transfer as createTransfer,
    data as createData,
  } from '@waves/waves-transactions';

@Injectable()
export class WavesService {

  private readonly URL_BASE: string = 'https://www.googleapis.com/youtube/v3/search';
  private readonly API_KEY: string = 'AIzaSyDxuxEANLFVy5q4sG1NrAUJNhoX6nW4VQ4';

  constructor(private http: HttpClient) {
  }

  login(): any {
    console.log('login');
  }


}

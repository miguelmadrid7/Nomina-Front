import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Messages {


  messages: string[] = []


  add(message: string){
    console.log(message)
    this.messages.push(message)
    console.log(this.messages)
  }

  
}

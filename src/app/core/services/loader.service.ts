import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private request = 0;

  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  show(): void {
    this.request++;
    this.loading.next(true);
  }

  hide(): void {
    this.request--;
    if(this.request <= 0){
      this.request = 0;
      this.loading.next(false);

    }
  }

}
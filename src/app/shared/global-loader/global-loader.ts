import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from '../../core/services/loader.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './global-loader.html',
  styleUrl: './global-loader.css'
})
export class GlobalLoader {

  private loaderService = inject(LoaderService);
  loading$ = this.loaderService.loading$;
}

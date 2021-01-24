import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { OnlyUsersComponent } from './video_layout/only-users/only-users.component';
import { BasicVideoOComponent } from './template/basic-video-o/basic-video-o.component';
import { SpeedtestComponent } from './shared/speedtest/speedtest.component';
import { ToastrModule } from 'ngx-toastr';
import { DebounceClickDirective } from './directive/debounce-click.directive';

@NgModule({
  declarations: [
    AppComponent,
    OnlyUsersComponent,
    BasicVideoOComponent,
    SpeedtestComponent,
    DebounceClickDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot({
      preventDuplicates: true
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

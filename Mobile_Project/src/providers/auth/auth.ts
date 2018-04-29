import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter, Inject } from '@angular/core';
import { AuthProviders, AngularFire, FirebaseAuthState, AuthMethods, FirebaseApp } from 'angularfire2';
import { Observable } from "rxjs/Observable";
import { Platform } from 'ionic-angular';
import { GooglePlus } from 'ionic-native';
import { auth } from 'firebase';



@Injectable()
export class AuthProvider {
  private authState: FirebaseAuthState;
  public onAuth: EventEmitter<FirebaseAuthState> = new EventEmitter();
  public firebase : any; //Add native firebase

  constructor(private af: AngularFire, @Inject(FirebaseApp)firebase : any) { //Add reference to native firebase SDK
    this.firebase = firebase;
    this.af.auth.subscribe((state: FirebaseAuthState) => {
      this.authState = state;
      this.onAuth.emit(state);
    });
  }

  loginWithGoogle() {
    return Observable.create(observer => {
      if (this.platform.is('cordova')) {
       return GooglePlus.login({
          'webClientId':'644540282013-ehnfmmn41qn4qi5qm4q5nf28a0s3vob8.apps.googleusercontent.com'
        }).then(userData => {
          var token = userData.idToken;
          const googleCredential = auth.GoogleAuthProvider.credential(token, null);
          this.firebase.auth().signInWithCredential(googleCredential).then((success)=>{
            observer.next(success);
          }).catch(error => {
            //console.log(error);
            observer.error(error);
          });
        }).catch(error => {
            //console.log(error);
            observer.error(error);
        });
      } else {
        return this.af.auth.login({
          provider: AuthProviders.Google,
          method: AuthMethods.Popup
          }).then(()=>{
            observer.next();
          }).catch(error => {
            //console.log(error);
            observer.error(error);
        });
      }
    });
  }

  loginWithEmail(credentials) {
    return Observable.create(observer => {
      this.af.auth.login(credentials, {
        provider: AuthProviders.Password,
        method: AuthMethods.Password
      }).then((authData) => {
        //console.log(authData);
        observer.next(authData);
      }).catch((error) => {
        observer.error(error);
      });
    });
  }
  registerUser(credentials: any) {
    return Observable.create(observer => {
      this.af.auth.createUser(credentials).then(authData => {
        observer.next(authData);
      }).catch(error => {
        //console.log(error);
        observer.error(error);
      });
    });
  }

  resetPassword(emailAddress:string){
      return Observable.create(observer => {
        this.firebase.auth().sendPasswordResetEmail(emailAddress).then(function(success) {
            //console.log('email sent', success);
            observer.next(success);
          }, function(error) {
            //console.log('error sending email',error);
            observer.error(error);
          });
       });
    }

  logout() {
    this.af.auth.logout();
  }

  get currentUser():string{
    return this.authState?this.authState.auth.email:'';
  }
}

import { Component, AfterViewInit } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { SMS } from '@ionic-native/sms/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';
import { ModalController } from '@ionic/angular';
import { QrcodePage } from './../qrcode/qrcode.page';

declare var jsOTP: any;
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {
  merchant: string;
  amount: number;
  pin: number;
  code: string;
  countDown: any;
  isQR: boolean = false;
  constructor(private sms: SMS, private androidPermissions: AndroidPermissions, private qrScanner: QRScanner, public modalController: ModalController) {
    this.updateOtp();
  }

  ngAfterViewInit() {
    this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.SEND_SMS, this.androidPermissions.PERMISSION.READ_PHONE_STATE, this.androidPermissions.PERMISSION.CAMERA]);
    setInterval(this.timeLoop, 1000);
  }

  pay() {
    const header = {
      "alg": "HS256",
      "typ": "JWT"
    };

    const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
    const encodedHeader = this.encryptData(stringifiedHeader);

    const data = { "userId": "john", "recepientId": this.merchant, "amount": this.amount, "totp": this.code, "authCode": this.pin };

    const stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    const encodedData = this.encryptData(stringifiedData);

    const token = encodedHeader + "." + encodedData;

    const secret = "g5PhAQ3RsxOumIIGKcmtLTK6o6jQOXdY";
    // const secret = "mrd9SpvDZNJw5Fxgk6faQqzGsU41Qcke";

    let signature = CryptoJS.HmacSHA256(token, secret);
    signature = this.encryptData(signature);

    const signedToken = token + "." + signature;

    if (!this.isQR) {
      this.sms.hasPermission().then((hasPermission) => {
        if (hasPermission) {
          this.sms.send('+918073560430', signedToken);
        }
      }).catch((err) => {
        this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.SEND_SMS, this.androidPermissions.PERMISSION.READ_PHONE_STATE, this.androidPermissions.PERMISSION.CAMERA]);
      });
    } else {
      this.presentModal(signedToken);
    }


  }

  encryptData(source) {
    let enc = CryptoJS.enc.Base64.stringify(source);

    enc = enc.replace(/=+$/, '');

    enc = enc.replace(/\+/g, '-');
    enc = enc.replace(/\//g, '_');

    return enc;
  }

  scanQR() {
    const ionApp = <HTMLElement>document.getElementsByTagName('ion-app')[0];
    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          this.qrScanner.show();
          ionApp.style.display = 'none';
          let scanSub = this.qrScanner.scan().subscribe((text: string) => {
            this.merchant = text;
            this.qrScanner.hide(); // hide camera preview
            scanSub.unsubscribe(); // stop scanning
            ionApp.style.display = 'block';
          });

        } else if (status.denied) {
          this.qrScanner.openSettings();
        } else {
          this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.CAMERA]);
        }
      })
      .catch((e: any) => console.log('Error is', e));
  }

  timeLoop = () => {
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const count = 30 - (epoch % 30);
    this.updateTicker(count);
    if (epoch % 30 == 0) {
      this.updateOtp();
    };
  }

  updateTicker = (tick) => {
    this.countDown = tick;
  }

  updateOtp = () => {
    const totp = new jsOTP.totp();
    this.code = totp.getOtp('23TplPdS46Juzcyx');
  }

  async presentModal(token: string) {
    const modal = await this.modalController.create({
      component: QrcodePage,
      componentProps: {
        'token': token
      }
    });
    return await modal.present();
  }

}

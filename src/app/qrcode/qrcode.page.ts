import { Component, Input } from '@angular/core';
import QRCode from 'qrcode';
import { NavParams } from '@ionic/angular';
@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.page.html',
  styleUrls: ['./qrcode.page.scss'],
})
export class QrcodePage {
  generated = '';
  @Input() token;
  constructor(navParams: NavParams) {
    this.token = navParams.get('token');
    this.loadQR();
  }
  loadQR() {
    const qrcode = QRCode;
    if (this.token) {
      qrcode.toDataURL(this.token)
        .then((url) => {
          this.generated = url;
        }).catch((err) => {
          console.log('error', err);
        });
    }
  }

}

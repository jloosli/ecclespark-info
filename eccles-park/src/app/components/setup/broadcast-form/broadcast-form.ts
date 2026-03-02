import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateBroadcastParams } from '../../../services/youtube.service';

@Component({
  selector: 'app-broadcast-form',
  imports: [FormsModule],
  templateUrl: './broadcast-form.html',
  styleUrl: './broadcast-form.css',
})
export class BroadcastForm {
  disabled = input<boolean>(false);
  formSubmit = output<CreateBroadcastParams>();

  title = 'Eccles Park Ward Sacrament Meeting';
  date = '';
  time = '10:00';

  onSubmit(): void {
    if (!this.title || !this.date || !this.time) return;
    const [year, month, day] = this.date.split('-').map(Number);
    const [hours, minutes] = this.time.split(':').map(Number);
    const scheduledStartTime = new Date(year, month - 1, day, hours, minutes, 0);
    this.formSubmit.emit({ title: this.title, scheduledStartTime });
  }
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast.component';
import { SpinnerComponent } from './shared/spinner.component';
import { HeaderComponent } from './components/header/header.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, SpinnerComponent, HeaderComponent, ChatbotComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'vecta';
}

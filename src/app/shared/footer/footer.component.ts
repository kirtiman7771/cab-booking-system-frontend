import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  footerLinks = {
    company: ['About Us', 'Our offerings', 'Newsroom', 'Investors', 'Careers', 'Blog'],
    products: ['Ride', 'Drive', 'Business', 'Vector Freight', 'Gift cards'],
    citizenship: ['Safety', 'Diversity and inclusion', 'Sustainability'],
    Policies: ['Privacy', 'Accessibility', 'Terms'],
  }
  
  currentYear = new Date().getFullYear();
}

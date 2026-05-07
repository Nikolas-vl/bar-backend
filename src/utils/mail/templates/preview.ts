import fs from 'fs';
import path from 'path';

import { reservationTemplate } from './reservationConfirmation';

const html = reservationTemplate({
  name: 'Nikolas',
  date: new Date(),
  guests: 2,
  tableNumber: 5,
  locationName: 'Jolie Brasserie',
  locationAddress: 'Warsaw, Main Street 1',
  restaurantName: 'Jolie Brasserie Café',
  preOrders: [
    { dishName: 'Pasta Carbonara', quantity: 1 },
    { dishName: 'Tiramisu', quantity: 2 },
  ],
});

const filePath = path.resolve(__dirname, '../../preview.html');

fs.writeFileSync(filePath, html);

console.log('✅ Preview generated:', filePath);

import { baseTemplate } from './baseTemplate';

interface ReservationEmailProps {
  name: string;
  date: Date;
  guests: number;
  tableNumber: number;
  locationName: string;
  locationAddress: string;
  restaurantName: string;
  preOrders: { dishName: string; quantity: number }[];
}

export const reservationTemplate = (options: ReservationEmailProps) => {
  const preOrderHtml =
    options.preOrders.length > 0
      ? `
        <div style="margin-top:16px;">
          <strong>Pre-ordered dishes</strong>
          <ul style="margin:8px 0 0; padding-left:18px; color:#6B6B6B;">
            ${options.preOrders.map(p => `<li>${p.dishName} x ${p.quantity}</li>`).join('')}
          </ul>
        </div>
      `
      : '';

  const content = `
    <h2 style="margin-top:0;">Your reservation is confirmed ✨</h2>

    <p>Hi ${options.name},</p>

    <table width="100%" style="background:#FAF7F2; padding:12px; border-radius:8px; margin:16px 0;">
      <tr><td><strong>Date:</strong> ${options.date.toLocaleString()}</td></tr>
      <tr><td><strong>Guests:</strong> ${options.guests}</td></tr>
      <tr><td><strong>Table:</strong> #${options.tableNumber}</td></tr>
      <tr>
        <td>
          <strong>Location:</strong><br/>
          ${options.locationName}<br/>
          <span style="color:#6B6B6B;">${options.locationAddress}</span>
        </td>
      </tr>
    </table>

    ${preOrderHtml}

    <div style="margin:20px 0;">
      <a href="#" class="btn">View Reservation</a>
    </div>
  `;

  return baseTemplate(content, 'Reservation confirmed');
};

import { sendEmail } from '../mailer';
import { reservationTemplate } from '../templates/reservationConfirmation';

interface SendReservationOptions {
  to: string;
  name: string;
  date: Date;
  guests: number;
  tableNumber: number;
  locationName: string;
  locationAddress: string;
  restaurantName: string;
  preOrders: { dishName: string; quantity: number }[];
}

export const sendReservation = async (options: SendReservationOptions) => {
  const html = reservationTemplate(options);

  await sendEmail({
    to: options.to,
    subject: `Reservation Confirmed — ${options.restaurantName}`,
    html,
  });
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'John Doe',
    },
  });

  const cheese = await prisma.ingredient.create({
    data: { name: 'Cheese', price: 1.5 },
  });

  const tomato = await prisma.ingredient.create({
    data: { name: 'Tomato', price: 0.8 },
  });

  const pizza = await prisma.dish.create({
    data: {
      name: 'Pizza Margherita',
      description: 'Classic pizza with cheese and tomato',
      price: 12,
      calories: 800,
      protein: 25,
      fat: 20,
      carbs: 90,
      ingredients: {
        create: [
          { ingredientId: cheese.id, optional: false },
          { ingredientId: tomato.id, optional: false },
        ],
      },
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      type: 'DELIVERY',
      total: 12,
      items: {
        create: [
          {
            dishId: pizza.id,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.reservation.create({
    data: {
      userId: user.id,
      date: new Date(Date.now() + 86400000), // tomorrow
      guests: 2,
    },
  });

  await prisma.address.create({
    data: {
      userId: user.id,
      city: 'Kyiv',
      street: 'Main Street 1',
      zip: '01001',
    },
  });

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

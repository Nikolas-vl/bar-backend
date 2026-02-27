import { UserRole, Category, OrderType, OrderStatus, PaymentStatus } from '../generated/prisma/enums';
import * as bcrypt from 'bcrypt';
import { prisma } from '../src/prisma';

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in correct order due to relations)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.address.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.dishIngredient.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@restaurant.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: hashedPassword,
      name: 'John Doe',
      role: UserRole.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      role: UserRole.USER,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'mike.wilson@example.com',
      password: hashedPassword,
      name: 'Mike Wilson',
      role: UserRole.USER,
    },
  });

  console.log('✅ Created users');

  // Create Ingredients
  const ingredients = await Promise.all([
    prisma.ingredient.create({ data: { name: 'Eggs', price: 0.5 } }),
    prisma.ingredient.create({ data: { name: 'Bacon', price: 1.5 } }),
    prisma.ingredient.create({ data: { name: 'Toast', price: 0.3 } }),
    prisma.ingredient.create({ data: { name: 'Butter', price: 0.2 } }),
    prisma.ingredient.create({ data: { name: 'Cheese', price: 0.8 } }),
    prisma.ingredient.create({ data: { name: 'Tomato', price: 0.4 } }),
    prisma.ingredient.create({ data: { name: 'Lettuce', price: 0.3 } }),
    prisma.ingredient.create({ data: { name: 'Chicken Breast', price: 3.0 } }),
    prisma.ingredient.create({ data: { name: 'Pasta', price: 0.8 } }),
    prisma.ingredient.create({ data: { name: 'Rice', price: 0.5 } }),
    prisma.ingredient.create({ data: { name: 'Beef', price: 4.0 } }),
    prisma.ingredient.create({ data: { name: 'Salmon', price: 5.0 } }),
    prisma.ingredient.create({ data: { name: 'Avocado', price: 1.2 } }),
    prisma.ingredient.create({ data: { name: 'Mushrooms', price: 0.9 } }),
    prisma.ingredient.create({ data: { name: 'Onions', price: 0.3 } }),
  ]);

  console.log('✅ Created ingredients');

  // Create Breakfast Dishes
  const breakfastDishes = await Promise.all([
    prisma.dish.create({
      data: {
        name: 'Classic Breakfast',
        description: 'Two eggs, bacon, and toast',
        price: 8.99,
        imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666',
        calories: 520,
        protein: 25.0,
        fat: 32.0,
        carbs: 28.0,
        category: Category.BREAKFAST,
        isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Avocado Toast',
        description: 'Fresh avocado on sourdough with eggs',
        price: 9.99,
        imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d',
        calories: 420,
        protein: 18.0,
        fat: 24.0,
        carbs: 35.0,
        category: Category.BREAKFAST,
        isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Pancakes Stack',
        description: 'Fluffy pancakes with maple syrup',
        price: 7.99,
        imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',
        calories: 580,
        protein: 12.0,
        fat: 18.0,
        carbs: 85.0,
        category: Category.BREAKFAST,
        isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Veggie Omelette',
        description: 'Three-egg omelette with vegetables',
        price: 8.49,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        calories: 380,
        protein: 22.0,
        fat: 26.0,
        carbs: 12.0,
        category: Category.BREAKFAST,
        isAvailable: true,
      },
    }),
  ]);

  console.log('✅ Created breakfast dishes');

  // Create Lunch Dishes
  const lunchDishes = await Promise.all([
    prisma.dish.create({
      data: {
        name: 'Grilled Chicken Salad',
        description: 'Fresh greens with grilled chicken breast',
        price: 12.99,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        calories: 450,
        protein: 38.0,
        fat: 18.0,
        carbs: 32.0,
        category: Category.LUNCH,
        isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Beef Burger',
        description: 'Juicy beef patty with cheese and fries',
        price: 14.99,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
        calories: 820,
        protein: 42.0,
        fat: 48.0,
        carbs: 52.0,
        category: Category.LUNCH,
        isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Grilled Salmon',
        description: 'Atlantic salmon with vegetables and rice',
        price: 18.99,
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
        calories: 620,
        protein: 45.0,
        fat: 28.0,
        carbs: 42.0,
        category: Category.LUNCH,
        isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Pasta Carbonara',
        description: 'Creamy pasta with bacon and parmesan',
        price: 13.99,
        imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3',
        calories: 740,
        protein: 28.0,
        fat: 38.0,
        carbs: 68.0,
        category: Category.LUNCH,
        isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Mushroom Risotto',
        description: 'Creamy arborio rice with mushrooms',
        price: 14.49,
        imageUrl: 'https://images.unsplash.com/photo-1476124369491-c1a5b0b54c4e',
        calories: 560,
        protein: 15.0,
        fat: 22.0,
        carbs: 72.0,
        category: Category.LUNCH,
        isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Caesar Salad',
        description: 'Classic caesar with croutons and parmesan',
        price: 10.99,
        imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9',
        calories: 380,
        protein: 12.0,
        fat: 28.0,
        carbs: 24.0,
        category: Category.LUNCH,
        isAvailable: true,
      },
    }),
  ]);

  console.log('✅ Created lunch dishes');

  // Create Dish-Ingredient relationships
  await prisma.dishIngredient.createMany({
    data: [
      // Classic Breakfast
      { dishId: breakfastDishes[0].id, ingredientId: ingredients[0].id, optional: false, quantity: 2 },
      { dishId: breakfastDishes[0].id, ingredientId: ingredients[1].id, optional: false, quantity: 3 },
      { dishId: breakfastDishes[0].id, ingredientId: ingredients[2].id, optional: false, quantity: 2 },

      // Avocado Toast
      { dishId: breakfastDishes[1].id, ingredientId: ingredients[12].id, optional: false, quantity: 1 },
      { dishId: breakfastDishes[1].id, ingredientId: ingredients[2].id, optional: false, quantity: 2 },
      { dishId: breakfastDishes[1].id, ingredientId: ingredients[0].id, optional: true, quantity: 2 },

      // Veggie Omelette
      { dishId: breakfastDishes[3].id, ingredientId: ingredients[0].id, optional: false, quantity: 3 },
      { dishId: breakfastDishes[3].id, ingredientId: ingredients[5].id, optional: false, quantity: 1 },
      { dishId: breakfastDishes[3].id, ingredientId: ingredients[13].id, optional: false, quantity: 1 },
      { dishId: breakfastDishes[3].id, ingredientId: ingredients[4].id, optional: true, quantity: 1 },

      // Grilled Chicken Salad
      { dishId: lunchDishes[0].id, ingredientId: ingredients[7].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[0].id, ingredientId: ingredients[6].id, optional: false, quantity: 2 },
      { dishId: lunchDishes[0].id, ingredientId: ingredients[5].id, optional: false, quantity: 1 },

      // Beef Burger
      { dishId: lunchDishes[1].id, ingredientId: ingredients[10].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[1].id, ingredientId: ingredients[4].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[1].id, ingredientId: ingredients[6].id, optional: true, quantity: 1 },
      { dishId: lunchDishes[1].id, ingredientId: ingredients[5].id, optional: true, quantity: 1 },

      // Grilled Salmon
      { dishId: lunchDishes[2].id, ingredientId: ingredients[11].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[2].id, ingredientId: ingredients[9].id, optional: false, quantity: 1 },

      // Pasta Carbonara
      { dishId: lunchDishes[3].id, ingredientId: ingredients[8].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[3].id, ingredientId: ingredients[1].id, optional: false, quantity: 2 },
      { dishId: lunchDishes[3].id, ingredientId: ingredients[4].id, optional: false, quantity: 1 },

      // Mushroom Risotto
      { dishId: lunchDishes[4].id, ingredientId: ingredients[9].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[4].id, ingredientId: ingredients[13].id, optional: false, quantity: 2 },
      { dishId: lunchDishes[4].id, ingredientId: ingredients[14].id, optional: false, quantity: 1 },
    ],
  });

  console.log('✅ Created dish-ingredient relationships');

  // Create Addresses
  await prisma.address.createMany({
    data: [
      {
        userId: user1.id,
        city: 'New York',
        street: '123 Main St',
        zip: '10001',
        phone: '555-0101',
      },
      {
        userId: user2.id,
        city: 'Los Angeles',
        street: '456 Oak Ave',
        zip: '90001',
        phone: '555-0102',
      },
      {
        userId: user3.id,
        city: 'Chicago',
        street: '789 Pine Rd',
        zip: '60601',
        phone: '555-0103',
      },
    ],
  });

  console.log('✅ Created addresses');

  // Create Payment Methods
  await prisma.paymentMethod.createMany({
    data: [
      {
        userId: user1.id,
        cardType: 'Visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
      },
      {
        userId: user2.id,
        cardType: 'Mastercard',
        last4: '5555',
        expMonth: 6,
        expYear: 2026,
      },
      {
        userId: user3.id,
        cardType: 'Amex',
        last4: '3782',
        expMonth: 9,
        expYear: 2025,
      },
    ],
  });

  console.log('✅ Created payment methods');

  // Create Orders with OrderItems
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      type: OrderType.DELIVERY,
      status: OrderStatus.COMPLETED,
      total: 27.98,
      paymentStatus: PaymentStatus.PAID,
      comment: 'Please ring the doorbell',
      items: {
        create: [
          { dishId: breakfastDishes[0].id, quantity: 2 },
          { dishId: breakfastDishes[1].id, quantity: 1 },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user2.id,
      type: OrderType.DINE_IN,
      status: OrderStatus.PREPARING,
      total: 32.98,
      paymentStatus: PaymentStatus.PAID,
      items: {
        create: [
          { dishId: lunchDishes[2].id, quantity: 1 },
          { dishId: lunchDishes[3].id, quantity: 1 },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      userId: user3.id,
      type: OrderType.TAKE_OUT,
      status: OrderStatus.NEW,
      total: 14.99,
      paymentStatus: PaymentStatus.PENDING,
      comment: 'Extra sauce please',
      items: {
        create: [
          { dishId: lunchDishes[1].id, quantity: 1 },
        ],
      },
    },
  });

  const order4 = await prisma.order.create({
    data: {
      userId: user1.id,
      type: OrderType.DELIVERY,
      status: OrderStatus.PAID,
      total: 45.97,
      paymentStatus: PaymentStatus.PAID,
      items: {
        create: [
          { dishId: lunchDishes[0].id, quantity: 2 },
          { dishId: lunchDishes[2].id, quantity: 1 },
        ],
      },
    },
  });

  console.log('✅ Created orders with items');

  // Create Reservations
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.reservation.createMany({
    data: [
      {
        userId: user1.id,
        date: tomorrow,
        guests: 4,
      },
      {
        userId: user2.id,
        date: nextWeek,
        guests: 2,
      },
      {
        userId: user3.id,
        date: new Date(today.setHours(19, 0, 0, 0)),
        guests: 6,
      },
    ],
  });

  console.log('✅ Created reservations');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: 4 (1 admin, 3 regular users)`);
  console.log(`   Ingredients: ${ingredients.length}`);
  console.log(`   Dishes: ${breakfastDishes.length + lunchDishes.length} (${breakfastDishes.length} breakfast, ${lunchDishes.length} lunch)`);
  console.log(`   Orders: 4`);
  console.log(`   Reservations: 3`);
  console.log(`   Addresses: 3`);
  console.log(`   Payment Methods: 3`);
  console.log('\n🔐 Test credentials:');
  console.log('   Admin: admin@restaurant.com / password123');
  console.log('   User: john.doe@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

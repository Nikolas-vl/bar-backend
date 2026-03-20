import { UserRole, Category, OrderType, OrderStatus, PaymentStatus } from '../generated/prisma/enums';
import * as bcrypt from 'bcrypt';
import { prisma } from '../src/prisma';

async function main() {
  console.log('🌱 Starting database seed...');

  // ── Clear everything in FK-safe order ─────────────────────────────────────
  await prisma.orderItemExtra.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderIngredientItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservationPreOrder.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.address.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.cartItemExtra.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cartIngredientItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.dishIngredient.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.table.deleteMany();
  await prisma.location.deleteMany();
  await prisma.settings.deleteMany();

  console.log('🗑️  Cleared existing data');

  // ── Settings ───────────────────────────────────────────────────────────────
  await prisma.settings.create({
    data: {
      id: 1,
      restaurantName: 'Jolie Brasserie Café',
      taxRate: 0.23,
      deliveryFee: 5.00,
      serviceFee: 2.00,
      freeDeliveryThreshold: 50.00,
    },
  });

  console.log('✅ Created settings');

  // ── Locations ──────────────────────────────────────────────────────────────
  const location1 = await prisma.location.create({
    data: {
      name: 'Jolie Kurzy Targ',
      address: 'Kurzy Targ 2, 50-103 Wrocław',
      phone: '+48 784 811 622',
      email: 'main@thebar.com',
      openingHours: '08:00 - 22:00',
      isActive: true,
    },
  });

  const location2 = await prisma.location.create({
    data: {
      name: 'Jolie Plac Solny',
      address: 'Plac Solny 6, 50-062 Wrocław',
      phone: '+48 600 359 045',
      email: 'park@thebar.com',
      openingHours: '08:00 - 19:00',
      isActive: true,
    },
  });

  console.log('✅ Created locations');

  // ── Tables ─────────────────────────────────────────────────────────────────
  await prisma.table.createMany({
    data: [
      // Kurzy Targ
      { number: 1, capacity: 2,  locationId: location1.id },
      { number: 2, capacity: 2,  locationId: location1.id },
      { number: 3, capacity: 4,  locationId: location1.id },
      { number: 4, capacity: 4,  locationId: location1.id },
      { number: 5, capacity: 6,  locationId: location1.id },
      { number: 6, capacity: 8,  locationId: location1.id },
      // Plac Solny
      { number: 1, capacity: 2,  locationId: location2.id },
      { number: 2, capacity: 2,  locationId: location2.id },
      { number: 3, capacity: 4,  locationId: location2.id },
      { number: 4, capacity: 4,  locationId: location2.id },
      { number: 5, capacity: 6,  locationId: location2.id },
    ],
  });

  console.log('✅ Created tables');

  // ── Users ──────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@jolie.com',
      password: hashedPassword,
      name: 'Admin',
      phone: '+48 100 000 001',
      role: UserRole.ADMIN,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: hashedPassword,
      name: 'John Doe',
      phone: '+48 111 222 333',
      role: UserRole.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      phone: '+48 444 555 666',
      role: UserRole.USER,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'mike.wilson@example.com',
      password: hashedPassword,
      name: 'Mike Wilson',
      phone: '+48 777 888 999',
      role: UserRole.USER,
    },
  });

  console.log('✅ Created users');

  // ── Addresses (no phone) ───────────────────────────────────────────────────
  await prisma.address.createMany({
    data: [
      { userId: user1.id, city: 'Wrocław', street: 'ul. Świdnicka 10',   zip: '50-068', isDefault: true  },
      { userId: user1.id, city: 'Wrocław', street: 'ul. Piłsudskiego 74', zip: '50-020', isDefault: false },
      { userId: user2.id, city: 'Wrocław', street: 'ul. Kazimierza 5',    zip: '50-001', isDefault: true  },
      { userId: user3.id, city: 'Wrocław', street: 'ul. Legnicka 55',     zip: '54-234', isDefault: true  },
    ],
  });

  console.log('✅ Created addresses');

  // ── Payment Methods ────────────────────────────────────────────────────────
  await prisma.paymentMethod.createMany({
    data: [
      { userId: user1.id, cardType: 'Visa',       last4: '4242', expMonth: 12, expYear: 2027, isDefault: true,  isArchived: false },
      { userId: user1.id, cardType: 'Mastercard', last4: '8888', expMonth: 6,  expYear: 2026, isDefault: false, isArchived: false },
      { userId: user2.id, cardType: 'Mastercard', last4: '5555', expMonth: 6,  expYear: 2026, isDefault: true,  isArchived: false },
      { userId: user3.id, cardType: 'Amex',       last4: '3782', expMonth: 9,  expYear: 2028, isDefault: true,  isArchived: false },
    ],
  });

  console.log('✅ Created payment methods');

  // ── Ingredients ────────────────────────────────────────────────────────────
  const ingredients = await Promise.all([
    prisma.ingredient.create({ data: { name: 'Eggs',           price: 0.50 } }), // 0
    prisma.ingredient.create({ data: { name: 'Bacon',          price: 1.50 } }), // 1
    prisma.ingredient.create({ data: { name: 'Toast',          price: 0.30 } }), // 2
    prisma.ingredient.create({ data: { name: 'Butter',         price: 0.20 } }), // 3
    prisma.ingredient.create({ data: { name: 'Cheese',         price: 0.80 } }), // 4
    prisma.ingredient.create({ data: { name: 'Tomato',         price: 0.40 } }), // 5
    prisma.ingredient.create({ data: { name: 'Lettuce',        price: 0.30 } }), // 6
    prisma.ingredient.create({ data: { name: 'Chicken Breast', price: 3.00 } }), // 7
    prisma.ingredient.create({ data: { name: 'Pasta',          price: 0.80 } }), // 8
    prisma.ingredient.create({ data: { name: 'Rice',           price: 0.50 } }), // 9
    prisma.ingredient.create({ data: { name: 'Beef',           price: 4.00 } }), // 10
    prisma.ingredient.create({ data: { name: 'Salmon',         price: 5.00 } }), // 11
    prisma.ingredient.create({ data: { name: 'Avocado',        price: 1.20 } }), // 12
    prisma.ingredient.create({ data: { name: 'Mushrooms',      price: 0.90 } }), // 13
    prisma.ingredient.create({ data: { name: 'Onions',         price: 0.30 } }), // 14
  ]);

  console.log('✅ Created ingredients');

  // ── Dishes ─────────────────────────────────────────────────────────────────
  const breakfastDishes = await Promise.all([
    prisma.dish.create({
      data: {
        name: 'Classic Breakfast',
        description: 'Two eggs, bacon, and toast',
        price: 8.99,
        imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666',
        calories: 520, protein: 25.0, fat: 32.0, carbs: 28.0,
        category: Category.BREAKFAST, isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Avocado Toast',
        description: 'Fresh avocado on sourdough with eggs',
        price: 9.99,
        imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d',
        calories: 420, protein: 18.0, fat: 24.0, carbs: 35.0,
        category: Category.BREAKFAST, isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Pancakes Stack',
        description: 'Fluffy pancakes with maple syrup',
        price: 7.99,
        imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',
        calories: 580, protein: 12.0, fat: 18.0, carbs: 85.0,
        category: Category.BREAKFAST, isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Veggie Omelette',
        description: 'Three-egg omelette with fresh vegetables',
        price: 8.49,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        calories: 380, protein: 22.0, fat: 26.0, carbs: 12.0,
        category: Category.BREAKFAST, isAvailable: true,
      },
    }),
  ]);

  const lunchDishes = await Promise.all([
    prisma.dish.create({
      data: {
        name: 'Grilled Chicken Salad',
        description: 'Fresh greens with grilled chicken breast',
        price: 12.99,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        calories: 450, protein: 38.0, fat: 18.0, carbs: 32.0,
        category: Category.LUNCH, isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Beef Burger',
        description: 'Juicy beef patty with cheese and fries',
        price: 14.99,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
        calories: 820, protein: 42.0, fat: 48.0, carbs: 52.0,
        category: Category.LUNCH, isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Grilled Salmon',
        description: 'Atlantic salmon with vegetables and rice',
        price: 18.99,
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
        calories: 620, protein: 45.0, fat: 28.0, carbs: 42.0,
        category: Category.LUNCH, isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Pasta Carbonara',
        description: 'Creamy pasta with bacon and parmesan',
        price: 13.99,
        imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3',
        calories: 740, protein: 28.0, fat: 38.0, carbs: 68.0,
        category: Category.LUNCH, isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Mushroom Risotto',
        description: 'Creamy arborio rice with mushrooms',
        price: 14.49,
        imageUrl: 'https://images.unsplash.com/photo-1476124369491-c1a5b0b54c4e',
        calories: 560, protein: 15.0, fat: 22.0, carbs: 72.0,
        category: Category.LUNCH, isAvailable: true,
      },
    }),
    prisma.dish.create({
      data: {
        name: 'Caesar Salad',
        description: 'Classic caesar with croutons and parmesan',
        price: 10.99,
        imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9',
        calories: 380, protein: 12.0, fat: 28.0, carbs: 24.0,
        category: Category.LUNCH, isAvailable: true,
      },
    }),
  ]);

  console.log('✅ Created dishes');

  // ── Dish–Ingredient links ──────────────────────────────────────────────────
  await prisma.dishIngredient.createMany({
    data: [
      // Classic Breakfast
      { dishId: breakfastDishes[0].id, ingredientId: ingredients[0].id, optional: false, quantity: 2 },
      { dishId: breakfastDishes[0].id, ingredientId: ingredients[1].id, optional: false, quantity: 3 },
      { dishId: breakfastDishes[0].id, ingredientId: ingredients[2].id, optional: false, quantity: 2 },
      { dishId: breakfastDishes[0].id, ingredientId: ingredients[4].id, optional: true,  quantity: 1 },
      // Avocado Toast
      { dishId: breakfastDishes[1].id, ingredientId: ingredients[12].id, optional: false, quantity: 1 },
      { dishId: breakfastDishes[1].id, ingredientId: ingredients[2].id,  optional: false, quantity: 2 },
      { dishId: breakfastDishes[1].id, ingredientId: ingredients[0].id,  optional: true,  quantity: 2 },
      // Veggie Omelette
      { dishId: breakfastDishes[3].id, ingredientId: ingredients[0].id,  optional: false, quantity: 3 },
      { dishId: breakfastDishes[3].id, ingredientId: ingredients[5].id,  optional: false, quantity: 1 },
      { dishId: breakfastDishes[3].id, ingredientId: ingredients[13].id, optional: false, quantity: 1 },
      { dishId: breakfastDishes[3].id, ingredientId: ingredients[4].id,  optional: true,  quantity: 1 },
      // Grilled Chicken Salad
      { dishId: lunchDishes[0].id, ingredientId: ingredients[7].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[0].id, ingredientId: ingredients[6].id, optional: false, quantity: 2 },
      { dishId: lunchDishes[0].id, ingredientId: ingredients[5].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[0].id, ingredientId: ingredients[4].id, optional: true,  quantity: 1 },
      // Beef Burger
      { dishId: lunchDishes[1].id, ingredientId: ingredients[10].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[1].id, ingredientId: ingredients[4].id,  optional: false, quantity: 1 },
      { dishId: lunchDishes[1].id, ingredientId: ingredients[6].id,  optional: true,  quantity: 1 },
      { dishId: lunchDishes[1].id, ingredientId: ingredients[5].id,  optional: true,  quantity: 1 },
      // Grilled Salmon
      { dishId: lunchDishes[2].id, ingredientId: ingredients[11].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[2].id, ingredientId: ingredients[9].id,  optional: false, quantity: 1 },
      { dishId: lunchDishes[2].id, ingredientId: ingredients[5].id,  optional: true,  quantity: 1 },
      // Pasta Carbonara
      { dishId: lunchDishes[3].id, ingredientId: ingredients[8].id, optional: false, quantity: 1 },
      { dishId: lunchDishes[3].id, ingredientId: ingredients[1].id, optional: false, quantity: 2 },
      { dishId: lunchDishes[3].id, ingredientId: ingredients[4].id, optional: false, quantity: 1 },
      // Mushroom Risotto
      { dishId: lunchDishes[4].id, ingredientId: ingredients[9].id,  optional: false, quantity: 1 },
      { dishId: lunchDishes[4].id, ingredientId: ingredients[13].id, optional: false, quantity: 2 },
      { dishId: lunchDishes[4].id, ingredientId: ingredients[14].id, optional: false, quantity: 1 },
    ],
  });

  console.log('✅ Created dish-ingredient relationships');

  // ── Sample orders ──────────────────────────────────────────────────────────
  await prisma.order.create({
    data: {
      userId: user1.id,
      type: OrderType.DELIVERY,
      status: OrderStatus.COMPLETED,
      subtotal: 27.97, discount: 0, tax: 6.43, deliveryFee: 5.00, serviceFee: 2.00, total: 41.40,
      paymentStatus: PaymentStatus.SUCCESS,
      comment: 'Please ring the doorbell',
      items: {
        create: [
          { dishId: breakfastDishes[0].id, quantity: 2 },
          { dishId: breakfastDishes[1].id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      userId: user2.id,
      type: OrderType.DINE_IN,
      status: OrderStatus.PREPARING,
      subtotal: 32.98, discount: 0, tax: 7.59, deliveryFee: 0, serviceFee: 2.00, total: 42.57,
      paymentStatus: PaymentStatus.SUCCESS,
      items: {
        create: [
          { dishId: lunchDishes[2].id, quantity: 1 },
          { dishId: lunchDishes[3].id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      userId: user3.id,
      type: OrderType.TAKE_OUT,
      status: OrderStatus.NEW,
      subtotal: 14.99, discount: 0, tax: 3.45, deliveryFee: 0, serviceFee: 2.00, total: 20.44,
      paymentStatus: PaymentStatus.PENDING,
      comment: 'Extra sauce please',
      items: {
        create: [{ dishId: lunchDishes[1].id, quantity: 1 }],
      },
    },
  });

  console.log('✅ Created orders');

  // ── Sample reservations ────────────────────────────────────────────────────
  const tables = await prisma.table.findMany({ orderBy: [{ locationId: 'asc' }, { number: 'asc' }] });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(13, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      userId: user1.id,
      tableId: tables[2].id, // table 3, 4-person at Kurzy Targ
      date: tomorrow,
      guests: 3,
      status: 'CONFIRMED',
      preOrders: {
        create: [
          { dishId: lunchDishes[0].id, quantity: 2 },
          { dishId: lunchDishes[3].id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.reservation.create({
    data: {
      userId: user2.id,
      date: nextWeek,
      guests: 2,
      status: 'PENDING',
    },
  });

  await prisma.reservation.create({
    data: {
      userId: user3.id,
      tableId: tables[6].id, // table 1 at Plac Solny
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      guests: 4,
      status: 'CONFIRMED',
    },
  });

  console.log('✅ Created reservations');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed completed!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   Users:           4 (1 admin, 3 users)');
  console.log('   Locations:       2 (Kurzy Targ + Plac Solny, Wrocław)');
  console.log('   Tables:          11');
  console.log('   Ingredients:     15');
  console.log(`   Dishes:          ${breakfastDishes.length + lunchDishes.length} (${breakfastDishes.length} breakfast, ${lunchDishes.length} lunch)`);
  console.log('   Addresses:       4 (with isDefault)');
  console.log('   Payment methods: 4 (with isDefault)');
  console.log('   Orders:          3');
  console.log('   Reservations:    3');
  console.log('');
  console.log('🔐 Test credentials:');
  console.log('   Admin: admin@jolie.com / password123');
  console.log('   User:  john.doe@example.com / password123');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

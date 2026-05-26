const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../models/Product.model');

const categories = [
  'Electronics', 'Apparel', 'Furniture',
  'Food & Beverage', 'Sports', 'Automotive',
  'Health & Beauty', 'Toys',
];

const productsByCategory = {
  Electronics:       ['Wireless Headphones', 'Bluetooth Speaker', 'Smart Watch', 'Laptop Stand', 'USB Hub', 'Webcam', 'Mechanical Keyboard', 'Monitor', 'Graphics Card', 'SSD Drive'],
  Apparel:           ['Running Shoes', 'Denim Jacket', 'Cotton T-Shirt', 'Yoga Pants', 'Winter Coat', 'Baseball Cap', 'Leather Belt', 'Woolen Socks', 'Sports Bra', 'Cargo Shorts'],
  Furniture:         ['Office Chair', 'Standing Desk', 'Bookshelf', 'Filing Cabinet', 'Conference Table', 'Monitor Arm', 'Ergonomic Footrest', 'Drawer Unit', 'Sofa', 'Coffee Table'],
  'Food & Beverage': ['Protein Powder', 'Energy Drink', 'Coffee Beans', 'Green Tea', 'Protein Bar', 'Olive Oil', 'Almond Milk', 'Oat Flakes', 'Vitamin C', 'Whey Protein'],
  Sports:            ['Yoga Mat', 'Resistance Band', 'Dumbbell Set', 'Jump Rope', 'Foam Roller', 'Pull-Up Bar', 'Kettlebell', 'Gym Gloves', 'Water Bottle', 'Sports Bag'],
  Automotive:        ['Car Phone Mount', 'Dash Cam', 'Jump Starter', 'Tire Inflator', 'Car Vacuum', 'Steering Wheel Cover', 'Seat Cushion', 'Car Organizer', 'LED Headlights', 'OBD Scanner'],
  'Health & Beauty': ['Face Moisturizer', 'Sunscreen SPF50', 'Hair Dryer', 'Electric Toothbrush', 'Vitamin D3', 'Omega-3 Fish Oil', 'Collagen Supplement', 'Face Mask', 'Lip Balm', 'Hand Cream'],
  Toys:              ['LEGO Set', 'RC Car', 'Board Game', 'Puzzle 1000pc', 'Action Figure', 'Stuffed Animal', 'Play-Doh Set', 'Card Game', 'Building Blocks', 'Nerf Gun'],
};

const generateProduct = (index) => {
  const category = categories[Math.floor(Math.random() * categories.length)];
  const baseName = productsByCategory[category][Math.floor(Math.random() * 10)];
  const brand = faker.company.name().split(' ')[0];
  const cost = parseFloat((Math.random() * 400 + 5).toFixed(2));
  const price = parseFloat((cost * (1.15 + Math.random() * 0.85)).toFixed(2));

  return {
    productName: `${brand} ${baseName}`,
    sku: `SKU-${String(index).padStart(6, '0')}-${faker.string.alphanumeric(4).toUpperCase()}`,
    category,
    price,
    cost,
    stockQuantity: Math.floor(Math.random() * 500),
    reorderLevel: Math.floor(Math.random() * 50) + 5,
    lastUpdated: faker.date.recent({ days: 90 }),
  };
};

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('Cleared.');

    const TOTAL = 50000;
    const BATCH_SIZE = 1000;

    console.log(`Seeding ${TOTAL} products in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
      const batch = [];
      for (let j = i; j < Math.min(i + BATCH_SIZE, TOTAL); j++) {
        batch.push(generateProduct(j + 1));
      }
      await Product.insertMany(batch, { ordered: false });
      console.log(`Inserted ${Math.min(i + BATCH_SIZE, TOTAL)} / ${TOTAL}`);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
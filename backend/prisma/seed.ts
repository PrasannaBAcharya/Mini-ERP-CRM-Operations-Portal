import { PrismaClient, Role, CustomerType, CustomerStatus, StockMovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  
  // Clean up existing database
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.followUpNote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Cleared existing data.');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Users
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@erp.com', passwordHash, role: Role.ADMIN }
  });
  const sales = await prisma.user.create({
    data: { name: 'Sales User', email: 'sales@erp.com', passwordHash, role: Role.SALES }
  });
  const warehouse = await prisma.user.create({
    data: { name: 'Warehouse User', email: 'warehouse@erp.com', passwordHash, role: Role.WAREHOUSE }
  });
  const accounts = await prisma.user.create({
    data: { name: 'Accounts User', email: 'accounts@erp.com', passwordHash, role: Role.ACCOUNTS }
  });
  
  console.log('Created Users.');

  // Customers
  const customers: any[] = [];
  customers.push(await prisma.customer.create({
    data: {
      name: 'Ramesh Sharma', mobile: '9876543210', email: 'ramesh@retail.com',
      businessName: 'Sharma Electronics', gstNumber: '27AADCB2230M1Z2',
      type: CustomerType.RETAIL, address: 'Mumbai, Maharashtra', status: CustomerStatus.ACTIVE
    }
  }));
  customers.push(await prisma.customer.create({
    data: {
      name: 'Suresh Patel', mobile: '9876543211', email: 'suresh@wholesale.com',
      businessName: 'Patel Distributors', gstNumber: '24BBENP1234K1Z1',
      type: CustomerType.WHOLESALE, address: 'Ahmedabad, Gujarat', status: CustomerStatus.ACTIVE
    }
  }));
  customers.push(await prisma.customer.create({
    data: {
      name: 'Amit Kumar', mobile: '9876543212', email: 'amit@dist.com',
      businessName: 'Kumar Enterprises', gstNumber: '07AAACK1234L1Z1',
      type: CustomerType.DISTRIBUTOR, address: 'Delhi', status: CustomerStatus.LEAD
    }
  }));
  customers.push(await prisma.customer.create({
    data: {
      name: 'Neha Gupta', mobile: '9876543213', email: 'neha@furniture.com',
      businessName: 'Gupta Furnitures', gstNumber: '09AAACG1234M1Z1',
      type: CustomerType.RETAIL, address: 'Lucknow, UP', status: CustomerStatus.INACTIVE
    }
  }));
  customers.push(await prisma.customer.create({
    data: {
      name: 'Vikram Singh', mobile: '9876543214', email: 'vikram@stationery.com',
      businessName: 'Singh Stationers', gstNumber: '03AAACS1234N1Z1',
      type: CustomerType.WHOLESALE, address: 'Chandigarh', status: CustomerStatus.LEAD
    }
  }));
  
  console.log('Created Customers.');

  // Products
  const products: any[] = [];
  const productData = [
    { name: 'Laptop Pro', sku: 'ELEC-001', category: 'Electronics', unitPrice: 55000, currentStock: 50 },
    { name: 'Wireless Mouse', sku: 'ELEC-002', category: 'Electronics', unitPrice: 1500, currentStock: 200 },
    { name: 'Office Chair', sku: 'FURN-001', category: 'Furniture', unitPrice: 4500, currentStock: 30 },
    { name: 'Wooden Desk', sku: 'FURN-002', category: 'Furniture', unitPrice: 12000, currentStock: 15 },
    { name: 'A4 Paper Ream', sku: 'STAT-001', category: 'Stationery', unitPrice: 250, currentStock: 500 },
    { name: 'Ballpoint Pens (Box)', sku: 'STAT-002', category: 'Stationery', unitPrice: 150, currentStock: 1000 },
    { name: 'Monitor 24"', sku: 'ELEC-003', category: 'Electronics', unitPrice: 11000, currentStock: 40 },
    { name: 'Bookshelf', sku: 'FURN-003', category: 'Furniture', unitPrice: 8500, currentStock: 20 }
  ];

  for (const p of productData) {
    products.push(await prisma.product.create({ data: p }));
  }
  console.log('Created Products.');

  // Challans
  // 1. Confirmed Challan (will adjust stock)
  await prisma.$transaction(async (tx) => {
    const challan1 = await tx.challan.create({
      data: {
        challanNumber: 'CH-0001',
        customerId: customers[0].id,
        status: ChallanStatus.CONFIRMED,
        createdBy: admin.id,
        totalQuantity: 3,
        items: {
          create: [
            {
              productId: products[0].id,
              productNameSnapshot: products[0].name,
              skuSnapshot: products[0].sku,
              unitPriceSnapshot: products[0].unitPrice,
              quantity: 1
            },
            {
              productId: products[1].id,
              productNameSnapshot: products[1].name,
              skuSnapshot: products[1].sku,
              unitPriceSnapshot: products[1].unitPrice,
              quantity: 2
            }
          ]
        }
      }
    });

    // Adjust stock for CONFIRMED challan
    await tx.product.update({
      where: { id: products[0].id },
      data: { currentStock: { decrement: 1 } }
    });
    await tx.stockMovement.create({
      data: {
        productId: products[0].id,
        quantityChanged: 1,
        type: StockMovementType.OUT,
        reason: 'Challan CH-0001 confirmed',
        createdBy: admin.id
      }
    });

    await tx.product.update({
      where: { id: products[1].id },
      data: { currentStock: { decrement: 2 } }
    });
    await tx.stockMovement.create({
      data: {
        productId: products[1].id,
        quantityChanged: 2,
        type: StockMovementType.OUT,
        reason: 'Challan CH-0001 confirmed',
        createdBy: admin.id
      }
    });
  });
  console.log('Created Confirmed Challan CH-0001.');

  // 2. Draft Challan (no stock adjustment)
  await prisma.challan.create({
    data: {
      challanNumber: 'CH-0002',
      customerId: customers[1].id,
      status: ChallanStatus.DRAFT,
      createdBy: sales.id,
      totalQuantity: 10,
      items: {
        create: [
          {
            productId: products[4].id,
            productNameSnapshot: products[4].name,
            skuSnapshot: products[4].sku,
            unitPriceSnapshot: products[4].unitPrice,
            quantity: 10
          }
        ]
      }
    }
  });
  console.log('Created Draft Challan CH-0002.');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

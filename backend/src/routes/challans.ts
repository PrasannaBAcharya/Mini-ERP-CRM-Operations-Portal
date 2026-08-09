import { Router } from 'express';
import { PrismaClient, Prisma, ChallanStatus, StockMovementType } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive()
});

const challanSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(itemSchema).min(1)
});

router.use(authenticateToken);

// GET /api/challans
router.get('/', async (req, res, next) => {
  try {
    const { status, customerId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: Prisma.ChallanWhereInput = {};
    if (status) where.status = status as ChallanStatus;
    if (customerId) where.customerId = customerId as string;

    const [data, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          customer: { select: { name: true, businessName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.challan.count({ where })
    ]);

    res.json({
      data,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/challans/:id
router.get('/:id', async (req, res, next) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Not Found', message: 'Challan not found' });
    }

    res.json(challan);
  } catch (error) {
    next(error);
  }
});

// POST /api/challans
router.post('/', requireRoles('ADMIN', 'SALES'), validate(challanSchema), async (req, res, next) => {
  try {
    const { customerId, items } = req.body;

    const totalQuantity = items.reduce((acc: number, item: any) => acc + item.quantity, 0);

    const count = await prisma.challan.count();
    const challanNumber = 'CH-' + String(count + 1).padStart(4, '0');

    // Prepare items with snapshots
    const itemsData = await Promise.all(items.map(async (item: any) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Product with ID ${item.productId} not found`);
      return {
        productId: product.id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: item.quantity
      };
    }));

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId,
        status: ChallanStatus.DRAFT,
        createdBy: req.user!.id,
        totalQuantity,
        items: {
          create: itemsData
        }
      },
      include: { items: true }
    });

    res.status(201).json(challan);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(400).json({ error: 'Bad Request', message: error.message });
    }
    next(error);
  }
});

// PATCH /api/challans/:id
router.patch('/:id', requireRoles('ADMIN', 'SALES'), validate(challanSchema), async (req, res, next) => {
  try {
    const { customerId, items } = req.body;
    const challanId = req.params.id;

    const existingChallan = await prisma.challan.findUnique({ where: { id: challanId } });
    if (!existingChallan) return res.status(404).json({ error: 'Not Found', message: 'Challan not found' });
    if (existingChallan.status !== 'DRAFT') return res.status(400).json({ error: 'Bad Request', message: 'Only DRAFT challans can be edited' });

    const totalQuantity = items.reduce((acc: number, item: any) => acc + item.quantity, 0);

    const itemsData = await Promise.all(items.map(async (item: any) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Product with ID ${item.productId} not found`);
      return {
        productId: product.id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: item.quantity
      };
    }));

    const updatedChallan = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.challanItem.deleteMany({ where: { challanId } });
      
      // Update challan and create new items
      return await tx.challan.update({
        where: { id: challanId },
        data: {
          customerId,
          totalQuantity,
          items: {
            create: itemsData
          }
        },
        include: { items: true }
      });
    });

    res.json(updatedChallan);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return res.status(400).json({ error: 'Bad Request', message: error.message });
    }
    next(error);
  }
});

// POST /api/challans/:id/confirm
router.post('/:id/confirm', requireRoles('ADMIN', 'SALES'), async (req, res, next) => {
  try {
    const challanId = req.params.id;

    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({ 
        where: { id: challanId }, 
        include: { items: { include: { product: true } } } 
      });

      if (!challan) throw new Error('Challan not found');
      if (challan.status !== 'DRAFT') throw new Error('Only DRAFT challans can be confirmed');

      // Check stock and update
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.currentStock < item.quantity) {
          throw { 
            type: 'STOCK_ERROR', 
            message: `Insufficient stock for product ${product?.name || item.productNameSnapshot}. Required: ${item.quantity}, Available: ${product?.currentStock || 0}`
          };
        }

        // Deduct stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } }
        });

        // Record movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            type: StockMovementType.OUT,
            reason: `Challan ${challan.challanNumber} confirmed`,
            createdBy: req.user!.id
          }
        });
      }

      // Update status
      return await tx.challan.update({
        where: { id: challanId },
        data: { status: ChallanStatus.CONFIRMED },
        include: { items: true }
      });
    });

    res.json(result);
  } catch (error: any) {
    if (error.type === 'STOCK_ERROR') {
      return res.status(400).json({ error: 'Insufficient Stock', message: error.message });
    }
    if (error.message === 'Challan not found') {
      return res.status(404).json({ error: 'Not Found', message: error.message });
    }
    if (error.message === 'Only DRAFT challans can be confirmed') {
      return res.status(400).json({ error: 'Bad Request', message: error.message });
    }
    next(error);
  }
});

// POST /api/challans/:id/cancel
router.post('/:id/cancel', requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const challanId = req.params.id;

    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id: challanId },
        include: { items: true }
      });

      if (!challan) throw new Error('Challan not found');
      if (challan.status === 'CANCELLED') throw new Error('Challan is already cancelled');

      if (challan.status === 'CONFIRMED') {
        // Restore stock
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              type: StockMovementType.IN,
              reason: `Challan ${challan.challanNumber} cancelled`,
              createdBy: req.user!.id
            }
          });
        }
      }

      return await tx.challan.update({
        where: { id: challanId },
        data: { status: ChallanStatus.CANCELLED }
      });
    });

    res.json(result);
  } catch (error: any) {
    if (error.message === 'Challan not found') {
      return res.status(404).json({ error: 'Not Found', message: error.message });
    }
    if (error.message === 'Challan is already cancelled') {
      return res.status(400).json({ error: 'Bad Request', message: error.message });
    }
    next(error);
  }
});

export default router;

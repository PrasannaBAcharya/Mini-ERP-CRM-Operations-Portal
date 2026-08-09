import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  unitPrice: z.number().positive(),
  minStockAlert: z.number().int().min(0).optional(),
  location: z.string().optional()
});

const stockMovementSchema = z.object({
  quantityChanged: z.number().int().positive(),
  type: z.enum(['IN', 'OUT']),
  reason: z.string().min(1)
});

router.use(authenticateToken);

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const { search, category, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: Prisma.ProductWhereInput = {};
    
    if (category) {
      where.category = category as string;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where })
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

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        stockMovements: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Not Found', message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id/stock-history
router.get('/:id/stock-history', async (req, res, next) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where = { productId: req.params.id };

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockMovement.count({ where })
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

// POST /api/products
router.post('/', requireRoles('ADMIN', 'WAREHOUSE'), validate(productSchema), async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { sku: req.body.sku } });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'SKU already exists' });
    }

    const product = await prisma.product.create({
      data: req.body
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id
router.put('/:id', requireRoles('ADMIN', 'WAREHOUSE'), validate(productSchema), async (req, res, next) => {
  try {
    const existing = await prisma.product.findFirst({
      where: {
        sku: req.body.sku,
        id: { not: req.params.id }
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'SKU already exists on another product' });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id
router.delete('/:id', requireRoles('ADMIN'), async (req, res, next) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/products/:id/stock-movement
router.post('/:id/stock-movement', requireRoles('ADMIN', 'WAREHOUSE'), validate(stockMovementSchema), async (req, res, next) => {
  try {
    const { quantityChanged, type, reason } = req.body;
    const productId = req.params.id;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Product not found');

      let newStock = product.currentStock;
      if (type === 'IN') {
        newStock += quantityChanged;
      } else if (type === 'OUT') {
        if (product.currentStock < quantityChanged) {
          throw { type: 'STOCK_ERROR', message: 'Insufficient stock for this operation' };
        }
        newStock -= quantityChanged;
      }

      await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged,
          type,
          reason,
          createdBy: req.user!.id
        }
      });

      return await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock }
      });
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error.type === 'STOCK_ERROR') {
      return res.status(400).json({ error: 'Stock Error', message: error.message });
    }
    next(error);
  }
});

export default router;

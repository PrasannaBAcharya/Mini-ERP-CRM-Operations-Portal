import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().regex(/^\d{10}$/, 'Must be a 10 digit number'),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().or(z.literal('')),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(1),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  followUpDate: z.string().datetime().optional().nullable()
});

const noteSchema = z.object({
  note: z.string().min(1)
});

// Use authentication on all routes
router.use(authenticateToken);

// GET /api/customers
router.get('/', async (req, res, next) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: Prisma.CustomerWhereInput = {};
    
    if (status) {
      where.status = status as any;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { mobile: { contains: search as string, mode: 'insensitive' } },
        { businessName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
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

// GET /api/customers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { notes: { orderBy: { createdAt: 'desc' } } }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Not Found', message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// POST /api/customers
router.post('/', requireRoles('ADMIN', 'SALES'), validate(customerSchema), async (req, res, next) => {
  try {
    const customer = await prisma.customer.create({
      data: req.body
    });
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id
router.put('/:id', requireRoles('ADMIN', 'SALES'), validate(customerSchema), async (req, res, next) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/customers/:id (Soft Delete)
router.delete('/:id', requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Customer marked as inactive', id: customer.id });
  } catch (error) {
    next(error);
  }
});

// POST /api/customers/:id/notes
router.post('/:id/notes', requireRoles('ADMIN', 'SALES'), validate(noteSchema), async (req, res, next) => {
  try {
    const note = await prisma.followUpNote.create({
      data: {
        customerId: req.params.id,
        note: req.body.note,
        createdBy: req.user!.id
      }
    });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

export default router;

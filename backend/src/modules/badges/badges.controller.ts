import { Request, Response } from 'express';
import { badgesService } from './badges.service';
import { asyncHandler } from '../../middleware/error.middleware';
import {
  generateBadgeSchema,
  badgeQuerySchema,
} from './badges.types';

export const getBadges = asyncHandler(async (req: Request, res: Response) => {
  const query = badgeQuerySchema.parse(req.query);
  const result = await badgesService.getBadges(query);
  res.json(result);
});

export const getBadgeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const badge = await badgesService.getBadgeById(id);
  res.json(badge);
});

export const generateBadge = asyncHandler(async (req: Request, res: Response) => {
  const data = generateBadgeSchema.parse(req.body);
  const badge = await badgesService.generateBadge(data);
  res.status(201).json(badge);
});

export const markAsPrinted = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { printedBy } = req.body;
  
  if (!printedBy) {
    return res.status(400).json({ message: 'printedBy is required' });
  }
  
  const badge = await badgesService.markAsPrinted(id, printedBy);
  return res.json({ message: 'Badge marked as printed', badge });
});

export const deleteBadge = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await badgesService.deleteBadge(id);
  res.status(204).send();
});

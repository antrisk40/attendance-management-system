import { z } from 'zod';
import { successResponse } from '../utils/response.js';
import {
  listCompanies,
  getCompanyById as getCompanyByIdSvc,
  createCompany as createCompanySvc,
  updateCompany as updateCompanySvc,
  listCompanyUsers as listCompanyUsersSvc,
  listCompanyAttendance as listCompanyAttendanceSvc,
  listAuditLogs as listAuditLogsSvc,
} from '../services/superAdminService.js';

const createCompanySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const getCompanies = async (req, res) => {
  const { page = 1, limit = 20, isActive } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
  const { companies, total } = await listCompanies({
    page: pageNum,
    limit: limitNum,
    isActive: isActiveBool,
  });

  return successResponse(
    res,
    {
      companies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Companies retrieved'
  );
};

export const getCompanyById = async (req, res) => {
  const { id } = req.params;
  const company = await getCompanyByIdSvc({ companyId: id });
  return successResponse(res, company, 'Company retrieved');
};

export const createCompany = async (req, res) => {
  const { name, slug } = createCompanySchema.parse(req.body);
  const company = await createCompanySvc({ name, slug });
  return successResponse(res, company, 'Company created', 201);
};

export const updateCompany = async (req, res) => {
  const { id } = req.params;
  const updateData = updateCompanySchema.parse(req.body);
  const company = await updateCompanySvc({ companyId: id, updateData });
  return successResponse(res, company, 'Company updated');
};

export const getCompanyUsers = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const { users, total } = await listCompanyUsersSvc({
    companyId: id,
    page: pageNum,
    limit: limitNum,
  });

  return successResponse(
    res,
    {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Company users retrieved'
  );
};

export const getCompanyAttendance = async (req, res) => {
  const { id } = req.params;
  const { date = new Date().toISOString().split('T')[0], page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const { records, total } = await listCompanyAttendanceSvc({
    companyId: id,
    date,
    page: pageNum,
    limit: limitNum,
  });

  return successResponse(
    res,
    {
      records,
      date,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Company attendance retrieved'
  );
};

export const getAllAuditLogs = async (req, res) => {
  const { page = 1, limit = 50, companyId, action } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const { logs, total } = await listAuditLogsSvc({
    page: pageNum,
    limit: limitNum,
    companyId,
    action,
  });

  return successResponse(
    res,
    {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Audit logs retrieved'
  );
};

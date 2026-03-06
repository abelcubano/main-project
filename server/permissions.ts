import type { User } from "@shared/schema";

export function canAccessPortal(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permPortalAccess === true;
}

export function canViewBilling(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permBillingView === true;
}

export function canReceiveInvoices(user: User): boolean {
  if (user.role === "admin") return false;
  return user.permBillingReceiveInvoices === true;
}

export function canMakePayments(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permBillingMakePayments === true;
}

export function canViewServices(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permServicesView === true;
}

export function canManageServices(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permServicesManage === true;
}

export function canViewTechnical(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permTechnicalView === true;
}

export function canManageTechnical(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permTechnicalManage === true;
}

export function canViewSupport(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permSupportView === true;
}

export function canCreateSupport(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permSupportCreate === true;
}

export function canSubmitSmarthands(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permSupportSmarthands === true;
}

export function canManageUsers(user: User): boolean {
  if (user.role === "admin") return true;
  return user.permAdminUsers === true;
}

export function getUserPermissionSummary(user: User): Record<string, boolean> {
  return {
    permPortalAccess: user.permPortalAccess ?? true,
    permBillingView: user.permBillingView ?? false,
    permBillingReceiveInvoices: user.permBillingReceiveInvoices ?? false,
    permBillingMakePayments: user.permBillingMakePayments ?? false,
    permServicesView: user.permServicesView ?? false,
    permServicesManage: user.permServicesManage ?? false,
    permTechnicalView: user.permTechnicalView ?? false,
    permTechnicalManage: user.permTechnicalManage ?? false,
    permSupportView: user.permSupportView ?? false,
    permSupportCreate: user.permSupportCreate ?? false,
    permSupportSmarthands: user.permSupportSmarthands ?? false,
    permNotifyMaintenance: user.permNotifyMaintenance ?? false,
    permNotifyBilling: user.permNotifyBilling ?? false,
    permNotifyIncidents: user.permNotifyIncidents ?? false,
    permAdminUsers: user.permAdminUsers ?? false,
  };
}

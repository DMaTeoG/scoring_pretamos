from rest_framework.permissions import BasePermission
from apps.accounts.models import Role


class IsAnalyst(BasePermission):
    """Permite el acceso a usuarios con rol Analista o Administrador."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in [Role.ANALYST, Role.ADMIN]
        )


class IsCompanyUser(BasePermission):
    """Permite el acceso a usuarios con rol Empresa o Administrador."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in [Role.COMPANY, Role.ADMIN]
        )


class IsAdminUserRole(BasePermission):
    """Permite el acceso exclusivamente a Administradores."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == Role.ADMIN or request.user.is_superuser)
        )

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Assumes the model instance has an 'user' field (can be owner, author, etc.).
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the object.
        # Support different owner field names: user, owner, author
        owner = getattr(obj, 'user', None) or getattr(obj, 'owner', None) or getattr(obj, 'author', None)
        return owner == request.user


class IsPortfolioOwnerOrReadOnly(IsOwnerOrReadOnly):
    """
    Specific permission for portfolio items.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        
        # Portfolio items use 'user' field as owner
        return getattr(obj, 'user', None) == request.user

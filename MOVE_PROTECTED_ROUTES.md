# Move Protected Routes Instructions

## What We Just Did ✅
1. Removed AuthWrapper from root `app/layout.tsx`
2. Created `app/(protected)/layout.tsx` with AuthWrapper

## What You Need to Do Now

Move these folders into the `(protected)` route group:

```powershell
# Move popup
Move-Item -Path "app/popup" -Destination "app/(protected)/popup" -Force

# Move library  
Move-Item -Path "app/library" -Destination "app/(protected)/library" -Force
```

## Optional: Move Other Protected Routes
If these routes should also be protected, move them too:
```powershell
Move-Item -Path "app/mascot-demo" -Destination "app/(protected)/mascot-demo" -Force
Move-Item -Path "app/sparky-demo" -Destination "app/(protected)/sparky-demo" -Force
```

## Final Structure
```
app/
├── (public)/              # No auth required
│   ├── layout.tsx        # Public layout
│   ├── page.tsx          # Landing page "/"
│   ├── signin/
│   │   └── page.tsx      # "/signin"
│   └── signup/
│       └── page.tsx      # "/signup"
├── (protected)/           # Auth required
│   ├── layout.tsx        # Has AuthWrapper
│   ├── popup/
│   │   └── page.tsx      # "/popup" (protected)
│   └── library/
│       └── page.tsx      # "/library" (protected)
├── layout.tsx            # Root layout (no AuthWrapper)
└── globals.css
```

## Why This Works
- Root layout provides fonts and global styles
- `(public)` routes are accessible to everyone
- `(protected)` routes require authentication via AuthWrapper
- No infinite loops because public routes don't check auth

# CreateButton Component Documentation

## Overview
The CreateButton is a circular orange "+" button positioned in the secondary navbar between "Inspiration" and "Creators" links. It provides quick access to content creation features.

## Features
- ✅ Circular design with orange background (#ffa000)
- ✅ White plus icon that rotates 45° when dropdown is open
- ✅ Positioned between "Inspiration" and "Creators" in secondary navbar
- ✅ Tooltip "Create" on hover (desktop only)
- ✅ Mobile-responsive design
- ✅ Dropdown menu with different options based on authentication status
- ✅ Click outside to close functionality
- ✅ Keyboard accessibility (Escape key to close)

## Layout Order
```
Home | Inspiration | [ + ] | Creators | Freelance
```

## Dropdown Options

### For Authenticated Users:
- **New Post** 📝 - Share your thoughts
- **New Blog** 📖 - Write an article  
- **Upload Work** 🎨 - Share your portfolio
- **New Project** 🚀 - Start something new

### For Non-Authenticated Users:
- **Explore VikraHub** 🌟 - Discover amazing creators
- **Join Community** 👥 - Become a member

## Component Structure
```
frontend/src/components/common/
├── CreateButton.js          # Main component logic
└── CreateButton.css         # Styling and animations
```

## Usage
The component is automatically included in the Layout.js secondary navbar. No additional imports needed in pages.

## Styling
- **Button Size**: 36px × 36px (desktop), 30px × 30px (mobile)
- **Colors**: Orange (#ffa000) background, white icon
- **Animation**: Smooth hover effects and icon rotation
- **Shadow**: Subtle drop shadow with hover enhancement

## Customization

### Adding New Create Options
Edit `CreateButton.js` and modify the `createOptions` array:

```javascript
const createOptions = isAuthenticated ? [
  { 
    key: 'your-action', 
    label: 'Your Label', 
    icon: '🔥',
    description: 'Your description'
  },
  // ... existing options
] : [
  // ... non-authenticated options
];
```

### Connecting to Navigation
Update the `handleCreateAction` function in `CreateButton.js`:

```javascript
const handleCreateAction = (action) => {
  console.log(`Creating: ${action}`);
  setIsOpen(false);
  
  switch(action) {
    case 'post':
      navigate('/create/post');
      break;
    case 'blog':
      navigate('/create/blog');
      break;
    case 'work':
      navigate('/upload-asset');
      break;
    case 'project':
      navigate('/create/project');
      break;
    default:
      console.log('Unknown action:', action);
  }
};
```

### Mobile Behavior
- Button centers properly in the navbar row
- Dropdown width adjusts to screen size (max 300px on mobile)
- Touch-friendly sizing and spacing

## Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- High contrast design

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- CSS Grid and Flexbox support required

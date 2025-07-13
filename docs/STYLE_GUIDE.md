# Style System

This project uses a centralized style system to keep visual design consistent.

## CSS Variables

Common colors are declared in `src/styles/variables.css`. Use these variables instead of hard-coded color values.

```css
:root {
  --primary-color: #3498db;
  --primary-color-dark: #2980b9;
  --success-color: #28a745;
  --error-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #2196f3;
  --text-color: #333;
  --muted-color: #666;
  --background-color: #f5f7fa;
}
```

Import the variables in `src/main.js`:

```javascript
import './styles/variables.css'
```

## Style Service

`src/services/styleService.js` provides helper functions for computing task styles. Components should call these methods instead of duplicating style logic.

Example:

```javascript
import { styleService } from '../services/styleService'

methods: {
  getTaskStyle(task) {
    return styleService.getTaskStyle(task)
  }
}
```

## Conventions

- Prefer CSS variables for colors and common values.
- Avoid inline styles when possible.
- Use the style service for task-related style calculations.

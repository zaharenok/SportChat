# Accessibility & Mobile Optimization Guide

## Current Accessibility Issues & Solutions

### 1. Critical Accessibility Problems

#### Issue: Emoji-Dependent UI Elements
**Current Code:**
```tsx
<button>🗑️</button>  // Trash icon
<h4>💪 Популярные упражнения:</h4>  // Section header
```

**Problems:**
- Screen readers announce emojis as "wastebasket symbol" instead of "delete"
- Inconsistent emoji rendering across platforms
- Cultural interpretation differences
- No semantic meaning

**Solution:**
```tsx
import { Trash2, Dumbbell } from "lucide-react"

<Button
  variant="outline"
  size="sm"
  aria-label="Очистить историю чата"
  className="focus:ring-2 focus:ring-primary focus:outline-none"
>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
  <span className="sr-only">Очистить историю</span>
</Button>

<CardTitle className="flex items-center gap-2">
  <Dumbbell className="h-4 w-4" aria-hidden="true" />
  Популярные упражнения
</CardTitle>
```

#### Issue: Missing ARIA Labels and Roles
**Current Problems:**
- Interactive elements lack descriptive labels
- No role definitions for custom components
- Missing live regions for dynamic content

**Solution:**
```tsx
// Chat input with proper ARIA
<div 
  className="chat-input" 
  role="region" 
  aria-label="Область ввода сообщения"
>
  <Textarea
    value={inputMessage}
    onChange={handleInputChange}
    placeholder="Расскажите о своей тренировке..."
    aria-label="Поле ввода сообщения о тренировке"
    aria-describedby="input-help"
    aria-invalid={hasError}
    maxLength={500}
  />
  <div id="input-help" className="sr-only">
    Введите описание вашей тренировки. Максимум 500 символов.
  </div>
  
  <Button
    onClick={sendMessage}
    disabled={!inputMessage.trim() || isLoading}
    aria-label={isLoading ? "Отправка сообщения..." : "Отправить сообщение"}
    aria-describedby="send-status"
  >
    <Send className="h-4 w-4" aria-hidden="true" />
  </Button>
  
  <div id="send-status" className="sr-only" aria-live="polite">
    {isLoading ? "Сообщение отправляется" : ""}
  </div>
</div>

// Messages with proper ARIA
<div 
  className="chat-messages" 
  role="log" 
  aria-label="История сообщений"
  aria-live="polite"
>
  {messages.map((message, index) => (
    <div
      key={message.id}
      role="article"
      aria-label={`${message.is_user ? 'Ваше' : 'Сообщение ИИ'} сообщение от ${formatTimestamp(message.timestamp)}`}
      className={`message ${message.is_user ? 'user-message' : 'ai-message'}`}
    >
      <div className="message-content">
        {message.message}
      </div>
      <time 
        className="message-timestamp"
        dateTime={message.timestamp}
        aria-label={`Время отправки: ${formatTimestamp(message.timestamp)}`}
      >
        {formatTimestamp(message.timestamp)}
      </time>
    </div>
  ))}
</div>
```

#### Issue: Poor Keyboard Navigation
**Current Problems:**
- Tab order not logical
- Focus indicators weak or missing
- Keyboard traps in quick actions

**Solution:**
```tsx
// Enhanced keyboard navigation
const QuickActions = ({ isVisible, onQuickInput }) => {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const buttonRefs = useRef([])

  const handleKeyDown = (event, index) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = (index + 1) % buttonRefs.current.length
        buttonRefs.current[nextIndex]?.focus()
        setFocusedIndex(nextIndex)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = index === 0 ? buttonRefs.current.length - 1 : index - 1
        buttonRefs.current[prevIndex]?.focus()
        setFocusedIndex(prevIndex)
        break
      case 'Home':
        event.preventDefault()
        buttonRefs.current[0]?.focus()
        setFocusedIndex(0)
        break
      case 'End':
        event.preventDefault()
        const lastIndex = buttonRefs.current.length - 1
        buttonRefs.current[lastIndex]?.focus()
        setFocusedIndex(lastIndex)
        break
      case 'Escape':
        // Exit quick actions focus
        document.querySelector('.chat-input textarea')?.focus()
        break
    }
  }

  return (
    <Card
      className={`quick-actions ${!isVisible ? 'sr-only' : ''}`}
      role="region"
      aria-label="Быстрые действия для ввода"
    >
      <CardContent>
        <div
          role="grid"
          aria-label="Популярные упражнения"
          className="grid grid-cols-4 gap-2"
        >
          {exercises.map((exercise, index) => (
            <Button
              key={exercise}
              ref={el => buttonRefs.current[index] = el}
              role="gridcell"
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => onQuickInput(exercise)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="focus:ring-2 focus:ring-primary focus:outline-none"
              aria-describedby={`exercise-help-${index}`}
            >
              {exercise}
              <span id={`exercise-help-${index}`} className="sr-only">
                Нажмите чтобы добавить {exercise} в сообщение
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. Color Contrast Improvements

#### Current Issues:
- Insufficient contrast ratios
- Color-dependent information
- No high contrast mode

**Solution:**
```css
/* Enhanced color system with better contrast */
:root {
  /* Improved contrast ratios */
  --primary: 214 84% 45%;        /* Better contrast ratio */
  --primary-foreground: 0 0% 100%;
  --secondary: 220 14% 16%;      /* Darker for better contrast */
  --secondary-foreground: 0 0% 100%;
  --muted: 220 13% 91%;
  --muted-foreground: 220 9% 25%;
  --accent: 39 87% 45%;          /* Adjusted for accessibility */
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 37%;      /* Better contrast */
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 214 84% 45%;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --primary: 214 100% 30%;
    --secondary: 0 0% 10%;
    --muted: 0 0% 95%;
    --muted-foreground: 0 0% 15%;
    --border: 0 0% 20%;
  }
}

/* Focus indicators with high contrast */
.focus\\:ring-2:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring);
}
```

### 3. Screen Reader Optimization

#### Enhanced Screen Reader Support:
```tsx
// Comprehensive screen reader support
const ChatInterface = () => {
  const [announcements, setAnnouncements] = useState('')
  
  const announceToScreenReader = (message) => {
    setAnnouncements(message)
    setTimeout(() => setAnnouncements(''), 100)
  }

  const handleMessageSent = () => {
    announceToScreenReader('Сообщение отправлено. AI анализирует ваш запрос.')
  }

  const handleMessageReceived = () => {
    announceToScreenReader('Получен ответ от AI. Новое сообщение добавлено в чат.')
  }

  return (
    <div className="chat-interface">
      {/* Screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcements}
      </div>

      {/* Skip navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground p-2 rounded"
      >
        Перейти к основному содержимому
      </a>

      <main id="main-content" tabIndex={-1}>
        {/* Chat content */}
      </main>
    </div>
  )
}
```

## Mobile Optimization Strategies

### 1. Touch Target Optimization

#### Current Issues:
- Touch targets smaller than 44px
- Insufficient spacing between interactive elements
- Poor thumb reach zones

**Solution:**
```tsx
// Mobile-optimized touch targets
const MobileOptimizedButton = ({ children, ...props }) => (
  <Button
    {...props}
    className={cn(
      // Minimum 44px touch target
      "min-h-[44px] min-w-[44px]",
      // Touch-friendly padding
      "px-4 py-3",
      // Improved hit area
      "relative after:absolute after:inset-[-8px] after:content-['']",
      props.className
    )}
  >
    {children}
  </Button>
)

// Chat input optimized for mobile
const MobileChatInput = () => (
  <div className="p-4 pb-safe-bottom">
    <div className="flex gap-3 items-end">
      <Textarea
        className={cn(
          "min-h-[44px] text-base", // Prevent zoom on iOS
          "rounded-2xl resize-none",
          "focus:ring-2 focus:ring-primary"
        )}
        placeholder="Расскажите о тренировке..."
      />
      <Button
        size="lg"
        className="min-h-[44px] min-w-[44px] rounded-full shrink-0"
        aria-label="Отправить сообщение"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  </div>
)
```

### 2. Responsive Layout Improvements

#### Current Issues:
- Complex responsive breakpoints
- Horizontal scrolling on small screens
- Poor landscape orientation support

**Solution:**
```tsx
// Simplified responsive layout with container queries
const ResponsiveChatLayout = () => (
  <div className="chat-container h-screen flex flex-col max-w-none">
    {/* Header - adapts to screen size */}
    <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        <ChatHeader />
      </div>
    </header>

    {/* Main content - responsive grid */}
    <main className="flex-1 overflow-hidden">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr]">
        {/* Quick actions sidebar on large screens */}
        <aside className="hidden lg:block border-r bg-muted/40">
          <QuickActions />
        </aside>

        {/* Chat area */}
        <div className="flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <MessageList />
          </ScrollArea>
          
          {/* Mobile quick actions - collapsible */}
          <div className="lg:hidden">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full">
                  Быстрые действия
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <QuickActions />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <ChatInput />
        </div>
      </div>
    </main>
  </div>
)

// Responsive workout history
const ResponsiveWorkoutHistory = () => (
  <div className="container mx-auto p-4 space-y-6">
    {/* Stats - responsive grid */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <StatCard key={stat.key} {...stat} />
      ))}
    </div>

    {/* Main content - stacked on mobile */}
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <WorkoutList />
      <WorkoutDetails />
    </div>
  </div>
)
```

### 3. Performance Optimization for Mobile

#### Lazy Loading Implementation:
```tsx
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const WorkoutHistory = lazy(() => import('./components/WorkoutHistory'))
const WorkoutDetails = lazy(() => import('./components/WorkoutDetails'))

// Virtualized lists for large datasets
import { FixedSizeList as List } from 'react-window'

const VirtualizedMessageList = ({ messages }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <MessageBubble message={messages[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={messages.length}
      itemSize={80}
      className="message-list"
    >
      {Row}
    </List>
  )
}

// Progressive image loading
const OptimizedImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className="relative">
      {!isLoaded && !error && (
        <Skeleton className="absolute inset-0" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        {...props}
      />
    </div>
  )
}
```

### 4. iOS Safari & Android Chrome Specific Optimizations

```tsx
// Handle iOS viewport units and safe areas
const MobileLayout = () => (
  <div className="h-screen h-[100dvh] flex flex-col">
    {/* Use dynamic viewport height */}
    <div className="flex-1 overflow-hidden">
      {/* Content */}
    </div>
    
    {/* Input area with safe area padding */}
    <div className="pb-safe-bottom bg-background border-t">
      <ChatInput />
    </div>
  </div>
)

// Handle iOS keyboard behavior
const useIOSKeyboardFix = () => {
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    if (isIOS) {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        let originalContent = viewport.content
        
        const handleFocus = () => {
          viewport.content = 'width=device-width, initial-scale=1, user-scalable=0'
        }
        
        const handleBlur = () => {
          viewport.content = originalContent
        }
        
        document.addEventListener('focusin', handleFocus)
        document.addEventListener('focusout', handleBlur)
        
        return () => {
          document.removeEventListener('focusin', handleFocus)
          document.removeEventListener('focusout', handleBlur)
        }
      }
    }
  }, [])
}

// CSS for mobile optimizations
```

```css
/* Mobile-specific CSS optimizations */
@supports (height: 100dvh) {
  .h-screen {
    height: 100dvh;
  }
}

/* iOS safe area support */
@supports (padding: max(0px)) {
  .pb-safe-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  
  .pt-safe-top {
    padding-top: max(1rem, env(safe-area-inset-top));
  }
}

/* Prevent iOS zoom on form inputs */
input[type="text"],
input[type="email"],
input[type="password"],
textarea,
select {
  font-size: 16px;
}

/* Improved touch scrolling */
.scroll-smooth {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Better tap highlight */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Focus visible for keyboard users only */
.focus-visible\:ring-2:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .border {
    border-width: 2px;
  }
  
  .focus\:ring-2:focus {
    outline: 3px solid var(--ring);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Testing Strategy

### Accessibility Testing Checklist:
1. **Automated Testing:**
   - axe-core integration
   - Lighthouse accessibility audits
   - WAVE browser extension

2. **Manual Testing:**
   - Screen reader navigation (NVDA, JAWS, VoiceOver)
   - Keyboard-only navigation
   - High contrast mode testing
   - Color blindness simulation

3. **Mobile Testing:**
   - Real device testing across iOS/Android
   - Various screen sizes (320px - 1024px+)
   - Touch target validation
   - Performance on low-end devices

### Implementation Timeline:
- **Week 1:** Critical accessibility fixes
- **Week 2:** Mobile touch optimization
- **Week 3:** Screen reader enhancements
- **Week 4:** Performance optimization
- **Week 5:** Testing and validation
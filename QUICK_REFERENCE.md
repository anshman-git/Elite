# Quick Reference: Common UI Patterns

Quick copy-paste snippets for common use cases.

## 📋 Form Patterns

### Basic Form with Validation
```jsx
import { useState } from 'react';
import { Input, Button, Card } from './components/ui';
import { AnimatedCheckbox, AnimatedDropdown } from './components/InteractiveElements';

function MyForm() {
  const [form, setForm] = useState({ email: '', agreed: false, role: '' });
  const [errors, setErrors] = useState({});
  
  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email required';
    if (!form.agreed) newErrors.agreed = 'Must agree to terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form valid:', form);
    }
  };

  return (
    <Card className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          error={!!errors.email}
          success={form.email && !errors.email}
        />
        <AnimatedDropdown
          items={[
            { label: 'User', value: 'user' },
            { label: 'Admin', value: 'admin' },
          ]}
          value={form.role}
          onChange={(v) => setForm({ ...form, role: v })}
        />
        <AnimatedCheckbox
          checked={form.agreed}
          onChange={(v) => setForm({ ...form, agreed: v })}
          label="I agree to the terms"
        />
        <Button type="submit" className="w-full">Submit</Button>
      </form>
    </Card>
  );
}
```

### Settings Form with Tabs
```jsx
import { Tabs, Card, Button } from './components/ui';
import { AnimatedSwitch, AnimatedSlider } from './components/InteractiveElements';

function SettingsForm() {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    volume: 50,
  });

  const tabs = [
    {
      label: 'General',
      content: (
        <div className="space-y-4">
          <AnimatedSwitch
            enabled={settings.darkMode}
            onChange={(v) => setSettings({ ...settings, darkMode: v })}
            label="Dark Mode"
          />
        </div>
      ),
    },
    {
      label: 'Sound',
      content: (
        <div className="space-y-4">
          <AnimatedSwitch
            enabled={settings.notifications}
            onChange={(v) => setSettings({ ...settings, notifications: v })}
            label="Notifications"
          />
          <AnimatedSlider
            value={settings.volume}
            onChange={(v) => setSettings({ ...settings, volume: v })}
            label="Volume"
          />
        </div>
      ),
    },
  ];

  return (
    <Card>
      <Tabs tabs={tabs} />
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1">Cancel</Button>
        <Button className="flex-1">Save</Button>
      </div>
    </Card>
  );
}
```

## 📊 Dashboard Patterns

### Stats Grid
```jsx
import { StatsCard } from './components/InteractiveElements';
import { Users, TrendingUp, Award, Zap } from 'lucide-react';

function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatsCard icon={Users} label="Users" value="1,234" trend="+12%" trendPositive />
      <StatsCard icon={TrendingUp} label="Revenue" value="$45.2K" trend="+8%" trendPositive />
      <StatsCard icon={Award} label="Rank" value="#5" trend="+2" trendPositive />
      <StatsCard icon={Zap} label="Activity" value="95%" trend="-3%" trendPositive={false} />
    </div>
  );
}
```

### Progress Tracking
```jsx
import { ProgressRing } from './components/InteractiveElements';
import { Card } from './components/ui';

function ProgressTracking() {
  return (
    <Card className="p-8">
      <h3 className="text-lg font-bold mb-6">Your Progress</h3>
      <div className="flex gap-8 justify-around">
        <ProgressRing percentage={75} label="Python" color="amber" />
        <ProgressRing percentage={60} label="JavaScript" color="cyan" />
        <ProgressRing percentage={45} label="React" color="rose" />
      </div>
    </Card>
  );
}
```

## 🎮 Interactive Lists

### Expandable List Items
```jsx
import { ExpandableCard } from './components/EnhancedPatterns';
import { Settings, Database, Shield } from 'lucide-react';

function SettingsList() {
  return (
    <div className="space-y-3">
      <ExpandableCard
        title="Account Settings"
        subtitle="Email, password, security"
        icon={Settings}
      >
        <p className="text-sm text-ink-400">Content here</p>
      </ExpandableCard>
      <ExpandableCard
        title="Data & Privacy"
        subtitle="Control your data"
        icon={Database}
      >
        <p className="text-sm text-ink-400">Content here</p>
      </ExpandableCard>
      <ExpandableCard
        title="Security"
        subtitle="Two-factor auth, sessions"
        icon={Shield}
      >
        <p className="text-sm text-ink-400">Content here</p>
      </ExpandableCard>
    </div>
  );
}
```

### Animated List Items
```jsx
import { motion } from 'framer-motion';
import { Card } from './components/ui';

function AnimatedList({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ x: 4 }}
        >
          <Card interactive className="p-4">
            {item.name}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
```

## 🎯 Multi-Step Forms

### Step Indicator
```jsx
import { StepIndicator } from './components/EnhancedPatterns';
import { Card, Button } from './components/ui';

function MultiStepForm() {
  const [step, setStep] = useState(0);
  
  const steps = ['Account', 'Profile', 'Preferences'];

  return (
    <Card className="space-y-6">
      <StepIndicator
        steps={steps}
        currentStep={step}
        onStepClick={setStep}
      />
      
      {/* Step content */}
      <div>
        {step === 0 && <p>Account setup...</p>}
        {step === 1 && <p>Profile setup...</p>}
        {step === 2 && <p>Preferences...</p>}
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </Button>
        <Button
          onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
          disabled={step === steps.length - 1}
        >
          Next
        </Button>
      </div>
    </Card>
  );
}
```

## ⚠️ Dialogs & Modals

### Confirmation Dialog
```jsx
import { ConfirmationDialog } from './components/EnhancedPatterns';
import { Button } from './components/ui';

function DeleteConfirmation() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button onClick={() => setShowDialog(true)} variant="ghost">
        Delete
      </Button>
      
      <ConfirmationDialog
        title="Delete item?"
        message="This action cannot be undone. Are you sure?"
        isOpen={showDialog}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          // Handle delete
          setShowDialog(false);
        }}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
}
```

## ⏳ Loading States

### Skeleton Loading
```jsx
import { PulsingSkeleton } from './components/InteractiveElements';
import { Card } from './components/ui';

function LoadingCard() {
  return (
    <Card className="space-y-4">
      <div className="flex gap-4">
        <PulsingSkeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <PulsingSkeleton className="h-4 w-2/3" />
          <PulsingSkeleton className="h-4 w-1/2" />
        </div>
      </div>
      <PulsingSkeleton className="h-24" />
    </Card>
  );
}
```

### Fallback Loading
```jsx
import { PulsingSkeleton } from './components/InteractiveElements';

function ContentWithFallback({ isLoading, children }) {
  if (isLoading) {
    return <PulsingSkeleton count={3} />;
  }
  return children;
}
```

## 🎨 Visual Elements

### Status Badges
```jsx
import { Badge } from './components/ui';

function StatusIndicator({ status }) {
  const variants = {
    pending: 'default',
    success: 'success',
    warning: 'warning',
    error: 'danger',
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}
```

### Notification Badge
```jsx
import { NotificationBadge } from './components/InteractiveElements';

function NotificationIcon() {
  return (
    <div className="relative">
      <button>🔔</button>
      <div className="absolute -top-2 -right-2">
        <NotificationBadge count={5} />
      </div>
    </div>
  );
}
```

## 🌐 Tooltips

### Tooltip Usage
```jsx
import { Tooltip } from './components/ui';
import { Button } from './components/ui';
import { Info } from 'lucide-react';

function TooltipExample() {
  return (
    <Tooltip label="This feature requires a premium account" position="right">
      <Button variant="secondary" className="gap-2">
        <Info size={16} />
        Learn More
      </Button>
    </Tooltip>
  );
}
```

## 🎬 Animations

### Custom Animated Element
```jsx
import { motion } from 'framer-motion';

function AnimatedCounter({ value, max = 100 }) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
    >
      <motion.span
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
      >
        {Math.round((value / max) * 100)}%
      </motion.span>
    </motion.div>
  );
}
```

## 📱 Responsive Grids

### Auto-responsive Grid
```jsx
function ResponsiveGrid({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}
```

---

## Tips & Tricks

1. **Always wrap lists with AnimatePresence for smooth removal**
   ```jsx
   import { AnimatePresence } from 'framer-motion';
   
   <AnimatePresence>
     {items.map(item => <Item key={item.id} />)}
   </AnimatePresence>
   ```

2. **Use `whileHover` and `whileTap` for feedback**
   ```jsx
   <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
     Click me
   </motion.button>
   ```

3. **Combine states for better UX**
   ```jsx
   <Input
     value={email}
     onChange={setEmail}
     success={isValid && touched}
     error={!isValid && touched}
   />
   ```

4. **Use delays for staggered animations**
   ```jsx
   {items.map((item, i) => (
     <motion.div
       key={item.id}
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       transition={{ delay: i * 0.1 }}
     >
       {item}
     </motion.div>
   ))}
   ```

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, TrendingUp, Zap, Target } from 'lucide-react';
import { Button, Card, Tabs, Badge, Tooltip } from './ui';
import {
  AnimatedCheckbox,
  AnimatedRadio,
  AnimatedSwitch,
  ProgressRing,
  StatsCard,
  AnimatedDropdown,
  NotificationBadge,
  AnimatedSlider,
  PulsingSkeleton,
} from './InteractiveElements';

/**
 * Interactive Components Showcase
 * Shows usage examples of all new interactive components
 */
export function InteractiveShowcase() {
  const [checkboxState, setCheckboxState] = useState(false);
  const [radioState, setRadioState] = useState('option1');
  const [switchState, setSwitchState] = useState(false);
  const [dropdownValue, setDropdownValue] = useState('');
  const [sliderValue, setSliderValue] = useState(50);
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      label: 'Forms',
      content: (
        <div className="space-y-6">
          <AnimatedCheckbox
            checked={checkboxState}
            onChange={setCheckboxState}
            label="Enable notifications"
          />
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink-200">Choose an option:</p>
            <AnimatedRadio
              checked={radioState === 'option1'}
              onChange={() => setRadioState('option1')}
              label="Option 1"
            />
            <AnimatedRadio
              checked={radioState === 'option2'}
              onChange={() => setRadioState('option2')}
              label="Option 2"
            />
            <AnimatedRadio
              checked={radioState === 'option3'}
              onChange={() => setRadioState('option3')}
              label="Option 3"
            />
          </div>
          <AnimatedSwitch
            enabled={switchState}
            onChange={setSwitchState}
            label="Dark mode"
          />
          <AnimatedDropdown
            items={[
              { label: 'Python', value: 'python' },
              { label: 'JavaScript', value: 'javascript' },
              { label: 'Java', value: 'java' },
              { label: 'C++', value: 'cpp' },
            ]}
            value={dropdownValue}
            onChange={setDropdownValue}
            placeholder="Select a language"
          />
          <AnimatedSlider
            value={sliderValue}
            onChange={setSliderValue}
            min={0}
            max={100}
            label="Difficulty Level"
          />
        </div>
      ),
    },
    {
      label: 'Stats & Progress',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              icon={Users}
              label="Total Users"
              value="2,453"
              trend="+12%"
              trendPositive={true}
            />
            <StatsCard
              icon={TrendingUp}
              label="Avg Score"
              value="78%"
              trend="+5%"
              trendPositive={true}
            />
            <StatsCard
              icon={Zap}
              label="Total XP"
              value="15.2K"
              trend="-2%"
              trendPositive={false}
            />
            <StatsCard
              icon={Target}
              label="Completion"
              value="92%"
              trend="+8%"
              trendPositive={true}
            />
          </div>
          <div className="flex gap-4 justify-around">
            <ProgressRing percentage={65} label="Python" color="amber" />
            <ProgressRing percentage={82} label="JavaScript" color="cyan" />
            <ProgressRing percentage={45} label="Java" color="rose" />
          </div>
        </div>
      ),
    },
    {
      label: 'Elements',
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default Badge</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip label="This is a helpful tip" position="top">
              <Button variant="secondary">Hover for tooltip</Button>
            </Tooltip>
            <div className="relative">
              <Button variant="secondary">
                Notifications
              </Button>
              <div className="absolute -top-2 -right-2">
                <NotificationBadge count={3} />
              </div>
            </div>
          </div>
          <Card className="p-6 space-y-4">
            <p className="text-sm font-semibold text-ink-200">Loading state example:</p>
            <PulsingSkeleton className="h-10" count={3} />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Interactive</p>
              <p className="text-sm font-bold text-ink-100">New UI Elements</p>
            </div>
          </div>
          <p className="text-sm text-ink-400">
            Enhanced form controls, progress indicators, and interactive components for better user experience.
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Smooth</p>
              <p className="text-sm font-bold text-ink-100">Animations</p>
            </div>
          </div>
          <p className="text-sm text-ink-400">
            All components include smooth transitions, hover effects, and spring animations for a modern feel.
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-bold text-ink-100 mb-4 font-display">Interactive Components</h2>
        <Tabs
          tabs={tabs}
          defaultTab={selectedTab}
          onChange={setSelectedTab}
        />
      </Card>
    </div>
  );
}

/**
 * Animated List Item Component
 * Use this for dynamic lists with smooth animations
 */
export function AnimatedListItem({ children, delay = 0, onHover, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={onHover || { x: 4, scale: 1.01 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated Modal Overlay Component
 */
export function ModalOverlay({ children, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * Animated Floating Action Button
 */
export function FloatingActionButton({ icon: Icon, onClick, tooltip = '', className = '' }) {
  return (
    <Tooltip label={tooltip} position="left">
      <motion.button
        onClick={onClick}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg flex items-center justify-center cursor-pointer z-40 ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 0 0px rgba(251, 191, 36, 0)',
            '0 0 0 10px rgba(251, 191, 36, 0)',
            '0 0 0 0px rgba(251, 191, 36, 0)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        <Icon size={24} />
      </motion.button>
    </Tooltip>
  );
}
